import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, CAPTURE_THE_BAG_ABI } from '../contract';

export function useWithdraw(address) {
  const { data: pendingAmount, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CAPTURE_THE_BAG_ABI,
    functionName: 'pendingWithdrawals',
    args: [address],
    chainId: baseSepolia.id,
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
      chainId: baseSepolia.id,
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
