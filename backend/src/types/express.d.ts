/**
 * Augment Express's Request type to include `user` — populated by the
 * authenticate middleware after a valid JWT is verified.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export {};
