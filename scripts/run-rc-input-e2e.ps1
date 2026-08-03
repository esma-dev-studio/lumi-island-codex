$ErrorActionPreference = "Continue"

& npx.cmd playwright test e2e/release-candidate.spec.ts -g "tablet landscape|touch direction" --reporter=line
$exitCode = $LASTEXITCODE
Set-Content -LiteralPath "artifacts/rc-input-e2e.exit" -Value $exitCode -Encoding ascii
exit $exitCode
