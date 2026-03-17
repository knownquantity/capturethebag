import { formatEther } from 'viem';

export function formatEth(wei, decimals = 3) {
  if (wei == null) return '---';
  const full = formatEther(wei);
  const [whole, dec = ''] = full.split('.');
  return `${whole}.${(dec + '0'.repeat(decimals)).slice(0, decimals)}`;
}
