import { formatEth } from '../utils/format';

function truncateAddress(addr) {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return '---';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function CapturesFeed({ captures, isLoading }) {
  if (isLoading) {
    return (
      <div className="captures-feed">
        <div className="feed-title">RECENT CAPTURES</div>
        <div className="feed-empty">LOADING...</div>
      </div>
    );
  }

  if (captures.length === 0) {
    return (
      <div className="captures-feed">
        <div className="feed-title">RECENT CAPTURES</div>
        <div className="feed-empty">NO CAPTURES YET</div>
      </div>
    );
  }

  return (
    <div className="captures-feed">
      <div className="feed-title">RECENT CAPTURES</div>
      <div className="feed-list">
        {captures.map((c, i) => (
          <div key={`${c.transactionHash}-${i}`} className="feed-row">
            <span className="feed-addr">{truncateAddress(c.newHolder)}</span>
            <span className="feed-price">
              {formatEth(c.pricePaid)} ETH
            </span>
            <span className="feed-count">#{c.captureCount?.toString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
