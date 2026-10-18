param(
  [string]$Message = "Update iPhone widgets"
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$project = $PSScriptRoot
$files = @(
  'widget-01.js', 'widget-02.js', 'widget-03.js',
  'widget-04.js', 'widget-05.js', 'update-iphone.js',
  'README.md', 'publish.ps1'
)

Push-Location $repo
try {
  $branch = (git branch --show-current).Trim()
  if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') {
    throw "Expected main branch; current branch: $branch"
  }
  git fetch origin main
  if ($LASTEXITCODE -ne 0) { throw 'Could not fetch origin/main.' }
  $local = (git rev-parse HEAD).Trim()
  $remote = (git rev-parse origin/main).Trim()
  if ($local -ne $remote) {
    throw 'Local main differs from origin/main. Review git status and pull/rebase before publishing.'
  }
  foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath (Join-Path $project $file))) {
      throw "Missing project file: $file"
    }
  }
  git add -- ($files | ForEach-Object { "iphone-widgets/$_" })
  if ($LASTEXITCODE -ne 0) { throw 'git add failed.' }
  git diff --cached --check
  if ($LASTEXITCODE -ne 0) { throw 'Whitespace check failed.' }
  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'No widget changes to publish.'
    exit 0
  }
  git diff --cached --stat
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { throw 'git commit failed.' }
  git push origin main
  if ($LASTEXITCODE -ne 0) { throw 'git push failed. Commit remains local; run this script again after fixing access.' }
  Write-Host 'Published. Now run the updater manually on iPhone, review, then test the widget.'
} finally {
  Pop-Location
}
