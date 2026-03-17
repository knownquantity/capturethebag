import { useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI } from '../contract';

export function useGameState() {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CAPTURE_THE_BAG_ABI,
    functionName: 'getGameState',
    chainId: baseSepolia.id,
    query: {
      refetchInterval: 5000,
    },
  });

  const { data: startPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CAPTURE_THE_BAG_ABI,
    functionName: 'START_PRICE',
    chainId: baseSepolia.id,
  });

  if (!data) {
    return {
      holder: undefined,
      capturePrice: undefined,
      startPrice: startPrice ?? undefined,
      pot: undefined,
      lastCaptureTime: undefined,
      windowExpiresAt: undefined,
      roundNumber: undefined,
      captureCount: undefined,
      canClaim: undefined,
      isLoading,
      isError,
      error,
      refetch,
    };
  }

  const [holder, capturePrice, pot, lastCaptureTime, windowExpiresAt, roundNumber, captureCount, canClaim] = data;

  return {
    holder,
    capturePrice,
    startPrice: startPrice ?? undefined,
    pot,
    lastCaptureTime,
    windowExpiresAt,
    roundNumber,
    captureCount,
    canClaim,
    isLoading,
    isError,
    error,
    refetch,
  };
}
