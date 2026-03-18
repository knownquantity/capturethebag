import { formatEth } from '../utils/format';
import { useAccount } from 'wagmi';

function truncateAddress(addr) {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return '---';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function StatBar({ gameState }) {
  const { address } = useAccount();
  const {
    holder,
    capturePrice,
    pot,
    roundNumber,
    captureCount,
  } = gameState;

  const isHolder = address && holder && address.toLowerCase() === holder.toLowerCase();
  const isZeroHolder = !holder || holder === '0x0000000000000000000000000000000000000000';

  // Show next round number when waiting for a new round to start
  const displayRound = roundNumber != null
    ? (roundNumber === 0n ? '1' : (isZeroHolder ? (roundNumber + 1n).toString() : roundNumber.toString()))
    : '---';

  return (
    <div className="stat-bar">
      <div className="stat">
        <div className="stat-label">ROUND</div>
        <div className="stat-value">{displayRound}</div>
      </div>
      <div className="stat">
        <div className="stat-label">CAPTURE PRICE</div>
        <div className="stat-value stat-glow">
          {formatEth(capturePrice)} ETH
        </div>
      </div>
      <div className="stat">
        <div className="stat-label">BAG</div>
        <div className="stat-value stat-glow">
          {formatEth(pot)} ETH
        </div>
      </div>
      <div className="stat">
        <div className="stat-label">HOLDER</div>
        <div className="stat-value">{isHolder ? 'YOU' : truncateAddress(holder)}</div>
      </div>
      <div className="stat">
        <div className="stat-label">CAPTURES</div>
        <div className="stat-value">{captureCount != null ? captureCount.toString() : '---'}</div>
      </div>
    </div>
  );
}
