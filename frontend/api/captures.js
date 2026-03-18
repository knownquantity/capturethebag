import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const CONTRACT_ADDRESS = '0xCc4D523206b0d4C11fc96dcb7173a3A7fcC38428';
const DEPLOY_BLOCK = 43493485n;
const BATCH_SIZE = 10000n;

const ABI = [
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

  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  try {
    const currentBlock = await client.getBlockNumber();
    const allLogs = [];

    for (let from = DEPLOY_BLOCK; from <= currentBlock; from += BATCH_SIZE) {
      const to = from + BATCH_SIZE - 1n > currentBlock ? currentBlock : from + BATCH_SIZE - 1n;
      const logs = await client.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        eventName: 'BagCaptured',
        fromBlock: from,
        toBlock: to,
      });
      allLogs.push(...logs);
    }

    const captures = allLogs
      .map((log) => ({
        roundNumber: Number(log.args.roundNumber),
        newHolder: log.args.newHolder,
        previousHolder: log.args.previousHolder,
        pricePaid: log.args.pricePaid.toString(),
        nextCapturePrice: log.args.nextCapturePrice.toString(),
        captureCount: Number(log.args.captureCount),
        referrer: log.args.referrer,
        referralPaid: log.args.referralPaid.toString(),
        protocolPaid: log.args.protocolPaid.toString(),
        addedToPot: log.args.addedToPot.toString(),
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
      }))
      .reverse()
      .slice(0, limit);

    res.status(200).json(captures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
