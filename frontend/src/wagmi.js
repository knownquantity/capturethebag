import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

const rpcSepolia = import.meta.env.VITE_RPC_HTTP_SEPOLIA || 'https://sepolia.base.org';
const rpcMainnet = import.meta.env.VITE_RPC_HTTP_MAINNET || 'https://mainnet.base.org';

export const config = getDefaultConfig({
  appName: 'Capture the Bag',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'PLACEHOLDER',
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(rpcMainnet),
    [baseSepolia.id]: http(rpcSepolia),
  },
});
