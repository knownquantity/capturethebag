import { formatEther } from 'viem';

export function formatEth(wei) {
  if (wei == null) return '---';
  const full = formatEther(wei);
  // Show exactly 3 decimal places
  const [whole, dec = ''] = full.split('.');
  return `${whole}.${(dec + '000').slice(0, 3)}`;
}
