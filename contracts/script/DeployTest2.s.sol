// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CaptureTheBagTest2.sol";

contract DeployTest2 is Script {
    function run() external {
        address protocolWallet = vm.envAddress("PROTOCOL_WALLET");

        vm.startBroadcast();
        CaptureTheBagTest2 game = new CaptureTheBagTest2(protocolWallet);
        vm.stopBroadcast();

        console.log("CaptureTheBagTest2 (3min, 0.001 ETH) deployed to:", address(game));
        console.log("Protocol wallet:", protocolWallet);
    }
}
