import { useState, useEffect, useCallback } from 'react';
import { formatEth } from '../utils/format';
import { playModalOpenSound, playModalCloseSound, playCopySound } from '../utils/sound';

const MODAL_CONTENT = {
  rules: {
    heading: 'RULES',
    lines: [
      '══════════════════════════════════════════',
      '',
      'CAPTURE THE BAG IS A NOD TO THE ICONIC CHILDHOOD GAME OF',
      'CAPTURE THE FLAG AND A GAMIFIED COMMENTARY ON MODERN HUSTLE',
      'CULTURE. BUILT ON BASE.',
      '',
      '══════════════════════════════════════════',
      '',
      'ONE BAG. ONE HOLDER. A GROWING POT OF ETH.',
      'PAY THE CAPTURE PRICE TO BECOME THE CURRENT HOLDER.',
      '',
      'STARTING PRICE: 0.01 ETH',
      'PRICE ESCALATION: 1.15X PER CAPTURE',
      '',
      'IF 24 HOURS PASS WITH NO CAPTURE, THE HOLDER WINS',
      '95% OF THE POT. 5% IS ROLLED OVER TO THE NEXT ROUND.',
      '',
      'WINNERS CAN CLAIM MANUALLY BEFORE THE NEXT ROUND',
      'STARTS. IF SOMEONE STARTS A NEW ROUND FIRST, WINNINGS',
      'ARE SENT TO YOU AUTOMATICALLY.',
      '',
      'JUST LIKE IN MODERN HUSTLE CULTURE, EARLY PARTICIPATION',
      'IS REWARDED WITH NOTHING UNLESS YOU CAN AFFORD TO STAY',
      'UNTIL THE END. ROUNDS REACH EQUILIBRIUM WHEN THE',
      'CAPTURE PRICE EXCEEDS WHAT ANY REMAINING PLAYER IS',
      'WILLING TO PAY, AND THE 24-HOUR WINDOW IS THE',
      'MECHANISM CONFIRMING THAT.',
      '',
      'FEES (TAKEN AT CAPTURE):',
      '  PROTOCOL: 5%',
      '  REFERRAL (IF PRESENT): 5%',
      '  TO POT: 90-95%',
      '',
      '══════════════════════════════════════════',
    ],
  },
  fairness: {
    heading: 'FAIRNESS',
    lines: [
      '══════════════════════════════════════════',
      '',
      'CAPTURE THE BAG IS PROVABLY FAIR AND TRANSPARENT.',
      '',
      'ALL GAME LOGIC RUNS ONCHAIN.',
      'ALL TRANSACTIONS ARE PUBLICLY VERIFIABLE ON BASE.',
      'CONTRACT IS IMMUTABLE ONCE DEPLOYED.',
      'BAG IS DISTRIBUTED AUTOMATICALLY WHEN ROUND ENDS.',
      '',
      '══════════════════════════════════════════',
      '',
      'CONTRACT ADDRESS: PLACEHOLDER ADDRESS',
      '',
      'NETWORK: BASE SEPOLIA',
      'CHAIN ID: 84532',
      '',
      '══════════════════════════════════════════',
    ],
  },
  referrals: {
    heading: 'REFERRALS',
    lines: [
      '══════════════════════════════════════════',
      '',
      'EVERY WALLET HAS A UNIQUE REFERRAL URL.',
      '',
      '__REFERRAL_LINK__',
      '',
      'IF PLAYER A REFERS PLAYER B:',
      'A RECEIVES 5% OF B\'S FIRST CAPTURE FEE, SENT DIRECTLY',
      'TO A\'S WALLET IN THE SAME TRANSACTION. ONE TIME ONLY.',
      '',
      'SELF-REFERRAL IS BLOCKED.',
      'REFERRAL RELATIONSHIP IS PERMANENT ACROSS ALL ROUNDS.',
      '',
      '══════════════════════════════════════════',
      '',
      'WHY SHARE?',
      '',
      'EVERY CAPTURE THROUGH YOUR LINK PAYS YOU 5% IMMEDIATELY.',
      'SHARING IS REVENUE, NOT RISK.',
      '',
      '__REFERRAL_EARNINGS__',
      '══════════════════════════════════════════',
    ],
  },
};

const STATIC_DURATION = 120; // ms per frame, 2 frames
const LINE_DELAY = 40; // ms per line render

export default function GameModal({ modalId, onClose, walletAddress, referralEarnings }) {
  const [phase, setPhase] = useState('static-in'); // static-in | rendering | visible | static-out
  const [visibleLines, setVisibleLines] = useState(0);
  const [copied, setCopied] = useState(false);

  const content = MODAL_CONTENT[modalId];

  const referralUrl = walletAddress
    ? `capturethebag.wtf/${walletAddress}`
    : null;

  const handleCopyReferral = (e) => {
    e.stopPropagation();
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    playCopySound();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Static flash in + open sound
  useEffect(() => {
    if (phase === 'static-in') {
      playModalOpenSound();
      const t = setTimeout(() => setPhase('rendering'), STATIC_DURATION * 2);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Line-by-line render
  useEffect(() => {
    if (phase !== 'rendering') return;
    if (!content) return;

    const totalLines = content.lines.length + 2; // heading + blank + lines
    if (visibleLines >= totalLines) {
      setPhase('visible');
      return;
    }

    const t = setTimeout(() => setVisibleLines((v) => v + 1), LINE_DELAY);
    return () => clearTimeout(t);
  }, [phase, visibleLines, content]);

  // Close handler
  const handleClose = useCallback(() => {
    if (phase === 'static-in' || phase === 'static-out') return;
    setPhase('static-out');
    playModalCloseSound();
    setTimeout(() => onClose(), STATIC_DURATION * 2);
  }, [phase, onClose]);

  // Any keypress or click closes
  useEffect(() => {
    if (phase !== 'rendering' && phase !== 'visible') return;

    const handler = () => handleClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleClose]);

  if (!content) return null;

  // Static frames
  if (phase === 'static-in' || phase === 'static-out') {
    return <div className="modal-static" onClick={(e) => e.stopPropagation()} />;
  }

  // Build visible content
  const allLines = [content.heading, '', ...content.lines];
  const shownLines = allLines.slice(0, visibleLines);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        {shownLines.map((line, i) => {
          if (line === '__REFERRAL_EARNINGS__') {
            if (!walletAddress) return null;
            return (
              <div key={i} className="modal-line">
                YOUR REFERRAL EARNINGS: {formatEth(referralEarnings)} ETH
              </div>
            );
          }
          if (line === '__REFERRAL_LINK__') {
            return (
              <div key={i} className="modal-referral-row">
                <span className="modal-referral-url">
                  {referralUrl || 'CONNECT WALLET TO SEE LINK'}
                </span>
                {referralUrl && (
                  <button
                    className="modal-referral-copy"
                    onClick={handleCopyReferral}
                  >
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                )}
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`modal-line ${i === 0 ? 'modal-heading' : ''}`}
            >
              {line || '\u00A0'}
            </div>
          );
        })}
        {phase === 'visible' && (
          <div className="modal-prompt pixel-blink">
            {'\u25AE'} PRESS ANY KEY TO CONTINUE
          </div>
        )}
      </div>
    </div>
  );
}
