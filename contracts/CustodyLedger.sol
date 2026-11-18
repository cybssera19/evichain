// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EvidenceTypes} from "./EvidenceTypes.sol";

abstract contract CustodyLedger {
    mapping(uint256 => EvidenceTypes.CustodyRecord[]) internal _history;
    event EvidenceChanged(uint256 indexed id, string action, address indexed actor);

    function getCustodyHistory(uint256 id) external view returns (EvidenceTypes.CustodyRecord[] memory) {
        require(_history[id].length > 0, "unknown evidence");
        return _history[id];
    }

    function historyLength(uint256 id) external view returns (uint256) {
        return _history[id].length;
    }

    function historyAt(uint256 id, uint256 index) external view returns (EvidenceTypes.CustodyRecord memory) {
        return _history[id][index];
    }

    function _record(
        uint256 id,
        address from,
        address to,
        string memory action,
        string memory note,
        bytes32 reportHash
    ) internal {
        _history[id].push(
            EvidenceTypes.CustodyRecord(msg.sender, from, to, action, note, reportHash, block.timestamp)
        );
        emit EvidenceChanged(id, action, msg.sender);
    }
}
