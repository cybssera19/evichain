import { ethers } from 'ethers'

class RpcNonceSigner extends ethers.AbstractSigner {
  constructor(signer, nonceProvider) {
    super(signer.provider)
    this.signer = signer
    this.nonceProvider = nonceProvider
  }

  getAddress() {
    return this.signer.getAddress()
  }

  async sendTransaction(tx) {
    const nonce = await this.nonceProvider.getTransactionCount(await this.getAddress(), 'pending')
    return this.signer.sendTransaction({ ...tx, nonce })
  }

  signTransaction(tx) {
    return this.signer.signTransaction(tx)
  }

  signMessage(message) {
    return this.signer.signMessage(message)
  }

  signTypedData(domain, types, value) {
    return this.signer.signTypedData(domain, types, value)
  }

  connect(provider) {
    return new RpcNonceSigner(this.signer.connect(provider), this.nonceProvider)
  }
}

export function transactionSigner(signer, chainId, nonceProvider) {
  return chainId === 31337 ? new RpcNonceSigner(signer, nonceProvider) : signer
}
