// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CaptureTheBagTest3.sol";

contract DeployTest3 is Script {
    function run() external {
        address protocolWallet = vm.envAddress("PROTOCOL_WALLET");

        vm.startBroadcast();
        CaptureTheBagTest3 game = new CaptureTheBagTest3(protocolWallet);
        vm.stopBroadcast();

        console.log("CaptureTheBagTest3 (3min, 0.001 ETH, auto-resolve) deployed to:", address(game));
        console.log("Protocol wallet:", protocolWallet);
    }
}
