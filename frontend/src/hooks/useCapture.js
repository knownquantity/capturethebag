import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI, CHAIN_ID } from '../contract';

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
      chainId: CHAIN_ID,
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
