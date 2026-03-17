import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI } from '../contract';

export function useClaimWinnings() {
  const {
    writeContract,
    data: hash,
    isPending,
    isError: isWriteError,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  function claimWinnings() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CAPTURE_THE_BAG_ABI,
      functionName: 'claimWinnings',
      chainId: baseSepolia.id,
    });
  }

  return {
    claimWinnings,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: isWriteError || isReceiptError,
    error: writeError || receiptError,
    reset,
  };
}
