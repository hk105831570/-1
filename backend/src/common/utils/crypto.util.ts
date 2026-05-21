import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = process.env.ID_CIPHER_KEY || '0123456789abcdef0123456789abcdef';

function getKey(): Buffer {
  return Buffer.from(KEY, 'hex');
}

/**
 * AES-256-CBC 加密身份证号
 * 格式: iv:encrypted (hex编码)
 */
export function encryptIdNumber(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plain, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密身份证号
 */
export function decryptIdNumber(encrypted: string): string {
  const key = getKey();
  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
