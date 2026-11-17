const hre=require('hardhat');
const fs=require('node:fs/promises');
const path=require('node:path');
const pg=require('pg');

async function main(){
  const rpc=new URL(process.env.RPC_URL || 'http://127.0.0.1:8545');
  if(hre.network.name!=='localhost' || !['localhost','127.0.0.1'].includes(rpc.hostname) || (await hre.ethers.provider.getNetwork()).chainId!==31337n) throw Error('Local upgrade only');
  const envPath=path.resolve('.env'), text=await fs.readFile(envPath,'utf8');
  const oldAddress=process.env.CONTRACT_ADDRESS,oldRolesAddress=process.env.ROLE_CONTRACT_ADDRESS;
  const old=new hre.ethers.Contract(oldAddress,['function deploymentVersion() view returns(uint256)','function nextId() view returns(uint256)'],hre.ethers.provider);
  let version;
  try { version=await old.deploymentVersion() } catch(error) { if(error.code!=='CALL_EXCEPTION') throw error }
  if(version===2n) { console.log('Deployment is already v2; no configuration or contracts changed.'); return }
  if(await old.nextId()!==1n) throw Error('Existing evidence requires an explicit migration plan; upgrade did not change configuration');
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
  try {
    const result=await pool.query('SELECT (SELECT count(*) FROM cases)+(SELECT count(*) FROM evidence_files) AS count');
    if(Number(result.rows[0].count)!==0) throw Error('Existing cases/files require explicit migration; configuration unchanged');
  }finally{await pool.end();}
  const previous=new hre.ethers.Contract(oldRolesAddress,['function roles(address) view returns(uint8)','event RoleChanged(address indexed wallet,uint8 previousRole,uint8 newRole,address indexed actor)'],hre.ethers.provider);
  const events=await previous.queryFilter(previous.filters.RoleChanged());
  const wallets=[...new Set(events.map(e=>e.args.wallet))];
  const snapshot=[];
  for(const wallet of wallets) snapshot.push({wallet,role:Number(await previous.roles(wallet))});
  const folder=path.resolve('.local','deployments');await fs.mkdir(folder,{recursive:true});
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  await fs.writeFile(path.join(folder,stamp+'.env.backup'),text,{flag:'wx'});
  await fs.writeFile(path.join(folder,stamp+'.json'),JSON.stringify({previousEvidence:oldAddress,previousRoles:oldRolesAddress,roles:snapshot},null,2),{flag:'wx'});
  const roles=await hre.ethers.deployContract('RoleRegistry');await roles.waitForDeployment();
  const deployer=(await hre.ethers.getSigners())[0].address;
  for(const entry of snapshot) if(entry.wallet!==deployer && entry.role!==0) await(await roles.setRole(entry.wallet,entry.role)).wait();
  const oldDeployer=snapshot.find(e=>e.wallet===deployer)?.role || 0;
  if(oldDeployer!==1) await(await roles.setRole(deployer,oldDeployer)).wait();
  const evidence=await hre.ethers.deployContract('EvidenceRegistry',[await roles.getAddress()]);await evidence.waitForDeployment();
  const values={CONTRACT_ADDRESS:await evidence.getAddress(),ROLE_CONTRACT_ADDRESS:await roles.getAddress(),VITE_CONTRACT_ADDRESS:await evidence.getAddress(),VITE_ROLE_CONTRACT_ADDRESS:await roles.getAddress()};
  let updated=text;
  for(const[key,value]of Object.entries(values)) updated=updated.replace(new RegExp('^'+key+'=.*$','m'),key+'='+value);
  await fs.writeFile(envPath,updated);
  console.log(JSON.stringify({version:Number(await evidence.deploymentVersion()),...values,caseRegistry:await evidence.caseRegistry(),preservedRoles:snapshot,archive:path.relative(process.cwd(),folder)},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
