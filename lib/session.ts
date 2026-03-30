import { SessionOptions } from 'iron-session';

export interface SessionData {
  addedCount: number;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'charanga-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutos
  },
};
