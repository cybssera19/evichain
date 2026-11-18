// Transfer the RoleRegistry Admin role from an EOA to a multisig Safe.
//
// Reads ROLE_CONTRACT_ADDRESS from .env and uses DEPLOYER_KEY (the CURRENT admin)
// as the signer. Pass the Safe and the old admin as env vars.
//
// PowerShell:
//   $env:SAFE="0xYourSafeAddress"; $env:OLD_ADMIN="0xYourCurrentAdmin"
//   npx hardhat run scripts/transfer-admin.cjs --network sepolia
//
// ORDER MATTERS: the Safe is granted Admin first, then the old EOA is removed,
// because RoleRegistry refuses to remove the last Admin.
//
// SAFETY: this makes the Safe the ONLY admin. After it runs, the old EOA can no
// longer perform admin actions — only the Safe (via its M-of-N signers) can.
// Run it only AFTER the Safe is deployed and you can access it.

const hre = require('hardhat');

const ADMIN = 1, NONE = 0;

async function main() {
  const roleAddr = process.env.ROLE_CONTRACT_ADDRESS;
  const safe = process.env.SAFE;
  const oldAdmin = process.env.OLD_ADMIN;
  if (!roleAddr) throw new Error('ROLE_CONTRACT_ADDRESS missing from .env');
  if (!hre.ethers.isAddress(safe)) throw new Error('Set SAFE to the deployed Safe address');
  if (!hre.ethers.isAddress(oldAdmin)) throw new Error('Set OLD_ADMIN to the current admin EOA');

  // Guard: never hand admin to something that is not a deployed contract.
  // A typo'd / EOA address here would lock the Admin role forever.
  if ((await hre.ethers.provider.getCode(safe)) === '0x') {
    throw new Error(`SAFE ${safe} has no contract code — is it really a deployed Safe? Aborting.`);
  }

  const rr = await hre.ethers.getContractAt('RoleRegistry', roleAddr);
  const signer = (await hre.ethers.getSigners())[0];
  if ((await rr.roles(signer.address)) != ADMIN) {
    throw new Error(`Signer ${signer.address} is not an Admin; it cannot transfer the role.`);
  }

  console.log(`Granting Admin to Safe ${safe} ...`);
  await (await rr.setRole(safe, ADMIN)).wait();

  console.log(`Removing Admin from ${oldAdmin} ...`);
  await (await rr.setRole(oldAdmin, NONE)).wait();

  console.log('--- done ---');
  console.log('adminCount     =', Number(await rr.adminCount()), '(expect 1)');
  console.log('Safe role      =', Number(await rr.roles(safe)), '(expect 1 = Admin)');
  console.log('Old admin role =', Number(await rr.roles(oldAdmin)), '(expect 0 = None)');
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
