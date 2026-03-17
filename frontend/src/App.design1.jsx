import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useGameState } from './hooks/useGameState';
import { useCapture } from './hooks/useCapture';
import { useClaimWinnings } from './hooks/useClaimWinnings';
import { useCapturesFeed } from './hooks/useCapturesFeed';
import { formatEth } from './utils/format';
import AgentBanner from './components/AgentBanner';
import BagLogo from './components/BagLogo';
import TaglineMarquee from './components/TaglineMarquee';

function truncAddr(addr) {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return '---';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function useCountdown(windowExpiresAt, lastCaptureTime) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  if (!lastCaptureTime || lastCaptureTime === 0n) return { timeStr: null, remaining: null };
  const remaining = Math.max(0, Number(windowExpiresAt) - now);
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return { timeStr: `${pad(h)}:${pad(m)}:${pad(s)}`, remaining };
}

function App() {
  const gameState = useGameState();
  const { address, isConnected } = useAccount();
  const {
    capture,
    isPending: isCapturePending,
    isConfirming: isCaptureConfirming,
    isSuccess: captureSuccess,
    isError: isCaptureError,
    error: captureError,
    reset: resetCapture,
  } = useCapture();
  const {
    claimWinnings,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
  } = useClaimWinnings();
  const { captures, isLoading: isFeedLoading } = useCapturesFeed();

  const { timeStr, remaining } = useCountdown(gameState.windowExpiresAt, gameState.lastCaptureTime);
  const isUrgent = remaining !== null && remaining > 0 && remaining < 3600;

  const isHolder = address && gameState.holder &&
    address.toLowerCase() === gameState.holder.toLowerCase();

  const priceStr = formatEth(gameState.capturePrice);

  const loaded = !gameState.isLoading && !gameState.isError;

  return (
    <>
      <AgentBanner />

      <div className="game-screen">
        {/* Wallet connect — top right */}
        <div className="wallet-corner">
          <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
        </div>

        {!loaded ? (
          <div className="game-loading">
            {gameState.isLoading ? 'LOADING...' : 'CONNECTION ERROR'}
          </div>
        ) : gameState.canClaim ? (
          /* ═══ CLAIM STATE ═══ */
          <>
            <div className="game-center">
              <div className="round-over pixel-blink">ROUND OVER</div>
              <BagLogo flash={true} />
              {isConnected ? (
                <button
                  className="capture-btn claim-btn pixel-blink"
                  onClick={() => claimWinnings()}
                  disabled={isClaimPending || isClaimConfirming}
                >
                  {isClaimPending ? 'CONFIRM IN WALLET...'
                    : isClaimConfirming ? 'CONFIRMING...'
                    : 'CLAIM NOW'}
                </button>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button className="capture-btn" onClick={openConnectModal}>
                      CONNECT TO CLAIM
                    </button>
                  )}
                </ConnectButton.Custom>
              )}
            </div>

            <div className="hud-bottom-bar">
              <div className="hud-bl">
                <div className="hud-label-line">ROUND</div>
                <div className="hud-val-line">{gameState.roundNumber?.toString() ?? '---'}</div>
                <div className="hud-label-line">BAG</div>
                <div className="hud-val-line">{formatEth(gameState.pot)} ETH</div>
                <div className="hud-label-line">BAG HOLDER</div>
                <div className="hud-val-line">{truncAddr(gameState.holder)}</div>
              </div>
            </div>
          </>
        ) : (
          /* ═══ NORMAL GAME STATE ═══ */
          <>
            {/* Center — bag + button only */}
            <div className="game-center">
              <BagLogo flash={captureSuccess} />

              {timeStr && (
                <div className={`game-timer${isUrgent ? ' timer-urgent pixel-blink' : ''}`}>
                  {timeStr}
                </div>
              )}

              {isConnected ? (
                <div className="btn-wrap">
                  <button
                    className="capture-btn"
                    onClick={() => {
                      if (isCaptureError) resetCapture?.();
                      capture(null, gameState.capturePrice);
                    }}
                    disabled={isHolder || isCapturePending || isCaptureConfirming || !gameState.capturePrice}
                  >
                    {isHolder ? 'YOU HOLD THE BAG'
                      : isCapturePending ? 'CONFIRM IN WALLET...'
                      : isCaptureConfirming ? 'CONFIRMING...'
                      : `CAPTURE THE BAG [${priceStr} ETH]`}
                  </button>
                  {isCaptureError && (
                    <div className="capture-error">
                      {captureError?.shortMessage || captureError?.message || 'TX FAILED'}
                    </div>
                  )}
                </div>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button className="capture-btn" onClick={openConnectModal}>
                      CONNECT WALLET TO PLAY
                    </button>
                  )}
                </ConnectButton.Custom>
              )}
            </div>

            {/* Bottom bar: info left, captures right */}
            <div className="hud-bottom-bar">
              <div className="hud-bl">
                <div className="hud-label-line">ROUND</div>
                <div className="hud-val-line">{gameState.roundNumber?.toString() ?? '---'}</div>
                <div className="hud-label-line">BAG</div>
                <div className="hud-val-line">{formatEth(gameState.pot)} ETH</div>
                <div className="hud-label-line">BAG HOLDER</div>
                <div className={`hud-val-line${isHolder ? ' pixel-blink' : ''}`}>
                  {truncAddr(gameState.holder)}
                </div>
              </div>
              <div className="hud-br">
                {captures.length > 0 ? captures.map((c, i) => (
                  <div key={`${c.transactionHash}-${i}`} className="feed-line">
                    #{c.captureCount?.toString()} {truncAddr(c.newHolder)}{' '}
                    <span className="feed-eth">{formatEth(c.pricePaid)}</span>
                  </div>
                )) : (
                  <div className="feed-line">NO CAPTURES YET</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <TaglineMarquee />
    </>
  );
}

export default App;
