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
import { canonicalJson } from '../common/canonical-json';
import { serialize } from '../common/serialize';
import {
  buildCustodyReceivedEvidence,
  canonicalCustodyReceivedJson,
} from '../custody/received-evidence';
import { PrismaService } from '../prisma/prisma.service';
import {
  ANCHOR_FAILED_MARKER,
  CUSTODY_RECEIVED_EVENT_KIND,
  deriveAnchorStatus,
  networkLabel,
  selectReusableAnchor,
} from './anchor-status';
import type { AnchorEvidenceDto } from './dto/anchor-evidence.dto';
import { fuelChainAbi } from './fuelchain.abi';

type DeploymentFile = {
  address: string;
  chainId?: number;
  abi?: unknown;
};

type ReceivedEventLike = {
  id: string;
  batchId: string;
  actorId: string | null;
  location: string | null;
  declaredVolume: { toString(): string } | string | number | null;
  measuredVolume: { toString(): string } | string | number | null;
  timestamp: Date;
  metadata?: unknown;
};

type ReceivedBatchLike = {
  id: string;
  batchCode: string;
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
    const contractAddress = this.contractAddress();

    return serialize({
      label: 'DEMO',
      note: 'Índice de evidencia tamper-evident. Tx reales requieren Hardhat local + deploy.',
      data: rows.map((r) => ({
        ...r,
        explorerUrl:
          explorerBase && r.transactionHash
            ? `${explorerBase.replace(/\/$/, '')}/tx/${r.transactionHash}`
            : null,
        status: deriveAnchorStatus(r),
        network: networkLabel(r.chainId),
        contractAddress,
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
      network: networkLabel(chainId ?? 31337),
      note: rpcReachable
        ? 'Nodo local listo. La recepción ancla sola; POST /blockchain/anchor sigue disponible.'
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

    const eventKind = dto.eventKind.trim();
    const payload = {
      batchCode: batch.batchCode,
      eventKind,
      note: dto.note ?? 'Live DEMO anchor',
      label: 'DEMO',
    };
    const dataHash = keccak256(stringToHex(canonicalJson(payload)));
    const written = await this.writeEvidenceOrThrow({
      batchId: batch.id,
      eventKind,
      dataHash,
      eventId: null,
    });

    return serialize({
      label: 'DEMO',
      live: true,
      note: 'Evidencia anclada on-chain (Hardhat local). No prueba litros físicos.',
      data: {
        ...written,
        status: deriveAnchorStatus(written),
        payload,
      },
    });
  }

  async anchorCustodyReceivedBestEffort(
    event: ReceivedEventLike,
    batch: ReceivedBatchLike,
  ) {
    const evidence = this.evidenceFromReceived(event, batch);
    const canonical = canonicalCustodyReceivedJson(evidence);
    const dataHash = keccak256(stringToHex(canonical));

    try {
      const existing = await this.findReusable(event.id, dataHash);
      if (existing && deriveAnchorStatus(existing) === 'CONFIRMED') {
        return this.presentAnchor(existing, evidence, canonical);
      }

      const ready = this.chainReady();
      if (!ready.ok) {
        const row = await this.upsertIndex({
          batchId: batch.id,
          eventId: event.id,
          eventKind: CUSTODY_RECEIVED_EVENT_KIND,
          dataHash,
          transactionHash: null,
          blockNumber: null,
          chainId: null,
          actorWallet: null,
          existingId: existing?.id,
        });
        return {
          ...this.presentAnchor(row, evidence, canonical),
          status: 'PENDING' as const,
          reason: ready.reason,
        };
      }

      const written = await this.writeEvidenceOrThrow({
        batchId: batch.id,
        eventKind: CUSTODY_RECEIVED_EVENT_KIND,
        dataHash,
        eventId: event.id,
        existingId: existing?.id,
      });

      await this.prisma.custodyEvent.update({
        where: { id: event.id },
        data: {
          evidenceHash: dataHash,
          transactionHash: written.transactionHash,
        },
      });

      return this.presentAnchor(written, evidence, canonical);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'anchor failed';
      this.logger.warn(`Custody anchor failed for ${event.id}: ${message}`);
      const existing = await this.findReusable(event.id, dataHash);
      const row = await this.upsertIndex({
        batchId: batch.id,
        eventId: event.id,
        eventKind: CUSTODY_RECEIVED_EVENT_KIND,
        dataHash,
        transactionHash: null,
        blockNumber: null,
        chainId: null,
        actorWallet: ANCHOR_FAILED_MARKER,
        existingId: existing?.id,
      });
      return {
        ...this.presentAnchor(row, evidence, canonical),
        status: 'FAILED' as const,
        error: message,
      };
    }
  }

  async retryCustodyAnchor(custodyEventId: string) {
    const event = await this.prisma.custodyEvent.findUnique({
      where: { id: custodyEventId },
      include: { batch: { select: { id: true, batchCode: true } } },
    });
    if (!event || event.eventType !== 'RECEIVED') {
      throw new NotFoundException(
        `Custody RECEIVED event not found: ${custodyEventId}`,
      );
    }
    return serialize({
      label: 'DEMO',
      data: await this.anchorCustodyReceivedBestEffort(event, event.batch),
    });
  }

  async verifyCustodyEvidence(custodyEventId: string) {
    const event = await this.prisma.custodyEvent.findUnique({
      where: { id: custodyEventId },
      include: { batch: { select: { id: true, batchCode: true } } },
    });
    if (!event || event.eventType !== 'RECEIVED') {
      throw new NotFoundException(
        `Custody RECEIVED event not found: ${custodyEventId}`,
      );
    }

    const evidence = this.evidenceFromReceived(event, event.batch);
    const canonical = canonicalCustodyReceivedJson(evidence);
    const recomputedHash = keccak256(stringToHex(canonical));

    const stored = await this.prisma.blockchainAnchor.findFirst({
      where: {
        OR: [{ eventId: event.id }, { dataHash: recomputedHash }],
      },
      orderBy: { timestamp: 'desc' },
    });

    const onChainStatus = stored ? deriveAnchorStatus(stored) : 'PENDING';
    const hashMatch = stored?.dataHash === recomputedHash;
    const confirmed = onChainStatus === 'CONFIRMED' && hashMatch;
    const verdict = confirmed ? 'MATCH' : 'MISMATCH';

    let receiptStatus: string | null = null;
    if (stored?.transactionHash && this.contractAddress()) {
      try {
        const receipt = await this.publicClient().getTransactionReceipt({
          hash: stored.transactionHash as Hex,
        });
        receiptStatus = receipt.status;
      } catch {
        receiptStatus = null;
      }
    }

    return serialize({
      label: 'DEMO',
      note:
        verdict === 'MATCH'
          ? 'La evidencia almacenada coincide con el hash anclado.'
          : 'El hash recalculado no coincide con un ancla confirmada. Esto no afirma ni niega litros físicos.',
      data: {
        verdict,
        hashMatch,
        onChainStatus,
        receiptStatus,
        recomputedHash,
        storedHash: stored?.dataHash ?? null,
        transactionHash: stored?.transactionHash ?? null,
        blockNumber: stored?.blockNumber?.toString() ?? null,
        contractAddress: this.contractAddress(),
        network: networkLabel(stored?.chainId ?? 31337),
        evidence,
        canonical,
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

  private evidenceFromReceived(
    event: ReceivedEventLike,
    batch: ReceivedBatchLike,
  ) {
    const meta = asRecord(event.metadata);
    const from =
      (typeof meta.cisternCode === 'string' && meta.cisternCode) ||
      (typeof meta.from === 'string' && meta.from) ||
      null;
    const volume = event.measuredVolume ?? event.declaredVolume ?? 0;
    return buildCustodyReceivedEvidence({
      batchId: batch.id,
      batchCode: batch.batchCode,
      custodyEventId: event.id,
      from,
      to: event.location,
      volumeLiters: volume,
      expectedVolumeLiters: event.declaredVolume,
      occurredAt: event.timestamp,
      actorId: event.actorId,
    });
  }

  private presentAnchor(
    row: {
      id: string;
      eventKind: string;
      eventId: string | null;
      dataHash: string;
      transactionHash: string | null;
      blockNumber: bigint | null;
      chainId: number | null;
      timestamp: Date;
      actorWallet: string | null;
    },
    evidence: ReturnType<typeof buildCustodyReceivedEvidence>,
    canonical: string,
  ) {
    return {
      id: row.id,
      status: deriveAnchorStatus(row),
      eventKind: row.eventKind,
      eventId: row.eventId,
      dataHash: row.dataHash,
      transactionHash: row.transactionHash,
      blockNumber: row.blockNumber?.toString() ?? null,
      chainId: row.chainId,
      network: networkLabel(row.chainId),
      contractAddress: this.contractAddress(),
      timestamp: row.timestamp,
      actorWallet: row.actorWallet,
      evidence,
      canonical,
    };
  }

  private async findReusable(eventId: string, dataHash: string) {
    const rows = await this.prisma.blockchainAnchor.findMany({
      where: {
        OR: [{ eventId }, { dataHash }],
      },
      orderBy: { timestamp: 'desc' },
    });
    return selectReusableAnchor(rows, eventId, dataHash);
  }

  private chainReady(): { ok: true } | { ok: false; reason: string } {
    if (!this.contractAddress()) {
      return {
        ok: false,
        reason: 'FUELCHAIN_CONTRACT_ADDRESS missing (Hardhat local DEMO)',
      };
    }
    if (!this.privateKey()) {
      return {
        ok: false,
        reason: 'BLOCKCHAIN_PRIVATE_KEY missing (Hardhat account #0 DEMO)',
      };
    }
    return { ok: true };
  }

  private async writeEvidenceOrThrow(input: {
    batchId: string;
    eventKind: string;
    dataHash: Hex;
    eventId: string | null;
    existingId?: string;
  }) {
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

    const account = privateKeyToAccount(key);
    const publicClient = this.publicClient();
    const walletClient = this.walletClient(account);
    const batchIdBytes = keccak256(stringToHex(input.batchId));

    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: fuelChainAbi,
      functionName: 'anchorEvidence',
      args: [batchIdBytes, input.eventKind, input.dataHash],
      account,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') {
      throw new BadRequestException(`Transaction reverted: ${hash}`);
    }

    const chainId = Number(await publicClient.getChainId());
    return this.upsertIndex({
      batchId: input.batchId,
      eventId: input.eventId,
      eventKind: input.eventKind,
      dataHash: input.dataHash,
      transactionHash: hash,
      blockNumber: receipt.blockNumber,
      chainId,
      actorWallet: account.address,
      existingId: input.existingId,
    });
  }

  private async upsertIndex(input: {
    batchId: string;
    eventId: string | null;
    eventKind: string;
    dataHash: string;
    transactionHash: string | null;
    blockNumber: bigint | null;
    chainId: number | null;
    actorWallet: string | null;
    existingId?: string;
  }) {
    const data = {
      batchId: input.batchId,
      eventKind: input.eventKind,
      eventId: input.eventId,
      dataHash: input.dataHash,
      transactionHash: input.transactionHash,
      blockNumber: input.blockNumber,
      chainId: input.chainId,
      actorWallet: input.actorWallet,
      timestamp: new Date(),
      isDemo: true,
    };

    if (input.existingId) {
      return this.prisma.blockchainAnchor.update({
        where: { id: input.existingId },
        data,
        include: { batch: { select: { batchCode: true, product: true } } },
      });
    }

    return this.prisma.blockchainAnchor.create({
      data,
      include: { batch: { select: { batchCode: true, product: true } } },
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

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
