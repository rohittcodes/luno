import 'server-only'

import crypto from 'crypto'

/**
 * Encryption utility for sensitive data
 * Uses AES-256-GCM for authenticated encryption
 * 
 * Marked with 'server-only' to prevent client-side access
 */

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 32 bytes for AES-256
const IV_LENGTH = 16 // 16 bytes for AES-GCM
const TAG_LENGTH = 16 // 16 bytes for authentication tag

/**
 * Get encryption key from environment
 * In production, use a proper key management system (e.g., AWS KMS, HashiCorp Vault)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }
  
  // If key is hex encoded, decode it, otherwise use directly
  let keyBuffer: Buffer
  if (key.length === KEY_LENGTH * 2) {
    // Assuming hex encoded
    keyBuffer = Buffer.from(key, 'hex')
  } else {
    // Derive key from string using PBKDF2
    keyBuffer = crypto.pbkdf2Sync(key, 'salt', 100000, KEY_LENGTH, 'sha256')
  }
  
  return keyBuffer
}

/**
 * Encrypt sensitive data
 */
export function encrypt(data: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Combine IV + tag + encrypted data
    const result = `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
    
    return result
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedData.split(':')
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypt JSON object
 */
export function encryptJSON<T>(data: T): string {
  return encrypt(JSON.stringify(data))
}

/**
 * Decrypt JSON object
 */
export function decryptJSON<T>(encryptedData: string): T {
  const decrypted = decrypt(encryptedData)
  return JSON.parse(decrypted) as T
}

