import { keccak256, toUtf8Bytes } from 'ethers'
export const caseStages = ['Investigation', 'Filing', 'Closed']

const commitmentStages = ['Penyidikan', 'Pemberkasan', 'Selesai']
export const canonicalCase = ({ no, title, description = '', status = 'Investigation' }) => ({
  no,
  title: title.trim(),
  description: description.trim(),
  status,
})
export const caseHash = (data) => {
  const c = canonicalCase(data)
  const stage = caseStages.indexOf(c.status)
  if (stage < 0) throw new Error('Invalid case status')
  return keccak256(
    toUtf8Bytes(JSON.stringify([c.no, c.title, c.description, commitmentStages[stage]])),
  )
}
export const caseAbi = [
  'function getCase(string) view returns ((bool exists,uint8 stage,bytes32 metadataHash,uint256 evidenceCount,uint256 activeCount))',
  'function setCase(string,uint8,bytes32)',
  'function deleteCase(string)',
]
