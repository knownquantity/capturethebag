# Capture the Bag — CLAUDE.md

## Concept

Capture the Bag is a simple, viral onchain game built on Base. A commentary on modern hustle culture — the cost of entry keeps rising, passive holding loses ground, and the opportunity closes when everyone stops trying.

**Tagline: "Capture the Flag ended at recess. Capture the Bag pays rent."**

Built for humans and autonomous agents alike.

---

## How It Works

One bag. One holder. A growing pot of ETH. Pay to capture the bag. If nobody captures it from you for 24 hours, you win.

The capture price starts low and increases 1.15× with every capture. Early rounds are accessible to anyone. As the round matures, the price escalates until only serious players can afford to compete. The pot they helped build gets won by whoever could afford to stay in longest. That's the commentary.

---

## Game Mechanics

### Capture
- Pay the current capture price to become the bag holder
- Starting price: **0.01 ETH**
- Price escalation: **1.15× per capture** (exponential)
- Any wallet can capture except the current holder
- Previous holder is immediately displaced — no delay, no defense mechanic

### Win Condition
- If **24 hours pass with no capture**, the current holder wins
- The inactivity timer resets to 24 hours on every capture
- There is no fixed round end block — the round ends when competition stops

### Pot
- Every capture fee accumulates into the shared pot
- Protocol takes 5% of each capture fee at time of capture (before pot)
- Referral bonus (if applicable) also taken at time of capture (before pot)
- Remainder goes into the pot

### Payout on Win
| Recipient | Share |
|---|---|
| Winner (holder when 24h expires) | 95% of pot |
| Rollover (seeds next round) | 5% of pot |

Winner claims via `claimWinnings()`. Anyone can call `claimWinnings()` once the 24-hour window has passed — it pays the winner and holds the rollover in the contract. The next round does not start automatically. It starts when the first capture of the new round is made.

---

## Fee Structure

Fees are taken **at time of capture**, not at round end.

| Recipient | Amount | Condition |
|---|---|---|
| Protocol wallet | 5% of capture price | Every capture, always |
| Referrer | 5% of capture price | First capture by referred wallet only |
| Pot | 90% of capture price | With referral present |
| Pot | 95% of capture price | No referral present |

Protocol fee is continuous revenue — paid on every transaction regardless of round outcome.

---

## Referral System

### Mechanic
- Every wallet has a unique referral URL: `capturethebag.wtf/0x[walletaddress]`
- The referrer's wallet address is passed as a parameter in the capture transaction
- If Player A refers Player B: A receives 5% of B's capture fee **on B's first capture only**
- Subsequent captures by B generate no referral fee for A
- If Player C later captures through A's link: A receives 5% of C's first capture fee
- One payment per unique referred wallet, ever — across all rounds

### Rules
- Self-referral blocked at contract level: `referrer != msg.sender`
- Referral relationship is permanent — set on first capture, never changes
- `referredBy` mapping persists across rounds — B can only ever be referred once
- If no referral address is passed: that 5% stays in the pot (95% to pot instead of 90%)

### Why This Works
The current holder is incentivized to share their referral link even though it might lead to someone capturing from them — because every capture through their link pays them 5% immediately, regardless of whether they still hold the bag. Sharing is a revenue event, not a risk.

---

## Round Structure

| Parameter | Value |
|---|---|
| Starting capture price | 0.01 ETH |
| Price escalation | 1.15× per capture |
| Inactivity window | 24 hours (`block.timestamp`) |
| Win condition | 24 hours since last capture |
| Round end | Triggered by `claimWinnings()` call after window expires |
| Next round | Starts on first capture after `claimWinnings()` is called |
| Starting pot | Rollover from previous round (5% of previous pot) |

---

## Price Escalation Reference

Cumulative pot reflects **95% of each capture fee** after the 5% protocol fee is deducted at time of capture. Assumes no referral present on any capture — if referrals are present, pot receives 90% per capture instead.

