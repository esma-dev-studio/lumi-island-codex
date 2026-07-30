import fs from "node:fs";
import validator from "gltf-validator";

const paths = process.argv.slice(2);
const results = [];
for (const path of paths) {
  try {
    const bytes = new Uint8Array(fs.readFileSync(path));
    const report = await validator.validateBytes(bytes, {
      uri: path,
      maxIssues: 200,
      ignoredIssues: [],
    });
    results.push({
      file: path,
      errors: report.issues.numErrors,
      warnings: report.issues.numWarnings,
      infos: report.issues.numInfos,
      hints: report.issues.numHints,
      messages: report.issues.messages.slice(0, 20),
    });
  } catch (error) {
    results.push({ file: path, errors: 1, runtimeError: String(error) });
  }
}
process.stdout.write(JSON.stringify(results));
process.exitCode = results.some((result) => result.errors > 0) ? 1 : 0;