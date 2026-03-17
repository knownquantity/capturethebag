import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { playCaptureSound, playWinSound, playLoseSound, playClaimSound } from './utils/sound';
import { useGameState } from './hooks/useGameState';
import { useCapture } from './hooks/useCapture';
import { useClaimWinnings } from './hooks/useClaimWinnings';
import { useReferral } from './hooks/useReferral';
import AgentBanner from './components/AgentBanner';
import BagLogo from './components/BagLogo';
import StatBar from './components/StatBar';
import Timer from './components/Timer';
import CaptureButton from './components/CaptureButton';
import TaglineMarquee from './components/TaglineMarquee';
import GameModal from './components/GameModal';

function getReferrerFromUrl() {
  const path = window.location.pathname.replace(/^\//, '');
  if (/^0x[a-fA-F0-9]{40}$/.test(path)) return path;
  return null;
}

function App() {
  const [activeModal, setActiveModal] = useState(null);
  const [referrer] = useState(() => getReferrerFromUrl());
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const gameState = useGameState();
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
    isSuccess: claimSuccess,
  } = useClaimWinnings();
  const { earnings: referralEarnings } = useReferral();

  useEffect(() => {
    if (captureSuccess) playCaptureSound();
  }, [captureSuccess]);

  // Round end sound + persistent win banner
  const [prevCanClaim, setPrevCanClaim] = useState(false);
  useEffect(() => {
    if (gameState.canClaim && !prevCanClaim && !gameState.isLoading) {
      const isWinner = address && gameState.holder &&
        address.toLowerCase() === gameState.holder.toLowerCase();
      if (isWinner) {
        playWinSound();
      } else if (address) {
        playLoseSound();
      }
    }
    setPrevCanClaim(gameState.canClaim);
  }, [gameState.canClaim, gameState.holder, gameState.isLoading, address, prevCanClaim]);

  useEffect(() => {
    if (claimSuccess) playClaimSound();
  }, [claimSuccess]);

  return (
    <div className="app-shell">
      <AgentBanner />

      <div className="nav-row">
        <button className="nav-btn nav-btn-green" onClick={() => setActiveModal('rules')}>RULES</button>
        <button className="nav-btn nav-btn-green" onClick={() => setActiveModal('fairness')}>FAIRNESS</button>
        <button className="nav-btn nav-btn-green" onClick={() => setActiveModal('referrals')}>REFERRALS</button>
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal }) => {
            if (!account) {
              return (
                <button className="nav-btn nav-btn-wallet" onClick={openConnectModal}>
                  CONNECT
                </button>
              );
            }
            return (
              <button className="nav-btn nav-btn-wallet" onClick={() => disconnect()}>
                {account.displayName}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </div>

      <div className="game-area">
        {gameState.isLoading ? (
          <div className="game-loading">LOADING...</div>
        ) : gameState.isError ? (
          <div className="game-loading">CONNECTION ERROR</div>
        ) : (
          <>
            <Timer
              windowExpiresAt={gameState.windowExpiresAt}
              canClaim={gameState.canClaim}
              lastCaptureTime={gameState.lastCaptureTime}
              holder={gameState.holder}
              pot={gameState.pot}
              roundNumber={gameState.roundNumber}
              address={address}
            />

            <BagLogo flash={captureSuccess} />

            <StatBar gameState={gameState} />

            <CaptureButton
              capturePrice={gameState.capturePrice}
              startPrice={gameState.startPrice}
              holder={gameState.holder}
              canClaim={gameState.canClaim}
              capture={capture}
              referrer={referrer}
              isCapturePending={isCapturePending}
              isCaptureConfirming={isCaptureConfirming}
              isCaptureError={isCaptureError}
              captureError={captureError}
              resetCapture={resetCapture}
              claimWinnings={claimWinnings}
              isClaimPending={isClaimPending}
              isClaimConfirming={isClaimConfirming}
            />
          </>
        )}
      </div>

      <TaglineMarquee />

      {activeModal && (
        <GameModal modalId={activeModal} onClose={() => setActiveModal(null)} walletAddress={address} referralEarnings={referralEarnings} />
      )}
    </div>
  );
}

export default App;
