import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI, CHAIN_ID } from '../contract';

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
      chainId: CHAIN_ID,
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
