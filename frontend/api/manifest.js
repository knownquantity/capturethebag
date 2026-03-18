import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const CONTRACT_ADDRESS = '0xCc4D523206b0d4C11fc96dcb7173a3A7fcC38428';

const ABI = [
  {
    name: 'getGameState',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'holder', type: 'address' },
      { name: 'capturePrice', type: 'uint256' },
      { name: 'potAmount', type: 'uint256' },
      { name: 'lastCapture', type: 'uint256' },
      { name: 'windowExpiresAt', type: 'uint256' },
      { name: 'round', type: 'uint256' },
      { name: 'captures', type: 'uint256' },
      { name: 'canClaim', type: 'bool' },
    ],
  },
  {
    name: 'roundActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
];

const client = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_HTTP_MAINNET || 'https://mainnet.base.org'),
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const [gameState, roundActive] = await Promise.all([
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getGameState',
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'roundActive',
      }),
    ]);

    const [holder, capturePrice, pot, lastCaptureTime, windowExpiresAt, roundNumber, captureCount, canClaim] = gameState;

    res.status(200).json({
      game: 'Capture the Bag',
      version: '1.0.0',
      contract: {
        address: CONTRACT_ADDRESS,
        network: 'Base Mainnet',
        chainId: 8453,
        explorer: `https://basescan.org/address/${CONTRACT_ADDRESS}`,
      },
      state: {
        holder,
        capturePrice: capturePrice.toString(),
        pot: pot.toString(),
        lastCaptureTime: Number(lastCaptureTime),
        windowExpiresAt: Number(windowExpiresAt),
        roundNumber: Number(roundNumber),
        captureCount: Number(captureCount),
        canClaim,
        roundActive,
      },
      endpoints: {
        state: '/api/state',
        captures: '/api/captures',
        abi: '/api/abi',
        manifest: '/api/manifest',
      },
      files: {
        llms: '/llms.txt',
        skills: '/skills.md',
        robots: '/robots.txt',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
