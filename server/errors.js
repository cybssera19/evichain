const messages = {
  AUTH_REQUIRED: 'Your session has expired. Please sign in again.',
  AUTH_INVALID: 'Wallet verification failed. Start again and sign the new message.',
  AUTH_CHALLENGE: 'This sign-in request has expired or was already used. Please start again.',
  ORIGIN_DENIED: 'This origin is not allowed. Open the application at its configured address.',
  RATE_LIMITED: 'Too many attempts. Wait a few minutes and try again.',
  INVALID_WALLET: 'Enter a valid wallet address.',
  INVALID_REQUEST: 'Invalid request. Check the form and try again.',
  FORBIDDEN: 'Your role does not allow this action.',
  ROLE_PENDING: 'Your role is awaiting Admin approval.',
  SERVER_ERROR: 'The service is unavailable. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  FILE_TOO_LARGE: 'The file exceeds the 25 MB limit.',
  ROLE_REVOKE_FIRST: 'Revoke the on-chain role before deleting this profile.',
  CASE_HAS_EVIDENCE: 'This case contains evidence and cannot be deleted.',
  FILE_MISMATCH: 'The uploader or file hash does not match the registered evidence.',
  INVALID_PROFILE: 'Invalid profile. Enter a name and check the field lengths.',
  INVALID_ROLE: 'Choose Investigator, Analyst, or Auditor.',
  NAME_REQUIRED: 'Name is required.',
  INVALID_CASE: 'Enter a case ID and title, then select a valid status.',
  FILE_REQUIRED: 'Select a file to upload.',
  FILE_CONFLICT: 'This evidence file is already registered and cannot be replaced.',
  EVIDENCE_FINAL: 'This evidence is final. New uploads are not allowed.',
  UPLOAD_BUSY: 'Other uploads are in progress. Please try again shortly.',
  CASE_CHAIN_MISMATCH: 'Case data does not match the blockchain. Confirm the case transaction, then save again.',
  CASE_DELETE_ONCHAIN: 'Delete the case on-chain first. Cases with registered evidence cannot be deleted.',
}
const legacy = {
  'Please sign in': 'AUTH_REQUIRED', 'Insufficient role': 'FORBIDDEN', 'Awaiting role approval': 'ROLE_PENDING',
  'Revoke role on-chain first': 'ROLE_REVOKE_FIRST', 'Case has evidence': 'CASE_HAS_EVIDENCE',
  'Evidence creator or hash mismatch': 'FILE_MISMATCH',
  'Invalid profile': 'INVALID_PROFILE', 'Choose a valid role': 'INVALID_ROLE',
  'Name required': 'NAME_REQUIRED', 'Invalid case': 'INVALID_CASE', 'File required': 'FILE_REQUIRED',
}
export function fail(res, status, input) {
  const code = messages[input] ? input : legacy[input] || (status >= 500 ? 'SERVER_ERROR' : 'INVALID_REQUEST')
  return res.status(status).json({ code, error: messages[code] })
}
