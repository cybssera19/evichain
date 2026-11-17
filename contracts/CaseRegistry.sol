// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RoleRegistry} from "./RoleRegistry.sol";
import {EvidenceTypes} from "./EvidenceTypes.sol";

contract CaseRegistry {
    enum Stage { Investigation, Filing, Closed, Deleted }
    struct CaseRecord { bool exists; Stage stage; bytes32 metadataHash; uint256 evidenceCount; uint256 activeCount; }
    RoleRegistry public immutable roleRegistry;
    address public immutable evidenceRegistry;
    mapping(bytes32 => CaseRecord) private _cases;
    event CaseChanged(string caseId, Stage stage, bytes32 metadataHash, address actor);

    constructor(RoleRegistry roles_, address evidence_) { roleRegistry = roles_; evidenceRegistry = evidence_; }
    modifier onlyAdmin() { require(roleRegistry.roles(msg.sender) == EvidenceTypes.Role.Admin, "admin required"); _; }
    modifier onlyEvidence() { require(msg.sender == evidenceRegistry, "evidence registry required"); _; }

    function keyOf(string calldata caseId) public pure returns (bytes32) {
        bytes calldata value = bytes(caseId);
        require(value.length > 0 && value.length <= 64, "invalid case id");
        for (uint256 i; i < value.length; ++i) {
            uint8 c = uint8(value[i]);
            require((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c == 45 || c == 46 || c == 47 || c == 95, "invalid case id");
        }
        return keccak256(value);
    }
    function getCase(string calldata caseId) external view returns (CaseRecord memory) { return _cases[keyOf(caseId)]; }

    function setCase(string calldata caseId, Stage stage, bytes32 metadataHash) external onlyAdmin {
        require(stage != Stage.Deleted && metadataHash != bytes32(0), "invalid case data");
        CaseRecord storage record = _cases[keyOf(caseId)];
        if (!record.exists) {
            require(stage == Stage.Investigation, "initial stage required");
            record.exists = true;
        } else {
            require(record.stage != Stage.Closed && record.stage != Stage.Deleted, "case final");
            if (stage == Stage.Closed) require(record.activeCount == 0, "active evidence");
        }
        record.stage = stage;
        record.metadataHash = metadataHash;
        emit CaseChanged(caseId, stage, metadataHash, msg.sender);
    }
    function deleteCase(string calldata caseId) external onlyAdmin {
        CaseRecord storage record = _cases[keyOf(caseId)];
        require(record.exists && record.stage != Stage.Deleted, "unknown case");
        require(record.evidenceCount == 0, "case has evidence");
        record.stage = Stage.Deleted;
        emit CaseChanged(caseId, Stage.Deleted, record.metadataHash, msg.sender);
    }
    function recordEvidence(string calldata caseId) external onlyEvidence {
        CaseRecord storage record = _cases[keyOf(caseId)];
        require(record.exists && record.stage == Stage.Investigation, "case not open");
        record.evidenceCount++;
        record.activeCount++;
    }
    function finalizeEvidence(string calldata caseId) external onlyEvidence {
        CaseRecord storage record = _cases[keyOf(caseId)];
        require(record.activeCount > 0, "no active evidence");
        record.activeCount--;
    }
}