| Capture # | Price (ETH) | Cumulative Pot (ETH) |
|---|---|---|
| 1 | 0.0100 | 0.0095 |
| 5 | 0.0174 | 0.0724 |
| 10 | 0.0350 | 0.1992 |
| 15 | 0.0706 | 0.4588 |
| 20 | 0.1423 | 0.9592 |
| 25 | 0.2870 | 1.9090 |
| 30 | 0.5787 | 3.7269 |

At 1.15× escalation, casual players (max ~0.05 ETH) are priced out around capture #13. Engaged players (max ~0.15 ETH) around capture #20. The late-round standoff is between serious and whale-tier players competing over a pot that everyone helped build.

---

## Smart Contract

### Stack
- **Language:** Solidity ^0.8.24
- **Framework:** Foundry
- **Dependencies:** OpenZeppelin (ReentrancyGuard, Ownable)
- **Network:** Base Mainnet
- **Timing:** `block.timestamp` for 24-hour inactivity window

### State Variables
```solidity
address public currentHolder;
uint256 public currentCapturePrice;   // current price to capture the bag
uint256 public pot;                    // accumulated ETH this round
uint256 public lastCaptureTime;        // timestamp of last capture
uint256 public roundNumber;            // increments each round
uint256 public captureCount;           // total captures this round
uint256 public rollover;               // amount seeded from previous round
bool    public roundActive;            // false if waiting for claimWinnings()

mapping(address => address) public referredBy;  // permanent referral relationship
```

### Constants
```solidity
uint256 constant INACTIVITY_WINDOW    = 24 hours;
uint256 constant START_PRICE          = 0.01 ether;
uint256 constant PRICE_SCALE_NUM      = 115;   // 1.15x
uint256 constant PRICE_SCALE_DEN      = 100;
uint256 constant PROTOCOL_FEE_PCT     = 5;
uint256 constant REFERRAL_FEE_PCT     = 5;
uint256 constant WINNER_PCT           = 95;
uint256 constant ROLLOVER_PCT         = 5;
```

### Core Functions
```solidity
// Capture the bag. Pass referrer address or address(0) if none.
function capture(address referrer) external payable

// Claim winnings once 24-hour window has expired. Pays winner, holds rollover.
// Does NOT start next round. Next round starts on first capture.
// Permissionless — anyone can call this.
function claimWinnings() external

// Read current game state. Machine-readable for agent discovery.
function getGameState() external view returns (
    address holder,
    uint256 capturePrice,
    uint256 pot,
    uint256 lastCaptureTime,
    uint256 windowExpiresAt,
    uint256 roundNumber,
    uint256 captureCount,
    bool    canClaim
)
```

### Events
```solidity
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
```

### Security
- `ReentrancyGuard` on `capture()` and `claimWinnings()`
- Self-referral blocked: `referrer != msg.sender`
- Referral only paid on first capture by referred wallet
- `claimWinnings()` checks `block.timestamp >= lastCaptureTime + INACTIVITY_WINDOW`
- Safe ETH transfers via `.call{value: amount}("")` with revert on failure
- Excess ETH refunded if overpaid

---

## Frontend

### Stack
- React or vanilla JS
- RainbowKit or similar for wallet connection
- Base network
- Polling or WebSocket for live updates

### Core UI Elements
```
Pot size                — prominent, ETH only (no USD conversion)
Current capture price   — next to capture button
Inactivity timer        — countdown to round end, resets on each capture
Capture count           — shows round progression, signals where in the arc we are
Current holder          — truncated address
Capture button          — large, chunky, shows exact cost
Round number            — context for returning players
Recent captures feed    — live activity, most recent at top
```

### Agent Banner
A persistent banner visible on the main game UI — not inside a modal, always present — that signals to agents and agent-aware humans that this game is agent-native.

**Placement:** Fixed to the top of the page, above the main game UI. Full width. Compact height — single line on desktop.

**Content:**
```
[🤖 AGENTS WELCOME]  This game is agent-native.  skills.md  [COPY]
```

- `skills.md` is a clickable link that opens `capturethebag.wtf/skills.md` in a new tab
- `[COPY]` button copies the full raw contents of `skills.md` to the clipboard immediately on click — no modal, no confirmation, just copy
- On successful copy: button briefly changes to `[COPIED ✓]` then resets after 2 seconds
- The banner fetches `skills.md` content on page load and holds it in memory so the copy is instant

