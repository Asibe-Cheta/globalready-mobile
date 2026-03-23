#!/usr/bin/env node
/**
 * Generate Apple Sign In client secret (JWT) for Supabase.
 *
 * Supabase does NOT accept the raw .p8 file. It expects a JWT (client secret)
 * generated from your Team ID, Key ID, Services ID, and .p8 private key.
 *
 * Usage:
 *   node scripts/generate-apple-client-secret.js
 *
 * Set environment variables (or create scripts/.env - DO NOT commit):
 *   APPLE_TEAM_ID=PVQF78H486
 *   APPLE_KEY_ID=ABC123XYZ0
 *   APPLE_SERVICES_ID=com.globalready.app.service
 *   APPLE_PRIVATE_KEY_PATH=./AuthKey_ABC123XYZ0.p8
 *
 * Or pass as arguments:
 *   node scripts/generate-apple-client-secret.js <TeamID> <KeyID> <ServicesID> <path-to-.p8>
 *
 * Copy the printed JWT into Supabase Dashboard → Authentication → Providers → Apple
 * → "Secret Key (for OAuth)".
 *
 * The secret expires in 6 months. Re-run this script and update Supabase when it expires.
 */

const fs = require('fs');
const path = require('path');

let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (e) {
  console.error('Run: npm install -D jsonwebtoken');
  process.exit(1);
}

function generateClientSecret(teamId, keyId, servicesId, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 15777000; // ~6 months (Apple max)

  return jwt.sign(
    {
      iss: teamId,
      iat: now,
      exp,
      aud: 'https://appleid.apple.com',
      sub: servicesId,
    },
    privateKeyPem,
    {
      algorithm: 'ES256',
      keyid: keyId,
      header: { alg: 'ES256', kid: keyId },
    }
  );
}

function main() {
  let teamId, keyId, servicesId, keyPath;

  if (process.argv.length >= 6) {
    [, , teamId, keyId, servicesId, keyPath] = process.argv;
  } else {
    const loadEnv = (filePath) => {
      if (fs.existsSync(filePath)) {
        const env = fs.readFileSync(filePath, 'utf8');
        env.split('\n').forEach((line) => {
          const m = line.match(/^\s*([^#=]+)=(.*)$/);
          if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
        });
      }
    };
    loadEnv(path.join(process.cwd(), '.env'));
    loadEnv(path.join(__dirname, '.env'));
    teamId = process.env.APPLE_TEAM_ID;
    keyId = process.env.APPLE_KEY_ID;
    servicesId = process.env.APPLE_SERVICES_ID;
    keyPath = process.env.APPLE_PRIVATE_KEY_PATH;
  }

  if (!teamId || !keyId || !servicesId || !keyPath) {
    console.error(`
Usage:
  node scripts/generate-apple-client-secret.js <TeamID> <KeyID> <ServicesID> <path-to-.p8>

Example:
  node scripts/generate-apple-client-secret.js PVQF78H486 ABC123XYZ0 com.globalready.app.service ./AuthKey_ABC123XYZ0.p8

Or set env vars in project .env or scripts/.env: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_SERVICES_ID, APPLE_PRIVATE_KEY_PATH
`);
    process.exit(1);
  }

  const resolvedPath = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error('Error: .p8 file not found at', resolvedPath);
    process.exit(1);
  }

  const privateKeyPem = fs.readFileSync(resolvedPath, 'utf8');
  const token = generateClientSecret(teamId, keyId, servicesId, privateKeyPem);

  console.log('\nCopy this entire token into Supabase → Authentication → Providers → Apple → "Secret Key (for OAuth)":\n');
  console.log(token);
  console.log('\n(Expires in 6 months. Re-run this script and update Supabase when it expires.)\n');
}

main();
