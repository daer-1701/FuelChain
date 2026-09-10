import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  stringToHex,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/serialize';
import { fuelChainAbi } from './fuelchain.abi';
import type { AnchorEvidenceDto } from './dto/anchor-evidence.dto';

type DeploymentFile = {
  address: string;
  chainId?: number;
  abi?: unknown;
};

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listAnchors(batchId?: string) {
    const rows = await this.prisma.blockchainAnchor.findMany({
      where: batchId ? { batchId } : undefined,
      orderBy: { timestamp: 'desc' },
      include: {
        batch: { select: { batchCode: true, product: true } },
      },
    });

    const explorerBase =
      process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ||
      process.env.BLOCK_EXPLORER_URL ||
      '';

    return serialize({
      label: 'DEMO',
      note: 'Índice de evidencia tamper-evident. Tx reales requieren Hardhat local + deploy.',
      data: rows.map((r) => ({
        ...r,
        explorerUrl:
          explorerBase && r.transactionHash
            ? `${explorerBase.replace(/\/$/, '')}/tx/${r.transactionHash}`
            : null,
        status: r.transactionHash ? 'ANCHORED' : 'PENDING',
      })),
    });
  }

  async getStatus() {
    const rpcUrl = this.rpcUrl();
    const contractAddress = this.contractAddress();
    const hasKey = Boolean(this.privateKey());
    let rpcReachable = false;
    let chainId: number | null = null;
    let blockNumber: string | null = null;
    let onChainAnchorCount: string | null = null;
    let error: string | null = null;

    try {
      const publicClient = this.publicClient();
      chainId = await publicClient.getChainId();
      blockNumber = (await publicClient.getBlockNumber()).toString();
      rpcReachable = true;

      if (contractAddress) {
        const count = await publicClient.readContract({
          address: contractAddress,
          abi: fuelChainAbi,
          functionName: 'getAnchorCount',
        });
        onChainAnchorCount = count.toString();
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'RPC unavailable';
    }

    return {
      label: 'DEMO',
      live: rpcReachable && Boolean(contractAddress) && hasKey,
      rpcUrl,
      rpcReachable,
      chainId,
      blockNumber,
      contractAddress,
      hasPrivateKey: hasKey,
      onChainAnchorCount,
      note: rpcReachable
        ? 'Nodo local listo. Usa POST /blockchain/anchor para demostrar en vivo.'
        : 'Arranca Hardhat node + deploy (ver docs/demo.md sección blockchain en vivo).',
      error,
    };
  }

  async anchorLive(dto: AnchorEvidenceDto) {
    const batch = await this.prisma.fuelBatch.findFirst({
      where: {
        OR: [{ batchCode: dto.batchCode }, { id: dto.batchCode }],
      },
    });
    if (!batch) {
      throw new NotFoundException(`Batch not found: ${dto.batchCode}`);
    }

    const contractAddress = this.contractAddress();
    const key = this.privateKey();
    if (!contractAddress) {
      throw new ServiceUnavailableException(
        'FUELCHAIN_CONTRACT_ADDRESS missing. Deploy with pnpm contracts:deploy',
      );
    }
    if (!key) {
      throw new ServiceUnavailableException(
        'BLOCKCHAIN_PRIVATE_KEY missing (use Hardhat account #0 for local DEMO)',
      );
    }

    const eventKind = dto.eventKind.trim();
    const payload = {
      batchCode: batch.batchCode,
      eventKind,
      note: dto.note ?? 'Live DEMO anchor',
      anchoredAt: new Date().toISOString(),
      label: 'DEMO',
    };
    const dataHash = keccak256(stringToHex(JSON.stringify(payload)));
    const batchIdBytes = keccak256(stringToHex(batch.id));

    const account = privateKeyToAccount(key);
    const publicClient = this.publicClient();
    const walletClient = this.walletClient(account);

    let hash: Hex;
    try {
      hash = await walletClient.writeContract({
        address: contractAddress,
        abi: fuelChainAbi,
        functionName: 'anchorEvidence',
        args: [batchIdBytes, eventKind, dataHash],
        account,
        chain: hardhat,
      });
    } catch (e) {
      this.logger.error('anchorEvidence failed', e);
      throw new BadRequestException(
        e instanceof Error ? e.message : 'On-chain anchor failed',
      );
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') {
      throw new BadRequestException(`Transaction reverted: ${hash}`);
    }

    const row = await this.prisma.blockchainAnchor.create({
      data: {
        batchId: batch.id,
        eventKind,
        eventId: null,
        dataHash,
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
        chainId: Number(await publicClient.getChainId()),
        actorWallet: account.address,
        timestamp: new Date(),
        isDemo: true,
      },
      include: {
        batch: { select: { batchCode: true, product: true } },
      },
    });

    return serialize({
      label: 'DEMO',
      live: true,
      note: 'Evidencia anclada on-chain (Hardhat local). No prueba litros físicos.',
      data: {
        ...row,
        status: 'ANCHORED',
        payload,
      },
    });
  }

  async verifyTx(txHash: string) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      throw new BadRequestException('Invalid transaction hash');
    }

    const publicClient = this.publicClient();
    let receipt;
    try {
      receipt = await publicClient.getTransactionReceipt({
        hash: txHash as Hex,
      });
    } catch {
      throw new NotFoundException('Transaction not found on connected RPC');
    }

    const db = await this.prisma.blockchainAnchor.findFirst({
      where: { transactionHash: txHash },
      include: { batch: { select: { batchCode: true } } },
    });

    return serialize({
      label: 'DEMO',
      live: true,
      data: {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber.toString(),
        status: receipt.status,
        from: receipt.from,
        to: receipt.to,
        indexedInDb: Boolean(db),
        batchCode: db?.batch.batchCode ?? null,
        eventKind: db?.eventKind ?? null,
        dataHash: db?.dataHash ?? null,
      },
    });
  }

  private rpcUrl() {
    return process.env.CHAIN_RPC_URL || 'http://127.0.0.1:8545';
  }

  private contractAddress(): Address | null {
    const fromEnv = process.env.FUELCHAIN_CONTRACT_ADDRESS?.trim();
    if (fromEnv && /^0x[a-fA-F0-9]{40}$/.test(fromEnv)) {
      return fromEnv as Address;
    }
    const deployment = this.readDeployment();
    if (deployment?.address && /^0x[a-fA-F0-9]{40}$/.test(deployment.address)) {
      return deployment.address as Address;
    }
    return null;
  }

  private privateKey(): Hex | null {
    const key = process.env.BLOCKCHAIN_PRIVATE_KEY?.trim();
    if (!key) return null;
    if (!/^0x[a-fA-F0-9]{64}$/.test(key)) {
      throw new ServiceUnavailableException(
        'BLOCKCHAIN_PRIVATE_KEY must be 0x + 64 hex chars',
      );
    }
    return key as Hex;
  }

  private publicClient(): PublicClient {
    return createPublicClient({
      chain: hardhat,
      transport: http(this.rpcUrl()),
    });
  }

  private walletClient(account: ReturnType<typeof privateKeyToAccount>): WalletClient {
    return createWalletClient({
      account,
      chain: hardhat,
      transport: http(this.rpcUrl()),
    });
  }

  private readDeployment(): DeploymentFile | null {
    const candidates = [
      join(process.cwd(), '..', '..', 'contracts', 'deployments', 'localhost.json'),
      join(process.cwd(), 'contracts', 'deployments', 'localhost.json'),
      join(__dirname, '..', '..', '..', '..', 'contracts', 'deployments', 'localhost.json'),
    ];
    for (const p of candidates) {
      if (!existsSync(p)) continue;
      try {
        return JSON.parse(readFileSync(p, 'utf8')) as DeploymentFile;
      } catch {
        this.logger.warn(`Could not parse deployment file ${p}`);
      }
    }
    return null;
  }
}