**Style:** Pixel font, black background, amber `#ffb000` text — consistent with the overall aesthetic but visually distinct from the main game UI so it reads as a separate layer. Thin pixel border on the bottom edge separating it from the game.

**Purpose:** Any agent or agent framework that visits the page sees immediately that a skills.md exists and can copy it into context in one click. Mirrors the pattern established by tiltgame.fun.
"Capture the Flag ended at recess. Capture the Bag pays rent." — displayed as a **marquee scrolling across the bottom of the screen**, always visible, looping continuously. Monospace, small, unobtrusive but always present. No dedicated lore modal.

### Design Aesthetic
The visual language is **Atari 2600** — not generic retro, specifically the chunky pixelated aesthetic of late-70s / early-80s cartridge games. Think Combat, Adventure, Missile Command. Every element should feel like it belongs on a CRT television in 1980.

**Color palette:**
- Background: `#000000` pure black
- Primary text: `#ffffff` white
- Accent / active state: amber `#ffb000` or Atari orange `#e85d04`
- Urgency (timer low): red `#ff0000`
- Secondary text: dim white `#888888`

**Typography:**
- All text: pixel / bitmap font — use `Press Start 2P` (Google Fonts) throughout
- No smooth fonts anywhere. Everything is chunky and pixelated.

**Bag logo:**
- A pixelated money bag rendered as a proper pixel art sprite — square pixels, limited color palette, Atari-style
- Sits **center screen** as the hero element of the page
- Also used as the **favicon** (export as 32×32 and 16×16 PNG)
- Should animate subtly — a slow pixel-by-pixel pulse or flicker, not smooth CSS animation
- When a capture happens, brief flash/flicker animation on the bag

**Layout:**
- Single page, no scroll
- Arcade cabinet feel — all key information visible without scrolling
- Stats arranged around or below the central bag logo
- Large capture button below the bag, full-width on mobile

**Effects:**
- Scanline overlay (subtle CSS repeating-linear-gradient, low opacity)
- Text glow on key numbers (pot size, capture price) using CSS text-shadow
- CRT screen curvature optional — border-radius on the main container with slight vignette
- Pixel borders (CSS border using repeating pixel pattern or box-shadow stacking)
- Timer urgency: when under 1 hour remaining, timer text turns red and blinks

**No smooth animations.** Transitions should feel instant or stepped — like frame updates on old hardware, not modern easing curves.

### Modals
Three header modals, accessible via pixelated bracket-style buttons `[RULES]` `[FAIRNESS]` `[REFERRALS]`:

1. **Rules** — how to play, example round with numbers, fee explanation (5% protocol, 5% referral, 95%/90% to pot)
2. **Fairness** — contract address linking to BaseScan, open source statement, no admin keys statement, raw contract address, ABI download link, agent manifest endpoint (`/api/manifest`), links to `llms.txt` and `skills.md`
3. **Referrals** — shows connected wallet's unique referral URL (`capturethebag.wtf/0x...`), one-click copy button, explanation of how referral bonus works, running total of referral earnings for connected wallet

---

## Build Steps

Follow these steps in order. Complete and verify each phase before moving to the next.

### Phase 1 — Contract
1. `forge init capture-the-bag && cd capture-the-bag`
2. `forge install OpenZeppelin/openzeppelin-contracts`
3. Write `src/CaptureTheBag.sol` per the spec above
4. Write `test/CaptureTheBag.t.sol` — cover: capture, claimWinnings, referral, round lifecycle, fee splits, edge cases
5. `forge test` — all tests must pass
6. `forge build` — no warnings
7. Write `script/Deploy.s.sol`
8. Deploy to Base Sepolia testnet: `forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast`
9. Verify on BaseScan: `forge verify-contract`
10. Run full end-to-end test on testnet — complete at least one full round including claimWinnings

