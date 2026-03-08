/**
 * Remove .next/lock if it exists so next build can run.
 * Next.js leaves the lock when a build is killed or times out; this prevents "Unable to acquire lock" on the next run.
 */
const fs = require("fs");
const path = require("path");
const lockPath = path.join(process.cwd(), ".next", "lock");
try {
  fs.unlinkSync(lockPath);
  console.log("Removed stale .next/lock");
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
