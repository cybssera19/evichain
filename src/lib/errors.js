export function errorMessage(error) {
  if (error?.safeMessage) return error.safeMessage
  const code = error?.error?.code ?? error?.code
  if (code === 4100)
    return 'This account is not authorized in MetaMask. Connect it to EviChain and try again.'
  if (code === 4001 || code === 'ACTION_REJECTED')
    return 'Request cancelled. Try again and approve the MetaMask request.'
  if (code === -32002) return 'A MetaMask request is still pending. Open the extension to continue.'
  if (code === 4900 || code === 4901 || code === 'NETWORK_ERROR' || error instanceof TypeError)
    return 'Could not connect to the wallet or service. Check your network and try again.'
  if (code === 'INSUFFICIENT_FUNDS')
    return 'You do not have enough ETH on this network to pay the transaction fee.'
  const details = [error?.message, error?.shortMessage, error?.error?.message, error?.info?.error?.message]
    .filter(Boolean)
    .join(' ')
  const nonceMismatch = details.match(/Expected nonce to be (\d+) but got (\d+)/i)
  if (nonceMismatch)
    return `Wallet sent nonce ${nonceMismatch[2]}, but the chain expects ${nonceMismatch[1]}. Reload and try again.`
  if (code === 'NONCE_EXPIRED' || /nonce too (high|low)/i.test(details))
    return 'Wallet nonce is out of sync with this chain. Reload and try again.'
  if (code === 'CALL_EXCEPTION') {
    const reasons = {
      'case not open': 'This case is not open for registration. Select a case under investigation.',
      'active evidence': 'This case still has active evidence and cannot be closed.',
      'case has evidence': 'Cases with registered evidence cannot be deleted.',
      'case final': 'This case is closed or deleted. It cannot be reopened or reused.',
      'invalid case id':
        'Use 1 to 64 letters, digits, dots, slashes, hyphens, or underscores for the case ID.',
      'status unchanged': 'The evidence already has this status.',
      'blank text': 'Enter a reason or evidence type, not just spaces.',
      'last admin': 'The last Admin cannot be removed. Assign another Admin first.',
    }
    return (
      reasons[error?.reason || error?.revert?.args?.[0]] ||
      'The contract rejected this transaction. Check your role, the current holder, and the record status.'
    )
  }
  if (error?.message?.startsWith('MetaMask is on chain'))
    return 'Wrong wallet network. Select the EviChain network and sign in again.'
  if (
    error?.message?.includes('MetaMask was not found') ||
    error?.message === 'MetaMask is not available'
  )
    return 'MetaMask was not found. Enable the extension in this browser.'
  if (error?.message === 'Select the wallet used to sign in')
    return 'Your wallet account changed. Sign in with the account you want to use.'
  return 'Request failed. Check your connection and form, then try again.'
}
