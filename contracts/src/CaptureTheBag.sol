// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CaptureTheBag is ReentrancyGuard, Ownable {
    // ──────────────────── Constants ────────────────────
    uint256 public constant INACTIVITY_WINDOW = 24 hours;
    uint256 public constant START_PRICE       = 0.01 ether;
    uint256 public constant PRICE_SCALE_NUM   = 115;
    uint256 public constant PRICE_SCALE_DEN   = 100;
    uint256 public constant PROTOCOL_FEE_PCT  = 5;
    uint256 public constant REFERRAL_FEE_PCT  = 5;
    uint256 public constant WINNER_PCT        = 95;
    uint256 public constant ROLLOVER_PCT      = 5;

    // ──────────────────── State ────────────────────────
    address public currentHolder;
    uint256 public currentCapturePrice;
    uint256 public pot;
    uint256 public lastCaptureTime;
    uint256 public roundNumber;
    uint256 public captureCount;
    uint256 public rollover;
    bool    public roundActive;

    address public protocolWallet;

    mapping(address => address) public referredBy;
    mapping(address => uint256) public pendingWithdrawals;

    // ──────────────────── Events ───────────────────────
    event BagCaptured(
        uint256 indexed roundNumber,
        address indexed newHolder,
        address indexed previousHolder,
        uint256 pricePaid,
        uint256 nextCapturePrice,
        uint256 captureCount,
        address referrer,
        uint256 referralPaid,
        uint256 protocolPaid,
        uint256 addedToPot
    );

    event RoundWon(
        uint256 indexed roundNumber,
        address indexed winner,
        uint256 winnerPayout,
        uint256 rolloverAmount,
        uint256 totalCaptures,
        uint256 finalPot
    );

    event RoundStarted(
        uint256 indexed roundNumber,
        uint256 startingPot,
        uint256 startTimestamp
    );

    // ──────────────────── Constructor ──────────────────
    constructor(address _protocolWallet) Ownable(msg.sender) {
        require(_protocolWallet != address(0), "Invalid protocol wallet");
        protocolWallet = _protocolWallet;
    }

    // ──────────────────── Core Functions ───────────────
    function capture(address referrer) external payable nonReentrant {
        // Auto-resolve expired round if needed
        if (roundActive && currentHolder != address(0) &&
            block.timestamp >= lastCaptureTime + INACTIVITY_WINDOW) {
            _resolveRound();
        }

        // Start new round if not active
        if (!roundActive) {
            _startNewRound();
        }

        // Cannot capture from yourself
        require(msg.sender != currentHolder, "Already the holder");

        // Must not have already expired
        if (currentHolder != address(0)) {
            require(
                block.timestamp < lastCaptureTime + INACTIVITY_WINDOW,
                "Round expired"
            );
        }

        // Must pay at least the current capture price
        require(msg.value >= currentCapturePrice, "Insufficient payment");

        // ── Fee distribution ──
        uint256 price = currentCapturePrice;

        // Protocol fee: always 5%
        uint256 protocolFee = (price * PROTOCOL_FEE_PCT) / 100;

        // Referral fee: 5% on first capture by referred wallet only
        uint256 referralFee = 0;
        address effectiveReferrer = address(0);

        if (referrer != address(0) && referrer != msg.sender) {
            if (referredBy[msg.sender] == address(0)) {
                // First time being referred — set permanent relationship
                referredBy[msg.sender] = referrer;
                effectiveReferrer = referrer;
                referralFee = (price * REFERRAL_FEE_PCT) / 100;
            }
            // If already referred, no referral fee paid
        }

        // Remainder goes to pot
        uint256 addedToPot = price - protocolFee - referralFee;
        pot += addedToPot;

        // Record state
        address previousHolder = currentHolder;
        currentHolder = msg.sender;
        lastCaptureTime = block.timestamp;
        captureCount += 1;

        // Compute next capture price
        uint256 nextPrice = (price * PRICE_SCALE_NUM) / PRICE_SCALE_DEN;
        currentCapturePrice = nextPrice;

        // ── Transfer fees ──
        _safeTransferETH(protocolWallet, protocolFee);

        if (referralFee > 0) {
            _safeTransferETH(effectiveReferrer, referralFee);
        }

        // Refund excess
        uint256 excess = msg.value - price;
        if (excess > 0) {
            _safeTransferETH(msg.sender, excess);
        }

        emit BagCaptured(
            roundNumber,
            msg.sender,
            previousHolder,
            price,
            nextPrice,
            captureCount,
            effectiveReferrer,
            referralFee,
            protocolFee,
            addedToPot
        );
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        _safeTransferETH(msg.sender, amount);
    }

    function claimWinnings() external nonReentrant {
        require(roundActive, "No active round");
        require(currentHolder != address(0), "No holder");
        require(
            block.timestamp >= lastCaptureTime + INACTIVITY_WINDOW,
            "Inactivity window not expired"
        );

        _resolveRound();
    }

    function getGameState() external view returns (
        address holder,
        uint256 capturePrice,
        uint256 potAmount,
        uint256 lastCapture,
        uint256 windowExpiresAt,
        uint256 round,
        uint256 captures,
        bool canClaim
    ) {
        holder = currentHolder;
        capturePrice = roundActive ? currentCapturePrice : START_PRICE;
        potAmount = roundActive ? pot : rollover;
        lastCapture = lastCaptureTime;
        windowExpiresAt = lastCaptureTime > 0 ? lastCaptureTime + INACTIVITY_WINDOW : 0;
        round = roundNumber;
        captures = captureCount;
        canClaim = roundActive
            && currentHolder != address(0)
            && block.timestamp >= lastCaptureTime + INACTIVITY_WINDOW;
    }

    // ──────────────────── Admin ────────────────────────
    function setProtocolWallet(address _protocolWallet) external onlyOwner {
        require(_protocolWallet != address(0), "Invalid protocol wallet");
        protocolWallet = _protocolWallet;
    }

    // ──────────────────── Internal ─────────────────────
    function _resolveRound() internal {
        uint256 finalPot = pot;
        uint256 winnerPayout = (finalPot * WINNER_PCT) / 100;
        uint256 rolloverAmount = finalPot - winnerPayout;

        address winner = currentHolder;

        rollover = rolloverAmount;
        pot = 0;
        currentHolder = address(0);
        currentCapturePrice = START_PRICE;
        roundActive = false;

        uint256 totalCaptures = captureCount;
        captureCount = 0;

        // Try to push ETH to winner; fall back to pull if recipient reverts
        (bool success, ) = winner.call{value: winnerPayout}("");
        if (!success) {
            pendingWithdrawals[winner] += winnerPayout;
        }

        emit RoundWon(
            roundNumber,
            winner,
            winnerPayout,
            rolloverAmount,
            totalCaptures,
            finalPot
        );
    }

    function _startNewRound() internal {
        roundNumber += 1;
        roundActive = true;
        pot = rollover;
        rollover = 0;
        currentCapturePrice = START_PRICE;
        captureCount = 0;
        currentHolder = address(0);
        lastCaptureTime = 0;

        emit RoundStarted(roundNumber, pot, block.timestamp);
    }

    function _safeTransferETH(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
    }
}
