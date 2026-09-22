// Usage: node backend/scripts/make-hash.js "your-admin-password"
// Prints a scrypt hash to paste into Render env as ADMIN_PASSWORD_HASH.
// Run on your own machine; never commit the password or the hash to git.
const { hashPassword } = require("../src/lib/auth");

const pw = process.argv[2];
if (!pw || pw.length < 12) {
  console.error("Provide a password of at least 12 characters.");
  process.exit(1);
}
console.log(hashPassword(pw));
