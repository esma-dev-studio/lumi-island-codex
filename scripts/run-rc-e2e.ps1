$ErrorActionPreference = "Continue"

& npx.cmd playwright test e2e/release-candidate.spec.ts -g "empty save" --reporter=line
$exitCode = $LASTEXITCODE
Set-Content -LiteralPath "artifacts/rc-e2e.exit" -Value $exitCode -Encoding ascii
exit $exitCode
