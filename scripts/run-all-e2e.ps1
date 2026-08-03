$ErrorActionPreference = "Continue"

& npx.cmd playwright test --reporter=line
$exitCode = $LASTEXITCODE
Set-Content -LiteralPath "artifacts/all-e2e.exit" -Value $exitCode -Encoding ascii
exit $exitCode
