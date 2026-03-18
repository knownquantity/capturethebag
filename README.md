## Capture the Bag — Smart Contracts

Onchain game on Base. Pay ETH to capture the bag. Hold it for 24 hours uncontested to win the pot.

## Setup

```bash
# Install dependencies
forge install

# Fill in .env values
```

## Build

```bash
forge build
```

## Test

```bash
forge test -vv
```

## Deploy

### Base Sepolia (testnet)

```bash
source .env

forge script script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### Base Mainnet

```bash
source .env

forge script script/Deploy.s.sol \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

## Contract Overview

| Function | Description |
|---|---|
| `capture(address referrer)` | Pay the current price to become the bag holder |
| `claimWinnings()` | Permissionless — pays winner 95% of pot, holds 5% rollover |
| `getGameState()` | Returns all game state in a single call |

## Fee Structure

| Recipient | Amount | Condition |
|---|---|---|
| Protocol | 5% of capture price | Every capture |
| Referrer | 5% of capture price | First capture by referred wallet only |
| Pot | 90–95% of capture price | Depending on referral |

## Game Parameters

- Starting price: 0.01 ETH
- Price escalation: 1.15x per capture
- Win condition: hold for 24 hours with no captures
- Winner payout: 95% of pot
- Rollover to next round: 5% of pot
