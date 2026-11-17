// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library EvidenceTypes {
    enum Role { None, Admin, Investigator, Analyst, Auditor }
    enum Status { Collected, InAnalysis, Stored, Released, Disposed, Voided }

    struct Evidence {
        uint256 id;
        string caseId;
        string kind;
        bytes32 fileHash;
        address holder;
        Status status;
        address creator;
        uint256 createdAt;
        bool exists;
    }

    struct CustodyRecord {
        address actor;
        address from;
        address to;
        string action;
        string note;
        bytes32 reportHash;
        uint256 at;
    }
}
