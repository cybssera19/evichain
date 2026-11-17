// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EvidenceTypes} from "./EvidenceTypes.sol";

contract RoleRegistry {
    mapping(address => EvidenceTypes.Role) public roles;
    mapping(address => uint256) public roleVersion;
    uint256 public adminCount;

    event RoleChanged(address indexed wallet, EvidenceTypes.Role previousRole, EvidenceTypes.Role newRole, address indexed actor);

    constructor() {
        roles[msg.sender] = EvidenceTypes.Role.Admin;
        adminCount = 1;
        emit RoleChanged(msg.sender, EvidenceTypes.Role.None, EvidenceTypes.Role.Admin, msg.sender);
    }

    modifier onlyAdmin() {
        require(roles[msg.sender] == EvidenceTypes.Role.Admin, "admin required");
        _;
    }

    function setRole(address wallet, EvidenceTypes.Role role) external onlyAdmin {
        require(wallet != address(0), "zero wallet");
        EvidenceTypes.Role previous = roles[wallet];
        require(previous != role, "role unchanged");
        if (previous == EvidenceTypes.Role.Admin) {
            require(adminCount > 1, "last admin");
            adminCount -= 1;
        }
        if (role == EvidenceTypes.Role.Admin) adminCount += 1;
        roles[wallet] = role;
        roleVersion[wallet]++;
        emit RoleChanged(wallet, previous, role, msg.sender);
    }
}
