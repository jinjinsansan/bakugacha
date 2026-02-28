import bcrypt from 'bcryptjs';

const HASH_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  if (!plain || plain.length < 8) {
    throw new Error('パスワードは8文字以上で入力してください。');
  }
  return bcrypt.hash(plain, HASH_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  if (!plain || !hashed) return false;
  try {
    return await bcrypt.compare(plain, hashed);
  } catch {
    return false;
  }
}
