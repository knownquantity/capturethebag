// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CaptureTheBag.sol";

contract Deploy is Script {
    function run() external {
        address protocolWallet = vm.envAddress("PROTOCOL_WALLET");

        vm.startBroadcast();
        CaptureTheBag game = new CaptureTheBag(protocolWallet);
        vm.stopBroadcast();

        console.log("CaptureTheBag deployed to:", address(game));
        console.log("Protocol wallet:", protocolWallet);
    }
}
