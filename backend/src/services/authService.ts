import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

const SALT_ROUNDS = 12;
const JWT_EXPIRY = '7d';

interface TokenPayload {
  userId: string;
  email: string;
}

function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function safeUser(user: { _id: { toString(): string }; email: string; name: string }) {
  return { id: user._id.toString(), email: user.email, name: user.name };
}

export const authService = {
  async register(input: { email: string; password: string; name: string }) {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await User.create({
      email: input.email.toLowerCase(),
      password: hashedPassword,
      name: input.name.trim(),
    });

    const token = signToken({ userId: user._id.toString(), email: user.email });
    return { token, user: safeUser(user) };
  },

  async login(input: { email: string; password: string }) {
    const user = await User.findOne({ email: input.email.toLowerCase() });

    // Use the same error message for both "user not found" and "wrong password"
    // to prevent user enumeration attacks
    const invalidCredentials = new AppError('Invalid email or password.', 401);

    if (!user) throw invalidCredentials;

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) throw invalidCredentials;

    const token = signToken({ userId: user._id.toString(), email: user.email });
    return { token, user: safeUser(user) };
  },
};
