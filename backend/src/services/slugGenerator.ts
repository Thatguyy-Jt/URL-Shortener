import { randomBytes } from 'crypto';
import { linkRepository } from '../repositories/linkRepository';

const CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a random alphanumeric slug of the given length.
 *
 * Uses crypto.randomBytes (CSPRNG) instead of Math.random() for better
 * distribution — each byte is mapped to a character in the 36-char set via
 * modulo, giving a slight bias toward the first (256 % 36 = 4) characters.
 * For URL slugs this bias is completely acceptable.
 */
export function generateSlug(length = 6): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((byte) => CHARSET[byte % CHARSET.length])
    .join('');
}

/**
 * Generate a slug that is guaranteed to be unique in the database.
 *
 * Retries up to `maxRetries` times if the generated slug already exists.
 * With a 36-char set and length=6, there are ~2.2 billion possible slugs.
 * At 1 million stored links the per-attempt collision probability is ~0.05%.
 * Five retries reduces practical failure probability to negligibly small.
 *
 * @throws Error if all retries are exhausted (extremely unlikely in practice)
 */
export async function generateUniqueSlug(
  length = 6,
  maxRetries = 5,
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const slug = generateSlug(length);
    const existing = await linkRepository.findBySlug(slug);
    if (!existing) return slug;
  }

  throw new Error(
    `Could not generate a unique slug after ${maxRetries} attempts. ` +
      'This is extremely unlikely — please retry the operation.',
  );
}
