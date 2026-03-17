const ABI = [
  {
    type: 'constructor',
    inputs: [{ name: '_protocolWallet', type: 'address' }],
  },
  {
    name: 'capture',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [],
  },
  {
    name: 'claimWinnings',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
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
    name: 'currentHolder',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'currentCapturePrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pot',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'lastCaptureTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'roundNumber',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'captureCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'rollover',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'roundActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'referredBy',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'protocolWallet',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'INACTIVITY_WINDOW',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'START_PRICE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'BagCaptured',
    type: 'event',
    inputs: [
      { name: 'roundNumber', type: 'uint256', indexed: true },
      { name: 'newHolder', type: 'address', indexed: true },
      { name: 'previousHolder', type: 'address', indexed: true },
      { name: 'pricePaid', type: 'uint256', indexed: false },
      { name: 'nextCapturePrice', type: 'uint256', indexed: false },
      { name: 'captureCount', type: 'uint256', indexed: false },
      { name: 'referrer', type: 'address', indexed: false },
      { name: 'referralPaid', type: 'uint256', indexed: false },
      { name: 'protocolPaid', type: 'uint256', indexed: false },
      { name: 'addedToPot', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'RoundWon',
    type: 'event',
    inputs: [
      { name: 'roundNumber', type: 'uint256', indexed: true },
      { name: 'winner', type: 'address', indexed: true },
      { name: 'winnerPayout', type: 'uint256', indexed: false },
      { name: 'rolloverAmount', type: 'uint256', indexed: false },
      { name: 'totalCaptures', type: 'uint256', indexed: false },
      { name: 'finalPot', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'RoundStarted',
    type: 'event',
    inputs: [
      { name: 'roundNumber', type: 'uint256', indexed: true },
      { name: 'startingPot', type: 'uint256', indexed: false },
      { name: 'startTimestamp', type: 'uint256', indexed: false },
    ],
  },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.status(200).json(ABI);
}