### Phase 2 — Frontend scaffold
1. `npm create vite@latest frontend -- --template react`
2. Install dependencies: `wagmi`, `viem`, `@rainbow-me/rainbowkit`, `@tanstack/react-query`
3. Configure wagmi for Base mainnet and Base Sepolia
4. Point to deployed testnet contract address
5. Implement `useGameState` hook — polls `getGameState()` every 5 seconds
6. Implement `useCapture` hook — wraps `capture(referrer)` transaction
7. Implement `useClaimWinnings` hook — wraps `claimWinnings()` transaction
8. Implement `useReferral` hook — reads `referredBy` mapping, calculates earnings from `BagCaptured` events

### Phase 3 — Core UI
1. Load `Press Start 2P` from Google Fonts
2. Build pixel bag SVG or canvas sprite — must work as favicon
3. Build `AgentBanner` component — fixed top bar, fetches `skills.md` on mount, `[COPY]` button copies raw content to clipboard, `[COPIED ✓]` confirmation state
4. Build main layout: agent banner at top, bag hero center, stats below, capture button, scrolling tagline marquee at bottom
5. Build capture button — shows exact ETH cost, disabled if wallet is current holder, prompts wallet connect if disconnected
6. Build timer component — counts down from 24h, turns red under 1 hour, shows "ROUND OVER — CLAIM NOW" when expired
7. Build recent captures feed — reads `BagCaptured` events, live updates
8. Apply scanline overlay, text glow, pixel aesthetic throughout

### Phase 4 — Modals
1. Build modal shell — pixel border style, opens over main UI, closeable
2. Build Rules modal
3. Build Fairness modal — includes contract address, BaseScan link, ABI download, links to `llms.txt` and `skills.md`, agent manifest endpoint
4. Build Referrals modal — referral URL display, copy button, earnings display

### Phase 5 — Polish and deploy
1. Test on Base Sepolia end-to-end with all UI flows
2. Switch contract address to Base mainnet deployment
3. Mobile responsiveness pass — large touch targets, no horizontal scroll
4. Deploy frontend to Vercel
5. Set custom domain `capturethebag.wtf`
6. Export favicon PNGs (16×16, 32×32) and set in `index.html`
7. Smoke test on mainnet with real wallet

### Phase 6 — Agent infrastructure

Agents need to discover, read, and play the game without any human involvement. This phase makes the game fully agent-native.

#### 6.1 — `llms.txt`
Serve a plain text file at `capturethebag.wtf/llms.txt` following the llms.txt convention. This is the first thing an agent reads when it visits the site. It should describe the game, the contract, and where to find everything else.

```
# Capture the Bag

> An onchain game on Base. Pay ETH to capture the bag. Hold it for 24 hours with no captures to win the pot.

## Game
- Contract: [Base Mainnet address]
- Network: Base Mainnet (chainId: 8453)
- Start price: 0.01 ETH, escalates 1.15x per capture
- Win condition: hold the bag for 24 hours uncontested
- Protocol fee: 5% per capture
- Referral fee: 5% per capture (first capture by referred wallet only)

## Agent endpoints
- Game state: GET /api/state
- Capture history: GET /api/captures
- ABI: GET /api/abi
- Manifest: GET /api/manifest

## Files
- Full instructions: /skills.md
- ABI: /api/abi
- Contract source: [BaseScan link]
```

#### 6.2 — `skills.md`
Serve a markdown file at `capturethebag.wtf/skills.md`. This is the complete playbook for an agent — everything it needs to participate, written as step-by-step instructions. Modeled after the skills.md pattern used by agent frameworks.

