import { useAccount } from 'wagmi';
import { formatEth } from '../utils/format';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function CaptureButton({
  capturePrice,
  startPrice,
  holder,
  canClaim,
  capture,
  referrer,
  isCapturePending,
  isCaptureConfirming,
  isCaptureError,
  captureError,
  resetCapture,
  claimWinnings,
  isClaimPending,
  isClaimConfirming,
}) {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="capture-button-wrap">
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button className="capture-btn" onClick={openConnectModal}>
              CONNECT WALLET TO PLAY
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    );
  }

  const priceStr = formatEth(capturePrice);

  const isWinner =
    canClaim &&
    address &&
    holder &&
    address.toLowerCase() === holder.toLowerCase();

  if (canClaim) {
    if (isWinner) {
      return (
        <div className="capture-button-wrap">
          <button
            className="capture-btn capture-btn-claim"
            onClick={() => claimWinnings()}
            disabled={isClaimPending || isClaimConfirming}
          >
            {isClaimPending
              ? 'CONFIRM IN WALLET...'
              : isClaimConfirming
                ? 'CONFIRMING...'
                : 'CLAIM WINNINGS'}
          </button>
        </div>
      );
    }
    const newRoundPrice = startPrice || capturePrice;
    const newRoundPriceStr = formatEth(newRoundPrice);
    return (
      <div className="capture-button-wrap">
        <button
          className="capture-btn"
          onClick={() => {
            if (isCaptureError) resetCapture?.();
            capture(referrer, newRoundPrice);
          }}
          disabled={isCapturePending || isCaptureConfirming || !newRoundPrice}
        >
          {isCapturePending
            ? 'CONFIRM IN WALLET...'
            : isCaptureConfirming
              ? 'CONFIRMING...'
              : `START NEW ROUND [${newRoundPriceStr} ETH]`}
        </button>
      </div>
    );
  }

  const isHolder =
    address &&
    holder &&
    address.toLowerCase() === holder.toLowerCase();

  return (
    <div className="capture-button-wrap">
      <button
        className="capture-btn"
        onClick={() => {
          if (isCaptureError) resetCapture?.();
          capture(referrer, capturePrice);
        }}
        disabled={isHolder || isCapturePending || isCaptureConfirming || !capturePrice}
      >
        {isHolder
          ? 'YOU HOLD THE BAG'
          : isCapturePending
            ? 'CONFIRM IN WALLET...'
            : isCaptureConfirming
              ? 'CONFIRMING...'
              : 'CAPTURE THE BAG'}
      </button>
      {isCaptureError && (
        <div className="capture-error">
          {(captureError?.shortMessage || captureError?.message || 'TX FAILED').includes('exceeds the balance')
            ? 'INSUFFICIENT FUNDS'
            : captureError?.shortMessage || captureError?.message || 'TX FAILED'}
        </div>
      )}
    </div>
  );
}
