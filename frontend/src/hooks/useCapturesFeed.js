import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI, CHAIN_ID } from '../contract';

const DEPLOY_BLOCK = CHAIN_ID === 8453 ? 43493485n : 39001285n;
const BATCH_SIZE = 10000n;

export function useCapturesFeed(currentRound) {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });

  const { data: captures, isLoading } = useQuery({
    queryKey: ['capturesFeed', CHAIN_ID, currentRound?.toString()],
    queryFn: async () => {
      if (!publicClient) return [];

      const currentBlock = await publicClient.getBlockNumber();
      const allLogs = [];

      for (let from = DEPLOY_BLOCK; from <= currentBlock; from += BATCH_SIZE) {
        const to = from + BATCH_SIZE - 1n > currentBlock ? currentBlock : from + BATCH_SIZE - 1n;
        const logs = await publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: CAPTURE_THE_BAG_ABI,
          eventName: 'BagCaptured',
          fromBlock: from,
          toBlock: to,
        });
        allLogs.push(...logs);
      }

      return allLogs
        .filter((log) => currentRound == null || log.args.roundNumber === currentRound)
        .map((log) => ({
          roundNumber: log.args.roundNumber,
          newHolder: log.args.newHolder,
          previousHolder: log.args.previousHolder,
          pricePaid: log.args.pricePaid,
          captureCount: log.args.captureCount,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        }))
        .reverse()
        .slice(0, 20);
    },
    enabled: !!publicClient,
    refetchInterval: 10000,
  });

  return {
    captures: captures ?? [],
    isLoading,
  };
}
