param(
  [string]$Vm = $(if ($env:TOKEN_METER_VM) { $env:TOKEN_METER_VM } else { "ubuntu@158.180.59.36" }),
  [string]$SshKey = $(if ($env:TOKEN_METER_SSH_KEY) { $env:TOKEN_METER_SSH_KEY } else { Join-Path $HOME ".ssh\jarvis_oci_ed25519" }),
  [string]$HostName = $(if ($env:TOKEN_METER_HOST) { $env:TOKEN_METER_HOST } else { "tokenmeter.site" })
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$shortSha = (& git -C $repo rev-parse --short=12 HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw "Unable to resolve git HEAD" }

$releaseId = "{0}-{1}" -f (Get-Date -Format "yyyyMMddHHmmss"), $shortSha
$archive = Join-Path ([IO.Path]::GetTempPath()) "token-meter-$releaseId.tgz"
$releaseRunner = Join-Path ([IO.Path]::GetTempPath()) "token-meter-release-$releaseId.sh"
$remoteArchive = "/tmp/token-meter-$releaseId.tgz"
$remoteRelease = "/tmp/token-meter-release-$releaseId.sh"
$pushed = $false

if (!(Test-Path $SshKey)) { throw "SSH key not found: $SshKey" }

try {
  Push-Location $repo
  $pushed = $true
  & tar -czf $archive --exclude=.git --exclude=.worktrees --exclude=node_modules --exclude=.next --exclude=.env --exclude=.env.local .
  if ($LASTEXITCODE -ne 0) { throw "Failed to package release" }
  Pop-Location
  $pushed = $false

  & scp -i $SshKey -o BatchMode=yes -o ConnectTimeout=10 $archive "${Vm}:$remoteArchive"
  if ($LASTEXITCODE -ne 0) { throw "Failed to upload release archive" }

  $releaseContent = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "release.sh")).Replace("`r`n", "`n").Replace("`r", "`n")
  [IO.File]::WriteAllText($releaseRunner, $releaseContent, [Text.UTF8Encoding]::new($false))
  & scp -i $SshKey -o BatchMode=yes -o ConnectTimeout=10 $releaseRunner "${Vm}:$remoteRelease"
  if ($LASTEXITCODE -ne 0) { throw "Failed to upload release runner" }

  & ssh -i $SshKey -o BatchMode=yes -o ConnectTimeout=10 $Vm "sudo bash '$remoteRelease' '$releaseId' '$remoteArchive'; rc=`$?; rm -f '$remoteRelease'; exit `$rc"
  if ($LASTEXITCODE -ne 0) { throw "OCI release failed or rolled back" }

  $publicHealth = "https://$HostName/api/health"
  $ok = $false
  for ($i = 0; $i -lt 12; $i++) {
    try {
      $health = Invoke-RestMethod -Uri $publicHealth -TimeoutSec 10
      if ($health.status -eq "ok" -and $health.database -eq "ready") {
        $ok = $true
        break
      }
    } catch { }

    Start-Sleep -Seconds 5
  }

  if (!$ok) { throw "Public HTTPS health check failed: $publicHealth" }

  Write-Host "Deployed TokenMeter $releaseId"
  Write-Host "https://$HostName/"
} finally {
  if ($pushed) { Pop-Location -ErrorAction SilentlyContinue }
  Remove-Item $archive -Force -ErrorAction SilentlyContinue
  Remove-Item $releaseRunner -Force -ErrorAction SilentlyContinue
}