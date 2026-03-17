import { useReadContract, useAccount, usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI } from '../contract';

const DEPLOY_BLOCK = 38986880n;
const BATCH_SIZE = 10000n;

export function useReferral() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: baseSepolia.id });

  // Read who referred the connected wallet
  const { data: referrer } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CAPTURE_THE_BAG_ABI,
    functionName: 'referredBy',
    args: [address],
    chainId: baseSepolia.id,
    query: {
      enabled: !!address,
    },
  });

  // Calculate total referral earnings from BagCaptured events (batched)
  const { data: earnings, isLoading: isEarningsLoading } = useQuery({
    queryKey: ['referralEarnings', address, baseSepolia.id],
    queryFn: async () => {
      if (!address || !publicClient) return 0n;

      const currentBlock = await publicClient.getBlockNumber();
      let total = 0n;

      for (let from = DEPLOY_BLOCK; from <= currentBlock; from += BATCH_SIZE) {
        const to = from + BATCH_SIZE - 1n > currentBlock ? currentBlock : from + BATCH_SIZE - 1n;
        const logs = await publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: CAPTURE_THE_BAG_ABI,
          eventName: 'BagCaptured',
          fromBlock: from,
          toBlock: to,
        });

        for (const log of logs) {
          if (
            log.args.referrer &&
            log.args.referrer.toLowerCase() === address.toLowerCase() &&
            log.args.referralPaid
          ) {
            total += log.args.referralPaid;
          }
        }
      }
      return total;
    },
    enabled: !!address && !!publicClient,
    refetchInterval: 30000,
  });

  // Build referral URL for connected wallet
  const referralUrl = address ? `capturethebag.wtf/${address}` : null;

  return {
    referrer,
    earnings: earnings ?? 0n,
    isEarningsLoading,
    referralUrl,
  };
}
