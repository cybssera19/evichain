const hre = require('hardhat');
const {checkDeployer}=require('./deployment-policy.cjs');
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  checkDeployer(chainId,deployer.address);
  const roles = await hre.ethers.deployContract('RoleRegistry');
  await roles.waitForDeployment();
  const contract = await hre.ethers.deployContract('EvidenceRegistry', [await roles.getAddress()]);
  await contract.waitForDeployment();
  console.log('RoleRegistry:', await roles.getAddress());
  console.log('EvidenceRegistry:', await contract.getAddress());
  console.log('CaseRegistry:', await contract.caseRegistry());
  console.log('Admin:', (await hre.ethers.getSigners())[0].address);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
