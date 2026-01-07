import { scryptAsync } from '@noble/hashes/scrypt';
import { bytesToHex, randomBytes } from '@noble/hashes/utils';

const config = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64
};

async function hashPassword(password) {
  const saltBytes = randomBytes(16);
  const salt = bytesToHex(saltBytes);
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: config.N,
    p: config.p,
    r: config.r,
    dkLen: config.dkLen,
    maxmem: 128 * config.N * config.r * 2
  });
  return `${salt}:${bytesToHex(key)}`;
}

const password = 'FitTrackr2024!';
const hash = await hashPassword(password);
console.log('Password:', password);
console.log('Hash:', hash);
