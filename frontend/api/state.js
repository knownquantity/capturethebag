import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const CONTRACT_ADDRESS = '0xd1D37Ed6E6bc66C2ceBcBa037D7aE08423B463E';

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
  chain: baseSepolia,
  transport: http(process.env.RPC_HTTP_SEPOLIA || 'https://sepolia.base.org'),
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
      holder,
      capturePrice: capturePrice.toString(),
      pot: pot.toString(),
      lastCaptureTime: Number(lastCaptureTime),
      windowExpiresAt: Number(windowExpiresAt),
      roundNumber: Number(roundNumber),
      captureCount: Number(captureCount),
      canClaim,
      roundActive,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
