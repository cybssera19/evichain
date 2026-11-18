export const abi = [
  'function caseRegistry() view returns(address)',
  'event EvidenceChanged(uint256 indexed id,string action,address indexed actor)',
  'function roles(address) view returns (uint8)',
  'function nextId() view returns (uint256)',
  'function getEvidence(uint256) view returns ((uint256 id,string caseId,string kind,bytes32 fileHash,address holder,uint8 status,address creator,uint256 createdAt,bool exists))',
  'function getCustodyHistory(uint256) view returns ((address actor,address from,address to,string action,string note,bytes32 reportHash,uint256 at)[])',
  'function registerEvidence(string,string,bytes32) returns (uint256)',
  'function updateEvidence(uint256,string,string)',
  'function transferCustody(uint256,address,string)',
  'function addAnalysis(uint256,bytes32,string)',
  'function updateStatus(uint256,uint8,string)',
  'function voidEvidence(uint256,string)',
  'function recoverCustody(uint256,address,string)',
]
export const roleAbi = [
  'function roles(address) view returns (uint8)',
  'function setRole(address,uint8)',
]
export const roles = ['None', 'Admin', 'Investigator', 'Analyst', 'Auditor']
export const statuses = ['Collected', 'InAnalysis', 'Stored', 'Released', 'Disposed', 'Voided']
export const roleCode = (name) => roles.indexOf(name)
export const short = (value = '') =>
  value.length > 16 ? `${value.slice(0, 9)}…${value.slice(-6)}` : value
