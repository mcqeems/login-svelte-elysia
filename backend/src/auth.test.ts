import { afterAll, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db, pool } from './db';
import { users } from './db/schema';
import { app } from './index';

const testEmail = `smoke-${Date.now()}@example.com`;
let sessionCookie = '';

function jsonReq(path: string, body?: unknown, cookie?: string) {
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (cookie) headers.set('Cookie', cookie);

  return app.handle(
    new Request(`http://localhost/auth${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  );
}

describe('auth endpoints', () => {
  afterAll(async () => {
    await db.delete(users).where(eq(users.email, testEmail));
    await pool.end();
  });

  it('registers a user and sets an HttpOnly cookie', async () => {
    const res = await jsonReq('/register', {
      name: 'Smoke Tester',
      email: testEmail,
      password: 'secret123',
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as { user: { id: number; name: string; email: string } };
    expect(data.user.email).toBe(testEmail);
    expect('passwordHash' in data.user).toBe(false);

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie.toLowerCase()).toContain('path=/');
    sessionCookie = setCookie.split(';')[0] ?? '';
    expect(sessionCookie.startsWith('token=')).toBe(true);
  });

  it('rejects duplicate email with 409', async () => {
    const res = await jsonReq('/register', {
      name: 'Duplicate',
      email: testEmail,
      password: 'secret123',
    });
    expect(res.status).toBe(409);
  });

  it('returns current user on /auth/me with cookie', async () => {
    const res = await jsonReq('/me', undefined, sessionCookie);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { user: { email: string } };
    expect(data.user.email).toBe(testEmail);
  });

  it('rejects invalid password and logs in with valid password', async () => {
    const badRes = await jsonReq('/login', { email: testEmail, password: 'wrong' });
    expect(badRes.status).toBe(401);

    const okRes = await jsonReq('/login', { email: testEmail, password: 'secret123' });
    expect(okRes.status).toBe(200);
  });

  it('clears cookie on logout and rejects unauthenticated /auth/me', async () => {
    const logoutRes = await app.handle(
      new Request('http://localhost/auth/logout', {
        method: 'POST',
        headers: { Cookie: sessionCookie },
      })
    );
    expect(logoutRes.status).toBe(200);
    expect((logoutRes.headers.get('set-cookie') ?? '').toLowerCase()).toContain('max-age=0');

    const meRes = await jsonReq('/me');
    expect(meRes.status).toBe(401);
  });
});
