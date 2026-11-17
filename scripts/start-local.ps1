$ErrorActionPreference = 'Stop'
$projectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $projectDir
$logDir = Join-Path $projectDir '.local'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Wait-Until([scriptblock]$check, [string]$label) {
  for ($i = 0; $i -lt 40; $i++) {
    try { if (& $check) { return } } catch {}
    Start-Sleep -Milliseconds 500
  }
  throw "$label did not start. Check logs in $logDir"
}
function Rpc([string]$method, [object[]]$params = @()) {
  $body = @{ jsonrpc = '2.0'; id = 1; method = $method; params = $params } | ConvertTo-Json -Depth 5 -Compress
  Invoke-RestMethod -Uri 'http://127.0.0.1:8545' -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 2
}
function Start-LocalProcess([string]$scriptName, [string]$logName) {
  $npm = (Get-Command npm.cmd).Source
  $arguments = if ($scriptName -eq 'dev') { @('run', 'dev', '--', '--host', '127.0.0.1') } else { @('run', $scriptName) }
  Start-Process -FilePath $npm -ArgumentList $arguments -WorkingDirectory $projectDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir "$logName.out.log") -RedirectStandardError (Join-Path $logDir "$logName.err.log") | Out-Null
}
if (-not (Test-Path 'node_modules')) { npm ci; if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' } }
docker compose up -d postgres | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Docker PostgreSQL did not start' }
Wait-Until { docker compose exec -T postgres pg_isready -U evichain -d evichain 2>$null | Out-Null; $LASTEXITCODE -eq 0 } 'PostgreSQL'
Get-Content 'server/schema.sql' -Raw | docker compose exec -T postgres psql -U evichain -d evichain | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Database schema failed' }
try { $chainReady = (Rpc 'eth_chainId').result -eq '0x7a69' } catch { $chainReady = $false }
if (-not $chainReady) { Start-LocalProcess 'chain' 'chain'; Wait-Until { (Rpc 'eth_chainId').result -eq '0x7a69' } 'Hardhat chain' }
$envPath = Join-Path $projectDir '.env'
if (Test-Path $envPath) { $envText = Get-Content $envPath -Raw }
else { $envText = Get-Content '.env.example' -Raw }
$match = [regex]::Match($envText, '(?m)^CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})\s*$')
$address = if ($match.Success) { $match.Groups[1].Value } else { '' }
$roleMatch = [regex]::Match($envText, '(?m)^ROLE_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})\s*$')
$roleAddress = if ($roleMatch.Success) { $roleMatch.Groups[1].Value } else { '' }
$hasContract = $false
if ($address) { try { $hasContract = (Rpc 'eth_getCode' @($address, 'latest')).result -ne '0x' } catch {} }
$hasRoles = $false
if ($roleAddress) { try { $hasRoles = (Rpc 'eth_getCode' @($roleAddress, 'latest')).result -ne '0x' } catch {} }
if ($hasContract -and $hasRoles) {
  try { $version = (Rpc 'eth_call' @(@{ to = $address; data = '0x099199c3' }, 'latest')).result } catch { $version = '' }
  if ($version -notmatch '^0x0*2$') { throw 'Existing deployment is outdated. Run npm run upgrade:local first; existing evidence requires a migration plan.' }
}
if (-not $hasContract -or -not $hasRoles) {
  $ErrorActionPreference = 'Continue'
  $output = npm run deploy:local 2>&1 | Out-String
  $ErrorActionPreference = 'Stop'
  if ($LASTEXITCODE -ne 0) { throw "Contract deployment failed: $output" }
  $deployed = [regex]::Match($output, 'EvidenceRegistry:\s*(0x[a-fA-F0-9]{40})')
  $deployedRoles = [regex]::Match($output, 'RoleRegistry:\s*(0x[a-fA-F0-9]{40})')
  if (-not $deployed.Success -or -not $deployedRoles.Success) { throw 'Deployed addresses not found' }
  $address = $deployed.Groups[1].Value
  $roleAddress = $deployedRoles.Groups[1].Value
}
$envText = [regex]::Replace($envText, '(?m)^CONTRACT_ADDRESS=.*$', "CONTRACT_ADDRESS=$address")
$envText = [regex]::Replace($envText, '(?m)^VITE_CONTRACT_ADDRESS=.*$', "VITE_CONTRACT_ADDRESS=$address")
if ($envText -match '(?m)^ROLE_CONTRACT_ADDRESS=') { $envText = [regex]::Replace($envText, '(?m)^ROLE_CONTRACT_ADDRESS=.*$', "ROLE_CONTRACT_ADDRESS=$roleAddress") }
else { $envText += "`nROLE_CONTRACT_ADDRESS=$roleAddress" }
if ($envText -match '(?m)^VITE_ROLE_CONTRACT_ADDRESS=') { $envText = [regex]::Replace($envText, '(?m)^VITE_ROLE_CONTRACT_ADDRESS=.*$', "VITE_ROLE_CONTRACT_ADDRESS=$roleAddress") }
else { $envText += "`nVITE_ROLE_CONTRACT_ADDRESS=$roleAddress" }
Set-Content -LiteralPath $envPath -Value $envText -Encoding utf8
try { $apiHealth = Invoke-RestMethod 'http://127.0.0.1:3001/api/health' -TimeoutSec 2; $apiReady = $apiHealth.ok } catch { $apiReady = $false }
if ($apiReady -and $apiHealth.contractAddress -ne $address) { throw 'The API is still using a different deployment. Restart the API before continuing.' }
if (-not $apiReady) { Start-LocalProcess 'api' 'api'; Wait-Until { (Invoke-RestMethod 'http://127.0.0.1:3001/api/health' -TimeoutSec 2).ok } 'API' }
try { $webReady = (Invoke-WebRequest 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { $webReady = $false }
if (-not $webReady) { Start-LocalProcess 'dev' 'web'; Wait-Until { (Invoke-WebRequest 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } 'Frontend' }
Write-Host 'EviChain is ready: http://127.0.0.1:5173/'
Write-Host 'Local demo Admin: run npm run admin:local to see the MetaMask account and key.'
Write-Host 'MetaMask: use your own wallet to register. Admin approval is required for evidence access.'
