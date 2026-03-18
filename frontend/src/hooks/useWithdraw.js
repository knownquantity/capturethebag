import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI, CHAIN_ID } from '../contract';

export function useWithdraw(address) {
  const { data: pendingAmount, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CAPTURE_THE_BAG_ABI,
    functionName: 'pendingWithdrawals',
    args: [address],
    chainId: CHAIN_ID,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  const {
    writeContract,
    data: hash,
    isPending,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({ hash });

  function withdraw() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CAPTURE_THE_BAG_ABI,
      functionName: 'withdraw',
      chainId: CHAIN_ID,
    });
  }

  return {
    pendingAmount: pendingAmount || 0n,
    withdraw,
    isPending,
    isConfirming,
    isSuccess,
    refetch,
  };
}