```markdown
# Capture the Bag — Agent Playbook

## What this game is
An onchain game on Base. One bag. One holder. Pay ETH to capture it.
Hold it for 24 hours with no other captures to win 95% of the pot.

## Contract
- Address: [deployed address]
- Network: Base Mainnet (chainId: 8453)
- ABI: GET https://capturethebag.wtf/api/abi

## How to play

### Step 1 — Read game state
GET https://capturethebag.wtf/api/state

Returns:
- holder: current bag holder address
- capturePrice: current capture cost in wei
- pot: total pot in wei
- lastCaptureTime: unix timestamp of last capture
- windowExpiresAt: unix timestamp when current holder wins
- roundNumber: current round
- captureCount: captures this round
- canClaim: true if 24h window has passed and claimWinnings() can be called
- roundActive: false if waiting for first capture of new round

### Step 2 — Decide whether to capture
Capture is rational when:
- capturePrice is within your budget
- pot * 0.95 > capturePrice (positive EV if you hold to win)
- You believe you can hold for 24 hours (or outlast current competition)

### Step 3 — Capture the bag
Call capture(address referrer) on the contract.
- referrer: pass any active player address from recent BagCaptured events, or address(0)
- msg.value: must be >= capturePrice (exact or slight overage — excess is refunded)
- Self-referral is blocked at contract level

ABI for capture:
{
  "name": "capture",
  "type": "function",
  "inputs": [{"name": "referrer", "type": "address"}],
  "stateMutability": "payable"
}

### Step 4 — Monitor your position
Poll GET /api/state every 60 seconds.
If holder changes to a different address, you have been captured.
Re-evaluate whether to recapture.

### Step 5 — Claim winnings
If canClaim is true and you are the holder, call claimWinnings().
This pays out 95% of pot to you and holds 5% rollover for the next round.
Anyone can call claimWinnings() — it is permissionless.

ABI for claimWinnings:
{
  "name": "claimWinnings",
  "type": "function",
  "inputs": [],
  "stateMutability": "nonpayable"
}

## Events to monitor
Subscribe to BagCaptured events for live game state without polling.
Each event contains: newHolder, previousHolder, pricePaid, nextCapturePrice,
captureCount, referrer, referralPaid, protocolPaid, addedToPot.

## Referral strategy
Pass the address of the most recent capturer as your referrer parameter.
This gives them 5% of your capture fee and costs you nothing —
the fee comes from your capture payment, not on top of it.
The referral relationship is permanent — you will only pay this referrer once.
```

#### 6.3 — API endpoints
Build a lightweight read API. No auth required. All endpoints are public and cacheable.

```
GET /api/state
  — Returns full game state from getGameState() contract call
  — Cache: 5 seconds
  — Response: JSON

GET /api/captures?limit=50
  — Returns recent BagCaptured events, most recent first
  — Cache: 5 seconds
  — Response: JSON array

GET /api/abi
  — Returns contract ABI as JSON
  — Cache: indefinite (immutable)
  — Response: JSON

GET /api/manifest
  — Returns structured agent manifest (mirrors getGameState() plus metadata)
  — Cache: 5 seconds
  — Response: JSON

GET /llms.txt
  — Plain text agent discovery file
  — Cache: 1 hour

GET /skills.md
  — Markdown agent playbook
  — Cache: 1 hour
```

All endpoints served from the same Vercel deployment as the frontend. Use Vercel serverless functions (`/api/*.js`) that call the contract via viem/publicClient.

#### 6.4 — On-chain manifest
The contract's `getGameState()` function already serves as the on-chain manifest. Ensure it returns all fields agents need in a single call — no agent should need more than one RPC call to get full game state.

#### 6.5 — robots.txt
Allow all crawlers including AI agents:

```
User-agent: *
Allow: /

# Agent files
Sitemap: https://capturethebag.wtf/llms.txt
```

#### 6.6 — Verify agent accessibility
1. Fetch `capturethebag.wtf/llms.txt` — confirm readable and complete
2. Fetch `capturethebag.wtf/skills.md` — confirm step-by-step instructions are accurate against deployed contract
3. Call `GET /api/state` — confirm live contract data returns correctly
4. Call `GET /api/abi` — confirm ABI matches deployed contract
5. Run a test agent capture on Base Sepolia using only the information in `skills.md` — no other context

---

## Agent Discoverability

`getGameState()` returns everything an agent needs to participate autonomously — current price, pot size, time remaining, whether the round can be claimed. No additional RPC queries required.

Agents reading `BagCaptured` events get the referrer address of every player, enabling autonomous referral chain discovery. An agent can pass any active player's address as its referrer parameter.

---

## Design Principles

- **Real time, not blocks** — `block.timestamp` for the inactivity window. Human-legible.
- **Fees at capture time** — protocol and referral taken immediately, not at round end
- **Permissionless resolution** — anyone can call `claimWinnings()` after window expires. Next round starts on first capture, not on claim.
- **Permanent referral relationships** — `referredBy` never changes once set
- **No randomness** — fully deterministic, no VRF anywhere
- **Agents are first-class** — events and view functions are rich enough for autonomous participation

