import { useState, useEffect } from 'react';
import { formatEth } from '../utils/format';

export default function Timer({ windowExpiresAt, canClaim, lastCaptureTime, holder, pot, roundNumber, inactivityWindow, address }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // No active round or round ended waiting for next — show full inactivity window
  const isZeroHolder = !holder || holder === '0x0000000000000000000000000000000000000000';
  if (isZeroHolder && !canClaim) {
    const total = inactivityWindow ? Number(inactivityWindow) : 0;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return (
      <div className="timer">
        <div className="timer-value">{`${pad(h)}:${pad(m)}:${pad(s)}`}</div>
      </div>
    );
  }

  const expiresAt = Number(windowExpiresAt);

  if (canClaim) {
    const isWinner = address && holder &&
      address.toLowerCase() === holder.toLowerCase();
    const winnerLabel = isWinner
      ? 'YOU'
      : holder ? `${holder.slice(0, 6)}...${holder.slice(-3)}` : '???';
    const winAmount = pot ? formatEth((pot * 95n) / 100n) : '---';
    const rolloverAmount = pot ? formatEth(pot - (pot * 95n) / 100n) : '---';
    const nextRound = roundNumber != null ? (Number(roundNumber) + 1).toString() : '?';
    return (
      <div className="timer">
        <div className="timer-value timer-expired timer-blink">
          ROUND OVER &mdash; {winnerLabel} WON {winAmount} ETH
        </div>
        <div className="timer-value timer-expired timer-blink timer-sub">
          {rolloverAmount} ETH ROLLED OVER TO ROUND #{nextRound}
        </div>
      </div>
    );
  }

  const remaining = Math.max(0, expiresAt - now);

  if (remaining === 0) {
    return (
      <div className="timer">
        <div className="timer-value timer-expired">00:00:00</div>
      </div>
    );
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const isUrgent = remaining > 0 && remaining < 3600;

  return (
    <div className="timer">
      <div
        className={`timer-value ${isUrgent ? 'timer-urgent timer-blink' : ''}`}
      >
        {timeStr}
      </div>
    </div>
  );
}
