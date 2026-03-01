/**
 * Optional wrapper for `next build` (e.g. if you need to run from a specific cwd).
 * The Windows tsbuildinfo path fix is applied via patches/next+16.1.6.patch.
 */
const { execSync } = require("child_process");
execSync("npx next build", { stdio: "inherit", shell: true });
