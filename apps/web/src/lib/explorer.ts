export function explorerTxUrl(
  txHash: string | null | undefined,
  fromApi?: string | null,
): string | null {
  if (fromApi) return fromApi;
  const base = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL?.trim();
  if (!base || !txHash) return null;
  return `${base.replace(/\/$/, '')}/tx/${txHash}`;
}
