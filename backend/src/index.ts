import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from './db';
import { users } from './db/schema';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not set');
}

const port = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
};

async function issueAuthCookie(
  tokenCookie: { set: (config: Record<string, unknown>) => unknown },
  sign: (payload: { userId: number }) => Promise<string>,
  userId: number
) {
  const token = await sign({ userId });
  tokenCookie.set({
    ...cookieOptions,
    value: token,
    maxAge: TOKEN_TTL_SECONDS,
  });
}

// ponytail: stateless JWT cookie; add a sessions table if server-side revocation is needed.
const app = new Elysia()
  .use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  )
  .use(
    jwt({
      name: 'jwt',
      secret: jwtSecret,
      exp: '7d',
      schema: t.Object({
        userId: t.Number(),
      }),
    })
  )
  .onError(({ code, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return { error: 'Please check your input fields.' };
    }
  })
  .get('/health', () => ({ ok: true }))
  .post(
    '/auth/register',
    async ({ body, jwt, cookie, set }) => {
      const name = body.name.trim();
      const email = body.email.trim().toLowerCase();

      if (!name) {
        set.status = 400;
        return { error: 'Name is required.' };
      }

      const passwordHash = await Bun.password.hash(body.password);

      try {
        const [result] = await db
          .insert(users)
          .values({ name, email, passwordHash });

        const user = { id: result.insertId, name, email };
        await issueAuthCookie(cookie.token, jwt.sign, user.id);

        set.status = 201;
        return { user };
      } catch (err) {
        const dbErr = err as { code?: string; cause?: { code?: string } };
        if (dbErr.code === 'ER_DUP_ENTRY' || dbErr.cause?.code === 'ER_DUP_ENTRY') {
          set.status = 409;
          return { error: 'Email is already registered.' };
        }
        throw err;
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        email: t.String({ format: 'email', maxLength: 255 }),
        password: t.String({ minLength: 6, maxLength: 128 }),
      }),
    }
  )
  .post(
    '/auth/login',
    async ({ body, jwt, cookie, set }) => {
      const email = body.email.trim().toLowerCase();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || !(await Bun.password.verify(body.password, user.passwordHash))) {
        set.status = 401;
        return { error: 'Invalid email or password.' };
      }

      await issueAuthCookie(cookie.token, jwt.sign, user.id);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email', maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 128 }),
      }),
    }
  )
  .post('/auth/logout', ({ cookie }) => {
    cookie.token.set({
      ...cookieOptions,
      value: '',
      maxAge: 0,
      expires: new Date(0),
    });
    return { ok: true };
  })
  .get('/auth/me', async ({ jwt, cookie, set }) => {
    const rawToken = typeof cookie.token.value === 'string' ? cookie.token.value : undefined;
    if (!rawToken) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const payload = await jwt.verify(rawToken);
    if (!payload) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const [user] = await db
      .select(publicUserColumns)
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    return { user };
  });

if (import.meta.main) {
  app.listen(port);
  console.log(`Elysia backend running on http://localhost:${app.server?.port ?? port}`);
}

export { app };
