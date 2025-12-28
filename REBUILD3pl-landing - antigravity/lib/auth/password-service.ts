import bcrypt from 'bcryptjs'

const SALT_ROUNDS = Number(process.env.AUTH_SALT_ROUNDS ?? 12)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

