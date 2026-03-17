// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CaptureTheBag.sol";

contract CaptureTheBagTest is Test {
    CaptureTheBag public game;

    address public protocol = makeAddr("protocol");
    address public alice    = makeAddr("alice");
    address public bob      = makeAddr("bob");
    address public charlie  = makeAddr("charlie");
    address public dave     = makeAddr("dave");

    function setUp() public {
        game = new CaptureTheBag(protocol);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        vm.deal(dave, 100 ether);
    }

    // ──────────────────── Helpers ──────────────────────
    function _capture(address who, address referrer) internal {
        uint256 price = game.roundActive() ? game.currentCapturePrice() : 0.01 ether;
        vm.prank(who);
        game.capture{value: price}(referrer);
    }

    function _capturePrice() internal view returns (uint256) {
        return game.roundActive() ? game.currentCapturePrice() : 0.01 ether;
    }

    // ──────────────────── Basic Capture ────────────────
    function test_firstCaptureStartsRound() public {
        assertFalse(game.roundActive());

        _capture(alice, address(0));

        assertTrue(game.roundActive());
        assertEq(game.roundNumber(), 1);
        assertEq(game.currentHolder(), alice);
        assertEq(game.captureCount(), 1);
    }

    function test_captureUpdatesHolder() public {
        _capture(alice, address(0));
        _capture(bob, address(0));

        assertEq(game.currentHolder(), bob);
        assertEq(game.captureCount(), 2);
    }

    function test_cannotCaptureSelf() public {
        _capture(alice, address(0));

        uint256 price = game.currentCapturePrice();
        vm.prank(alice);
        vm.expectRevert("Already the holder");
        game.capture{value: price}(address(0));
    }

    function test_insufficientPaymentReverts() public {
        vm.prank(alice);
        vm.expectRevert("Insufficient payment");
        game.capture{value: 0.001 ether}(address(0));
    }

    function test_excessIsRefunded() public {
        uint256 balBefore = alice.balance;
        uint256 price = 0.01 ether;

        vm.prank(alice);
        game.capture{value: price + 0.5 ether}(address(0));

        // Alice paid exactly the capture price (plus gas, but this is a test so no real gas)
        assertEq(balBefore - alice.balance, price);
    }

    // ──────────────────── Price Escalation ─────────────
    function test_priceEscalation() public {
        _capture(alice, address(0));

        uint256 expectedNext = (0.01 ether * 115) / 100;
        assertEq(game.currentCapturePrice(), expectedNext);

        _capture(bob, address(0));
        uint256 expectedSecond = (expectedNext * 115) / 100;
        assertEq(game.currentCapturePrice(), expectedSecond);
    }

    // ──────────────────── Fee Splits ──────────────────
    function test_protocolFeeAlwaysPaid() public {
        uint256 protocolBefore = protocol.balance;
        uint256 price = 0.01 ether;

        _capture(alice, address(0));

        uint256 expectedFee = (price * 5) / 100;
        assertEq(protocol.balance - protocolBefore, expectedFee);
    }

    function test_potReceives95PctWithoutReferral() public {
        uint256 price = 0.01 ether;
        _capture(alice, address(0));

        uint256 expectedPot = (price * 95) / 100;
        assertEq(game.pot(), expectedPot);
    }

    function test_potReceives90PctWithReferral() public {
        uint256 price = 0.01 ether;
        _capture(alice, bob); // bob is referrer

        uint256 expectedPot = (price * 90) / 100;
        assertEq(game.pot(), expectedPot);
    }

    // ──────────────────── Referral System ──────────────
    function test_referralPaidOnFirstCapture() public {
        uint256 bobBefore = bob.balance;
        uint256 price = 0.01 ether;

        _capture(alice, bob);

        uint256 expectedReferral = (price * 5) / 100;
        assertEq(bob.balance - bobBefore, expectedReferral);
        assertEq(game.referredBy(alice), bob);
    }

    function test_referralNotPaidOnSubsequentCaptures() public {
        _capture(alice, bob); // first capture, referral paid
        _capture(bob, address(0)); // bob captures

        uint256 bobBefore = bob.balance;
        uint256 price = game.currentCapturePrice();

        // Alice captures again — bob should NOT get referral again
        vm.prank(alice);
        game.capture{value: price}(bob);

        // Bob's balance unchanged from referral (he lost as holder, but no referral fee)
        assertEq(bob.balance, bobBefore);
        // Pot should get 95% since no new referral
        // (referredBy already set, so no referral fee)
    }

    function test_selfReferralBlocked() public {
        _capture(alice, alice); // tries self-referral

        // Referral should not be set
        assertEq(game.referredBy(alice), address(0));
        // Pot should get 95% (no referral)
        uint256 expectedPot = (0.01 ether * 95) / 100;
        assertEq(game.pot(), expectedPot);
    }

    function test_referralPermanentAcrossRounds() public {
        // Round 1: alice referred by bob
        _capture(alice, bob);
        assertEq(game.referredBy(alice), bob);

        // Complete round 1
        _capture(bob, address(0));
        vm.warp(block.timestamp + 24 hours);
        game.claimWinnings();

        // Round 2: alice tries to get referred by charlie
        uint256 charlieBefore = charlie.balance;
        _capture(alice, charlie);

        // Referral is still bob, charlie gets nothing
        assertEq(game.referredBy(alice), bob);
        assertEq(charlie.balance, charlieBefore);
    }

    function test_referralForMultipleNewWallets() public {
        // Bob refers alice and charlie
        uint256 bobBefore = bob.balance;

        _capture(alice, bob);
        uint256 price1 = 0.01 ether;

        _capture(bob, address(0)); // bob captures, no ref

        uint256 price3 = game.currentCapturePrice();
        _capture(charlie, bob);

        uint256 referral1 = (price1 * 5) / 100;
        uint256 referral3 = (price3 * 5) / 100;

        // Bob earned referral from alice's first capture AND charlie's first capture
        // But bob also paid a capture price, so let's check carefully
        // Bob started with 100 eth, paid one capture price, received two referral fees
        uint256 bobPaid = (0.01 ether * 115) / 100; // second capture price
        uint256 expectedBob = bobBefore - bobPaid + referral1 + referral3;
        assertEq(bob.balance, expectedBob);
    }

    // ──────────────────── Claim Winnings ───────────────
    function test_claimWinningsAfterInactivity() public {
        _capture(alice, address(0));
        _capture(bob, address(0));

        uint256 potBefore = game.pot();
        uint256 bobBefore = bob.balance;

        // Fast forward past inactivity window
        vm.warp(block.timestamp + 24 hours);

        // Anyone can call claimWinnings
        vm.prank(charlie);
        game.claimWinnings();

        uint256 winnerPayout = (potBefore * 95) / 100;
        uint256 rolloverAmt = potBefore - winnerPayout;

        assertEq(bob.balance - bobBefore, winnerPayout);
        assertEq(game.rollover(), rolloverAmt);
        assertFalse(game.roundActive());
        assertEq(game.currentHolder(), address(0));
    }

    function test_cannotClaimBeforeWindowExpires() public {
        _capture(alice, address(0));

        vm.warp(block.timestamp + 23 hours);

        vm.expectRevert("Inactivity window not expired");
        game.claimWinnings();
    }

    function test_cannotClaimWithNoActiveRound() public {
        vm.expectRevert("No active round");
        game.claimWinnings();
    }

    function test_autoResolveExpiredRound() public {
        _capture(alice, address(0));

        uint256 potBefore = game.pot();
        uint256 aliceBefore = alice.balance;

        vm.warp(block.timestamp + 24 hours);

        // Bob captures on expired round — auto-resolves, pays alice, starts new round
        uint256 startPrice = game.START_PRICE();
        vm.prank(bob);
        game.capture{value: startPrice}(address(0));

        // Alice received 95% of the old pot
        uint256 expectedPayout = (potBefore * 95) / 100;
        assertEq(alice.balance, aliceBefore + expectedPayout);

        // New round started, bob is holder
        assertEq(game.roundNumber(), 2);
        assertEq(game.currentHolder(), bob);
        assertTrue(game.roundActive());
    }

    // ──────────────────── Round Lifecycle ──────────────
    function test_fullRoundLifecycle() public {
        // Round 1
        _capture(alice, address(0));
        _capture(bob, address(0));
        _capture(charlie, address(0));

        assertEq(game.roundNumber(), 1);
        assertEq(game.captureCount(), 3);

        // Expire and claim
        vm.warp(block.timestamp + 24 hours);

        uint256 pot1 = game.pot();
        game.claimWinnings();

        uint256 expectedRollover = pot1 - (pot1 * 95) / 100;
        assertEq(game.rollover(), expectedRollover);
        assertFalse(game.roundActive());

        // Round 2 — starts with rollover as initial pot
        _capture(alice, address(0));

        assertEq(game.roundNumber(), 2);
        assertTrue(game.roundActive());
        assertEq(game.captureCount(), 1);

        // Pot should include rollover + 95% of capture price
        uint256 expectedPot = expectedRollover + (0.01 ether * 95) / 100;
        assertEq(game.pot(), expectedPot);
    }

    function test_rolloverSeedsNextRound() public {
        // Play round 1
        _capture(alice, address(0));
        vm.warp(block.timestamp + 24 hours);

        uint256 pot1 = game.pot();
        game.claimWinnings();

        uint256 rolloverAmt = game.rollover();
        assertTrue(rolloverAmt > 0);

        // Start round 2
        _capture(bob, address(0));

        // Pot should include rollover
        uint256 expectedPot = rolloverAmt + (0.01 ether * 95) / 100;
        assertEq(game.pot(), expectedPot);
        assertEq(game.rollover(), 0); // rollover consumed
    }

    // ──────────────────── getGameState ─────────────────
    function test_getGameStateReturnsCorrectData() public {
        _capture(alice, address(0));

        (
            address holder,
            uint256 capturePrice,
            uint256 potAmount,
            uint256 lastCapture,
            uint256 windowExpiresAt,
            uint256 round,
            uint256 captures,
            bool canClaim
        ) = game.getGameState();

        assertEq(holder, alice);
        assertEq(capturePrice, game.currentCapturePrice());
        assertEq(potAmount, game.pot());
        assertEq(lastCapture, block.timestamp);
        assertEq(windowExpiresAt, block.timestamp + 24 hours);
        assertEq(round, 1);
        assertEq(captures, 1);
        assertFalse(canClaim);
    }

    function test_getGameStateCanClaimTrue() public {
        _capture(alice, address(0));
        vm.warp(block.timestamp + 24 hours);

        (, , , , , , , bool canClaim) = game.getGameState();
        assertTrue(canClaim);
    }

    function test_getGameStateWhenInactive() public {
        (
            address holder,
            uint256 capturePrice,
            ,
            ,
            ,
            uint256 round,
            uint256 captures,
            bool canClaim
        ) = game.getGameState();

        assertEq(holder, address(0));
        assertEq(capturePrice, 0.01 ether);
        assertEq(round, 0);
        assertEq(captures, 0);
        assertFalse(canClaim);
    }

    // ──────────────────── Events ───────────────────────
    function test_bagCapturedEventEmitted() public {
        vm.expectEmit(true, true, true, true);
        emit CaptureTheBag.BagCaptured(
            1,                                  // roundNumber
            alice,                              // newHolder
            address(0),                         // previousHolder
            0.01 ether,                         // pricePaid
            (0.01 ether * 115) / 100,           // nextCapturePrice
            1,                                  // captureCount
            address(0),                         // referrer
            0,                                  // referralPaid
            (0.01 ether * 5) / 100,             // protocolPaid
            (0.01 ether * 95) / 100             // addedToPot
        );

        _capture(alice, address(0));
    }

    function test_roundWonEventEmitted() public {
        _capture(alice, address(0));
        uint256 potVal = game.pot();

        vm.warp(block.timestamp + 24 hours);

        vm.expectEmit(true, true, false, true);
        emit CaptureTheBag.RoundWon(
            1,
            alice,
            (potVal * 95) / 100,
            potVal - (potVal * 95) / 100,
            1,
            potVal
        );

        game.claimWinnings();
    }

    function test_roundStartedEventEmitted() public {
        vm.expectEmit(true, false, false, true);
        emit CaptureTheBag.RoundStarted(1, 0, block.timestamp);

        _capture(alice, address(0));
    }

    // ──────────────────── Edge Cases ──────────────────
    function test_captureAtExactWindowBoundary() public {
        _capture(alice, address(0));

        // Warp to exactly 24h - 1s: should still allow capture
        vm.warp(block.timestamp + 24 hours - 1);
        _capture(bob, address(0)); // should succeed

        // Warp to exactly 24h from bob's capture
        vm.warp(block.timestamp + 24 hours);

        // Can claim now
        (, , , , , , , bool canClaim) = game.getGameState();
        assertTrue(canClaim);
    }

    function test_manyCaptures() public {
        // Simulate 10 captures alternating between alice and bob
        for (uint256 i = 0; i < 10; i++) {
            address capturer = i % 2 == 0 ? alice : bob;
            uint256 price = _capturePrice();
            vm.prank(capturer);
            game.capture{value: price}(address(0));
        }

        assertEq(game.captureCount(), 10);
        // Price should have escalated 10 times
        uint256 expectedPrice = 0.01 ether;
        for (uint256 i = 0; i < 10; i++) {
            expectedPrice = (expectedPrice * 115) / 100;
        }
        assertEq(game.currentCapturePrice(), expectedPrice);
    }

    function test_permissionlessClaimWinnings() public {
        _capture(alice, address(0));
        vm.warp(block.timestamp + 24 hours);

        uint256 aliceBefore = alice.balance;

        // Dave (not the holder) calls claimWinnings
        vm.prank(dave);
        game.claimWinnings();

        // Alice (the holder) still gets paid
        assertTrue(alice.balance > aliceBefore);
    }

    // ──────────────────── Admin ────────────────────────
    function test_setProtocolWallet() public {
        address newWallet = makeAddr("newProtocol");
        game.setProtocolWallet(newWallet);
        assertEq(game.protocolWallet(), newWallet);
    }

    function test_onlyOwnerCanSetProtocolWallet() public {
        address newWallet = makeAddr("newProtocol");
        vm.prank(alice);
        vm.expectRevert();
        game.setProtocolWallet(newWallet);
    }
}
