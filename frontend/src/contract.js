export const CONTRACT_ADDRESS_SEPOLIA = import.meta.env.VITE_CONTRACT_ADDRESS_SEPOLIA || '0xd1D37Ed6E6bc66C2ceBcB0a037D7aE08423B463E';
export const CONTRACT_ADDRESS_MAINNET = import.meta.env.VITE_CONTRACT_ADDRESS_MAINNET || '0xCc4D523206b0d4C11fc96dcb7173a3A7fcC38428';

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 8453);
export const CONTRACT_ADDRESS = CHAIN_ID === 8453 ? CONTRACT_ADDRESS_MAINNET : CONTRACT_ADDRESS_SEPOLIA;

export const CAPTURE_THE_BAG_ABI = [
  {
    type: 'constructor',
    inputs: [{ name: '_protocolWallet', type: 'address' }],
  },
  // ── Core functions ──
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
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'pendingWithdrawals',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
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
  // ── State variables ──
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
  // ── Constants ──
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
  // ── Events ──
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
