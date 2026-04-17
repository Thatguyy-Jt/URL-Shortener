/**
 * authService.test.ts
 *
 * Tests cover register, login, and getMe.
 * The User model, bcryptjs, and jsonwebtoken are all mocked so these tests
 * run without a real database or crypto operations.
 */

import { Types } from 'mongoose';
import { authService } from '../../services/authService';
import { User } from '../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../models/User', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Cast to plain mock objects so TypeScript allows .mockResolvedValue etc.
const MockUser = User as unknown as {
  findOne: jest.Mock;
  create: jest.Mock;
  findById: jest.Mock;
};

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const testUserId = new Types.ObjectId();

const mockUserDoc = {
  _id: testUserId,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed_password_stored_in_db',
};

// ── authService.register ──────────────────────────────────────────────────────

describe('authService.register', () => {
  beforeEach(() => {
    mockBcrypt.hash.mockResolvedValue('hashed_password' as never);
    mockJwt.sign.mockReturnValue('test.jwt.token' as never);
  });

  it('throws AppError 409 when the email is already registered', async () => {
    MockUser.findOne.mockResolvedValue(mockUserDoc);

    await expect(
      authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('hashes the password with bcrypt before creating the user', async () => {
    MockUser.findOne.mockResolvedValue(null);
    MockUser.create.mockResolvedValue(mockUserDoc);

    await authService.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
  });

  it('stores the email in lowercase regardless of input casing', async () => {
    MockUser.findOne.mockResolvedValue(null);
    MockUser.create.mockResolvedValue(mockUserDoc);

    await authService.register({
      email: 'TEST@EXAMPLE.COM',
      password: 'password123',
      name: 'Test User',
    });

    expect(MockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' }),
    );
  });

  it('returns a JWT token and a safe user object (no password field)', async () => {
    MockUser.findOne.mockResolvedValue(null);
    MockUser.create.mockResolvedValue(mockUserDoc);

    const result = await authService.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(result.token).toBe('test.jwt.token');
    expect(result.user).toMatchObject({ email: 'test@example.com', name: 'Test User' });
    expect(result.user).not.toHaveProperty('password');
  });
});

// ── authService.login ─────────────────────────────────────────────────────────

describe('authService.login', () => {
  beforeEach(() => {
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockJwt.sign.mockReturnValue('test.jwt.token' as never);
  });

  it('returns a token and user data on valid credentials', async () => {
    MockUser.findOne.mockResolvedValue(mockUserDoc);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.token).toBe('test.jwt.token');
    expect(result.user).toMatchObject({ email: 'test@example.com' });
    expect(result.user).not.toHaveProperty('password');
  });

  it('throws AppError 401 when the email does not exist', async () => {
    MockUser.findOne.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'unknown@example.com', password: 'password123' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws AppError 401 when the password is incorrect', async () => {
    MockUser.findOne.mockResolvedValue(mockUserDoc);
    mockBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrongpassword' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns the SAME error message for unknown email and wrong password (prevents enumeration)', async () => {
    // Unknown email
    MockUser.findOne.mockResolvedValue(null);
    const err1 = await authService
      .login({ email: 'noone@x.com', password: 'p' })
      .catch((e) => e);

    // Wrong password
    MockUser.findOne.mockResolvedValue(mockUserDoc);
    mockBcrypt.compare.mockResolvedValue(false as never);
    const err2 = await authService
      .login({ email: 'test@example.com', password: 'wrong' })
      .catch((e) => e);

    expect(err1.message).toBe(err2.message);
    expect(err1.statusCode).toBe(err2.statusCode);
  });
});

// ── authService.getMe ─────────────────────────────────────────────────────────

describe('authService.getMe', () => {
  it('returns user data (without password) for a valid userId', async () => {
    MockUser.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockUserDoc),
    });

    const result = await authService.getMe(testUserId.toString());

    expect(result).toMatchObject({ email: 'test@example.com', name: 'Test User' });
    expect(result).not.toHaveProperty('password');
  });

  it('throws AppError 404 when the user does not exist', async () => {
    MockUser.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(authService.getMe(testUserId.toString())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
