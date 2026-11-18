import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDir = fileURLToPath(new URL('../', import.meta.url))
const logDir = path.join(projectDir, '.local')
const npmCli = process.env.npm_execpath
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function run(command, args, { input, timeout = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectDir,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout,
    })
    let output = ''
    for (const stream of [child.stdout, child.stderr])
      stream.on('data', (chunk) => {
        output += chunk
      })
    child.on('error', (error) => reject(new Error(`Cannot run ${command}: ${error.message}`)))
    child.stdin.on('error', () => {}) // Report the process failure rather than an incidental EPIPE.
    child.stdin.end(input)
    child.on('close', (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(`${command} ${args.join(' ')} failed:\n${output.trim()}`))
    })
  })
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(2000) })
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`)
  return response
}

async function rpc(method, params = []) {
  const response = await request('http://127.0.0.1:8545', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const result = await response.json()
  if (result.error) throw new Error(result.error.message)
  return result.result
}

async function probe(check) {
  try {
    return await check()
  } catch {
    return false
  }
}

async function waitUntil(check, label, child) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child && (child.exitCode !== null || child.signalCode !== null)) break
    if (await probe(check)) return
    await pause(500)
  }
  throw new Error(`${label} did not start. Check logs in ${logDir}`)
}

function start(script, logName) {
  const out = openSync(path.join(logDir, `${logName}.out.log`), 'a')
  const err = openSync(path.join(logDir, `${logName}.err.log`), 'a')
  try {
    const args = [npmCli, 'run', script]
    if (script === 'dev') args.push('--', '--host', '127.0.0.1', '--strictPort')
    // Calling npm's JavaScript entry with Node avoids npm.cmd/shell differences.
    const child = spawn(process.execPath, args, {
      cwd: projectDir,
      detached: true,
      windowsHide: true,
      stdio: ['ignore', out, err],
    })
    child.on('error', (error) => console.error(`Could not start ${script}: ${error.message}`))
    child.unref()
    return child
  } finally {
    closeSync(out)
    closeSync(err)
  }
}

function setEnv(text, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  return pattern.test(text)
    ? text.replace(pattern, () => `${key}=${value}`)
    : `${text.trimEnd()}\n${key}=${value}\n`
}

async function main() {
  const [major, minor] = process.versions.node.split('.').map(Number)
  if (major < 22 || (major === 22 && minor < 12))
    throw new Error('Use Node.js 22.12 or newer (required by Vite).')
  if (!npmCli) throw new Error('Start this script with npm run start:local.')
  try {
    await run('docker', ['compose', 'version'])
    await run('docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 15000 })
  } catch (error) {
    throw new Error(
      `Docker with Compose is required and its engine must be running and accessible. On WSL, enable Docker Desktop integration for this distribution, or use a local Docker Engine.\n${error.message}`,
    )
  }
  mkdirSync(logDir, { recursive: true })
  if (!existsSync(path.join(projectDir, 'node_modules')))
    await run(process.execPath, [npmCli, 'ci'], { timeout: 600000 })

  console.log('Starting PostgreSQL…')
  await run('docker', ['compose', 'up', '-d', 'postgres'], { timeout: 600000 })
  await waitUntil(async () => {
    await run(
      'docker',
      ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'evichain', '-d', 'evichain'],
      { timeout: 5000 },
    )
    return true
  }, 'PostgreSQL')
  await run(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'postgres',
      'psql',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'evichain',
      '-d',
      'evichain',
    ],
    {
      input: readFileSync(path.join(projectDir, 'server/schema.sql')),
    },
  )

  console.log('Checking local blockchain…')
  const chainReady = () => rpc('eth_chainId').then((id) => id === '0x7a69')
  if (!(await probe(chainReady)))
    await waitUntil(chainReady, 'Hardhat chain', start('chain', 'chain'))

  const envPath = path.join(projectDir, '.env')
  let envText = readFileSync(
    existsSync(envPath) ? envPath : path.join(projectDir, '.env.example'),
    'utf8',
  )
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
  const addressOf = (key) => envText.match(new RegExp(`^${key}=(0x[a-fA-F0-9]{40})\\s*$`, 'm'))?.[1]
  let address = addressOf('CONTRACT_ADDRESS')
  let roleAddress = addressOf('ROLE_CONTRACT_ADDRESS')
  const hasCode = (address) =>
    address && probe(() => rpc('eth_getCode', [address, 'latest']).then((code) => code !== '0x'))
  const hasContract = await hasCode(address)
  const hasRoles = await hasCode(roleAddress)
  if (hasContract && hasRoles) {
    const version = await probe(() =>
      rpc('eth_call', [{ to: address, data: '0x099199c3' }, 'latest']),
    )
    if (!/^0x0*2$/.test(version))
      throw new Error(
        'Existing deployment is outdated. Run npm run upgrade:local first; existing evidence requires a migration plan.',
      )
  }
  if (!hasContract || !hasRoles) {
    console.log('Deploying contracts…')
    const output = await run(process.execPath, [npmCli, 'run', 'deploy:local'], { timeout: 600000 })
    address = output.match(/EvidenceRegistry:\s*(0x[a-fA-F0-9]{40})/)?.[1]
    roleAddress = output.match(/RoleRegistry:\s*(0x[a-fA-F0-9]{40})/)?.[1]
    if (!address || !roleAddress)
      throw new Error('Deployed addresses not found in deployment output.')
  }
  for (const [key, value] of Object.entries({
    CONTRACT_ADDRESS: address,
    VITE_CONTRACT_ADDRESS: address,
    ROLE_CONTRACT_ADDRESS: roleAddress,
    VITE_ROLE_CONTRACT_ADDRESS: roleAddress,
  })) {
    envText = setEnv(envText, key, value)
  }
  writeFileSync(envPath, envText, 'utf8')

  console.log('Checking frontend compilation…')
  await run(process.execPath, [npmCli, 'run', 'build', '--', '--outDir', '.local/frontend-check'], {
    timeout: 600000,
  })

  console.log('Checking API and frontend…')
  const health = () =>
    request('http://127.0.0.1:3001/api/health').then((response) => response.json())
  const apiHealth = await probe(health)
  if (apiHealth?.ok && apiHealth.contractAddress?.toLowerCase() !== address.toLowerCase())
    throw new Error(
      'The API is still using a different deployment. Restart the API before continuing.',
    )
  if (!apiHealth?.ok)
    await waitUntil(
      () =>
        health().then(
          (result) => result.ok && result.contractAddress?.toLowerCase() === address.toLowerCase(),
        ),
      'API',
      start('api', 'api'),
    )
  const webReady = () => request('http://127.0.0.1:5173/').then(() => true)
  if (!(await probe(webReady))) await waitUntil(webReady, 'Frontend', start('dev', 'web'))

  console.log('EviChain is ready: http://127.0.0.1:5173/')
  console.log(`Services run in the background. Logs: ${logDir}`)
  console.log('Local demo Admin: run npm run admin:local to see the MetaMask account and key.')
  console.log(
    'MetaMask: use your own wallet to register. Admin approval is required for evidence access.',
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
