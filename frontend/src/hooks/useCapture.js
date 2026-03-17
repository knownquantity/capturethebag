import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI } from '../contract';

export function useCapture() {
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

  function capture(referrer, value) {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CAPTURE_THE_BAG_ABI,
      functionName: 'capture',
      args: [referrer || '0x0000000000000000000000000000000000000000'],
      value,
      chainId: baseSepolia.id,
    });
  }

  return {
    capture,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: isWriteError || isReceiptError,
    error: writeError || receiptError,
    reset,
  };
}
