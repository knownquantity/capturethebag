import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI, CHAIN_ID } from '../contract';

export function useGameState() {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CAPTURE_THE_BAG_ABI,
    functionName: 'getGameState',
    chainId: CHAIN_ID,
    query: {
      refetchInterval: 5000,
    },
  });

  const { data: startPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CAPTURE_THE_BAG_ABI,
    functionName: 'START_PRICE',
    chainId: CHAIN_ID,
  });

  const { data: inactivityWindow } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CAPTURE_THE_BAG_ABI,
    functionName: 'INACTIVITY_WINDOW',
    chainId: CHAIN_ID,
  });

  if (!data) {
    return {
      holder: undefined,
      capturePrice: undefined,
      startPrice: startPrice ?? undefined,
      inactivityWindow: inactivityWindow ?? undefined,
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
    inactivityWindow: inactivityWindow ?? undefined,
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
