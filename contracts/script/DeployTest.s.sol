// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CaptureTheBagTest.sol";

contract DeployTest is Script {
    function run() external {
        address protocolWallet = vm.envAddress("PROTOCOL_WALLET");

        vm.startBroadcast();
        CaptureTheBagTest game = new CaptureTheBagTest(protocolWallet);
        vm.stopBroadcast();

        console.log("CaptureTheBagTest (5min) deployed to:", address(game));
        console.log("Protocol wallet:", protocolWallet);
    }
}