---

## The Commentary

The round starts accessible. 0.01 ETH to capture — anyone can play. As captures accumulate the price rises 1.15× each time. Casual players get priced out around capture 13. Engaged players around capture 20. The pot they all helped build is now being contested by a shrinking group who can afford the escalating cost of entry.

The opportunity doesn't close on a schedule. It closes when everyone stops trying.

That's hustle culture. The system starts open and ends exclusive. Early participation is rewarded with nothing unless you can afford to stay until the end. The bag goes to whoever could hold on longest.

---

## File Structure

```
capture-the-bag/
├── contracts/
│   ├── src/
│   │   └── CaptureTheBag.sol
│   ├── test/
│   │   └── CaptureTheBag.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentBanner.jsx        — fixed top banner with skills.md copy button
│   │   │   ├── BagLogo.jsx            — pixel art bag, hero element + favicon source
│   │   │   ├── CaptureButton.jsx
│   │   │   ├── Timer.jsx
│   │   │   ├── StatBar.jsx
│   │   │   ├── CapturesFeed.jsx
│   │   │   ├── TaglineMarquee.jsx
│   │   │   └── modals/
│   │   │       ├── RulesModal.jsx
│   │   │       ├── FairnessModal.jsx
│   │   │       └── ReferralsModal.jsx
│   │   ├── hooks/
│   │   │   ├── useGameState.js
│   │   │   ├── useCapture.js
│   │   │   ├── useClaimWinnings.js
│   │   │   └── useReferral.js
│   │   └── utils/
│   │       └── format.js
│   ├── api/
│   │   ├── state.js               — GET /api/state
│   │   ├── captures.js            — GET /api/captures
│   │   ├── abi.js                 — GET /api/abi
│   │   └── manifest.js            — GET /api/manifest
│   └── public/
│       ├── favicon-16.png
│       ├── favicon-32.png
│       ├── llms.txt               — agent discovery file
│       ├── skills.md              — agent playbook
│       └── robots.txt
└── docs/
    └── CLAUDE.md
```

---

## Mainnet Launch Checklist

- [ ] Update production contract — port auto-resolve logic into CaptureTheBag.sol (`capture()` auto-resolves expired rounds, pays winner, starts new round in one tx). Redeploy to Base Sepolia with production parameters (24hr window, 0.01 ETH start).
- [ ] Update frontend to point to new production contract — new contract address, new deploy block in hooks.
- [ ] Deploy frontend to Vercel — verify all API endpoints (`/api/state`, `/api/captures`, `/api/abi`, `/api/manifest`) work with the new contract.
- [ ] Connect custom domain — `capturethebag.wtf`
- [ ] Test referral mechanism — capture through a referral link, confirm 5% paid to referrer in same tx, confirm referral is permanent, confirm self-referral blocked.
- [x] Test round transitions — full round lifecycle: captures → timer expires → manual claim OR auto-resolve on next capture → new round starts with rollover. Test both paths.
- [x] Test winning screen UI/UX — winner sees "YOU WON X ETH" in timer, losers see truncated address. Claim button for winner, "START NEW ROUND" for everyone else. Win/lose sounds fire correctly.
- [ ] Wallet edge cases — switching wallets mid-round, disconnecting, reconnecting, capturing with insufficient funds.
- [ ] Mobile testing — touch targets, no horizontal scroll, readable at small sizes.
- [ ] Test agent infrastructure — fetch `llms.txt`, `skills.md`, `/api/state`, `/api/abi`. Verify data matches deployed contract.
- [ ] Audit the smart contract — review for reentrancy, fee math, edge cases around auto-resolve + manual claim interaction, ETH transfer failures.
- [ ] Configure meta tags and social sharing image — Open Graph and Twitter Card tags, custom OG image for link previews.
- [ ] Deploy to Base mainnet — seed initial pot, verify on BaseScan.
- [ ] Gas estimation on Base mainnet — confirm capture and claim tx costs are reasonable.
