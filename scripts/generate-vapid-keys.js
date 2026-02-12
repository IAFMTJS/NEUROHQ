/**
 * Generate VAPID keys for Web Push.
 * Run: node scripts/generate-vapid-keys.js
 * Add the output to .env.local as NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.
 */
async function main() {
  let webpush;
  try {
    webpush = require("web-push");
  } catch {
    console.error("Run: npm install web-push --save-dev");
    process.exit(1);
  }
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log("Add these to .env.local:\n");
  console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + vapidKeys.publicKey);
  console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
