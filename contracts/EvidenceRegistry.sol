// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EvidenceTypes} from "./EvidenceTypes.sol";
import {RoleRegistry} from "./RoleRegistry.sol";
import {CustodyLedger} from "./CustodyLedger.sol";
import {CaseRegistry} from "./CaseRegistry.sol";

contract EvidenceRegistry is CustodyLedger {
    RoleRegistry public immutable roleRegistry;
    CaseRegistry public immutable caseRegistry;
    uint256 public constant deploymentVersion = 2;
    mapping(uint256 => EvidenceTypes.Evidence) private _evidence;
    uint256 public nextId = 1;

    constructor(RoleRegistry roleRegistry_) {
        require(address(roleRegistry_) != address(0), "zero roles contract");
        roleRegistry = roleRegistry_;
        caseRegistry = new CaseRegistry(roleRegistry_, address(this));
    }

    modifier onlyRole(EvidenceTypes.Role role) {
        require(roleRegistry.roles(msg.sender) == role, "wrong role");
        _;
    }
    modifier active(uint256 id) {
        require(_evidence[id].exists, "unknown evidence");
        require(_evidence[id].status != EvidenceTypes.Status.Voided, "voided");
        _;
    }
    modifier currentHolder(uint256 id) {
        require(_evidence[id].holder == msg.sender, "not holder");
        require(_evidence[id].status != EvidenceTypes.Status.Released && _evidence[id].status != EvidenceTypes.Status.Disposed, "final status");
        _;
    }

    function roles(address wallet) external view returns (EvidenceTypes.Role) { return roleRegistry.roles(wallet); }
    function roleVersion(address wallet) external view returns (uint256) { return roleRegistry.roleVersion(wallet); }

    function registerEvidence(string calldata caseId, string calldata kind, bytes32 fileHash)
        external onlyRole(EvidenceTypes.Role.Investigator) returns (uint256 id)
    {
        _bounded(caseId, 64);
        _bounded(kind, 80);
        require(fileHash != bytes32(0), "missing hash");
        caseRegistry.recordEvidence(caseId);
        id = nextId++;
        _evidence[id] = EvidenceTypes.Evidence(id, caseId, kind, fileHash, msg.sender, EvidenceTypes.Status.Collected, msg.sender, block.timestamp, true);
        _record(id, address(0), msg.sender, "register", "", bytes32(0));
    }

    function updateEvidence(uint256 id, string calldata kind, string calldata note)
        external active(id) currentHolder(id) onlyRole(EvidenceTypes.Role.Investigator)
    {
        _bounded(kind, 80);
        _boundedOptional(note, 256);
        _evidence[id].kind = kind;
        _record(id, msg.sender, msg.sender, "metadata", note, bytes32(0));
    }

    function transferCustody(uint256 id, address to, string calldata note) external active(id) currentHolder(id) {
        EvidenceTypes.Role senderRole = roleRegistry.roles(msg.sender);
        EvidenceTypes.Role recipientRole = roleRegistry.roles(to);
        require(senderRole == EvidenceTypes.Role.Investigator || senderRole == EvidenceTypes.Role.Analyst, "wrong role");
        require(recipientRole == EvidenceTypes.Role.Investigator || recipientRole == EvidenceTypes.Role.Analyst, "invalid recipient");
        require(to != msg.sender, "same holder");
        _bounded(note, 256);
        address from = _evidence[id].holder;
        _evidence[id].holder = to;
        _evidence[id].status = recipientRole == EvidenceTypes.Role.Analyst ? EvidenceTypes.Status.InAnalysis : EvidenceTypes.Status.Stored;
        _record(id, from, to, "transfer", note, bytes32(0));
    }

    function addAnalysis(uint256 id, bytes32 reportHash, string calldata note)
        external active(id) currentHolder(id) onlyRole(EvidenceTypes.Role.Analyst)
    {
        require(reportHash != bytes32(0), "missing hash");
        require(_evidence[id].status == EvidenceTypes.Status.InAnalysis, "not in analysis");
        _boundedOptional(note, 256);
        _record(id, msg.sender, msg.sender, "analysis", note, reportHash);
    }

    function updateStatus(uint256 id, EvidenceTypes.Status status, string calldata reason) external active(id) currentHolder(id) {
        EvidenceTypes.Role role = roleRegistry.roles(msg.sender);
        require(role == EvidenceTypes.Role.Investigator, "wrong role");
        require(status == EvidenceTypes.Status.Stored || status == EvidenceTypes.Status.Released || status == EvidenceTypes.Status.Disposed, "invalid status");
        _bounded(reason, 256);
        require(status != _evidence[id].status, "status unchanged");
        if (status == EvidenceTypes.Status.Released || status == EvidenceTypes.Status.Disposed) caseRegistry.finalizeEvidence(_evidence[id].caseId);
        _evidence[id].status = status;
        _record(id, msg.sender, msg.sender, "status", reason, bytes32(0));
    }

    function voidEvidence(uint256 id, string calldata reason) external active(id) onlyRole(EvidenceTypes.Role.Admin) {
        _bounded(reason, 256);
        if (_evidence[id].status != EvidenceTypes.Status.Released && _evidence[id].status != EvidenceTypes.Status.Disposed) caseRegistry.finalizeEvidence(_evidence[id].caseId);
        _evidence[id].status = EvidenceTypes.Status.Voided;
        _record(id, msg.sender, msg.sender, "void", reason, bytes32(0));
    }

    function recoverCustody(uint256 id, address to, string calldata reason) external active(id) onlyRole(EvidenceTypes.Role.Admin) {
        require(_evidence[id].status != EvidenceTypes.Status.Released && _evidence[id].status != EvidenceTypes.Status.Disposed, "final status");
        EvidenceTypes.Role oldRole = roleRegistry.roles(_evidence[id].holder);
        require(oldRole != EvidenceTypes.Role.Investigator && oldRole != EvidenceTypes.Role.Analyst, "holder still active");
        EvidenceTypes.Role newRole = roleRegistry.roles(to);
        require(newRole == EvidenceTypes.Role.Investigator || newRole == EvidenceTypes.Role.Analyst, "invalid recipient");
        _bounded(reason, 256);
        address from = _evidence[id].holder;
        _evidence[id].holder = to;
        _evidence[id].status = newRole == EvidenceTypes.Role.Analyst ? EvidenceTypes.Status.InAnalysis : EvidenceTypes.Status.Stored;
        _record(id, from, to, "recovery", reason, bytes32(0));
    }

    function getEvidence(uint256 id) external view returns (EvidenceTypes.Evidence memory) {
        require(_evidence[id].exists, "unknown evidence");
        return _evidence[id];
    }
    function verifyHash(uint256 id, bytes32 candidate) external view returns (bool) {
        return _evidence[id].exists && _evidence[id].fileHash == candidate;
    }
    function _bounded(string calldata value, uint256 maxLength) private pure {
        require(bytes(value).length > 0 && bytes(value).length <= maxLength, "invalid text length");
        bool meaningful;
        for (uint256 i; i < bytes(value).length; ++i) if (uint8(bytes(value)[i]) > 32) { meaningful = true; break; }
        require(meaningful, "blank text");
    }
    function _boundedOptional(string calldata value, uint256 maxLength) private pure {
        require(bytes(value).length <= maxLength, "invalid text length");
    }
}
