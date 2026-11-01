import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { query } from '../../db/index.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    const { email, username, displayName, password, dateOfBirth } = request.body as any;

    if (!email || !username || !displayName || !password) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Missing required registration fields' },
      });
    }

    // Check unique email and username
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return reply.status(409).send({
        error: { code: 'CONFLICT', message: 'Email or username already in use' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userRes = await query(
      `INSERT INTO users (email, username, display_name, dob)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, display_name as "displayName", avatar_url as "avatarUrl", avatar_kind as "avatarKind", age_tier as "ageTier", created_at as "createdAt"`,
      [email.toLowerCase(), username.toLowerCase(), displayName, dateOfBirth || null]
    );

    const user = userRes.rows[0];

    // Create auth identity
    await query(
      'INSERT INTO auth_identities (user_id, provider, subject, password_hash) VALUES ($1, $2, $3, $4)',
      [user.id, 'password', email.toLowerCase(), passwordHash]
    );

    // Create default user settings and status
    await query(
      'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [user.id]
    );
    await query(
      'INSERT INTO user_status (user_id, down_for, text) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [user.id, 'talk', 'Hey there! I am using Nudge.']
    );

    const token = fastify.jwt.sign({ id: user.id, username: user.username });

    return {
      user,
      accessToken: token,
    };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const { identifier, password } = request.body as any;

    if (!identifier || !password) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Username/email and password required' },
      });
    }

    const userRes = await query(
      `SELECT u.id, u.email, u.username, u.display_name as "displayName", u.avatar_url as "avatarUrl",
              u.avatar_kind as "avatarKind", u.age_tier as "ageTier", u.created_at as "createdAt",
              ai.password_hash
       FROM users u
       JOIN auth_identities ai ON u.id = ai.user_id
       WHERE u.email = $1 OR u.username = $1`,
      [identifier.toLowerCase()]
    );

    if (userRes.rowCount === 0) {
      return reply.status(401).send({
        error: { code: 'UNAUTHENTICATED', message: 'Invalid credentials' },
      });
    }

    const userRow = userRes.rows[0];
    const valid = await bcrypt.compare(password, userRow.password_hash || '');
    if (!valid) {
      return reply.status(401).send({
        error: { code: 'UNAUTHENTICATED', message: 'Invalid credentials' },
      });
    }

    const token = fastify.jwt.sign({ id: userRow.id, username: userRow.username });

    const statusRes = await query(
      'SELECT down_for as "downFor", text, expires_at as "expiresAt" FROM user_status WHERE user_id = $1',
      [userRow.id]
    );

    const { password_hash, ...user } = userRow;
    user.status = statusRes.rows[0] || { downFor: 'talk', text: '' };

    return {
      user,
      accessToken: token,
    };
  });

  // Get current authenticated user
  fastify.get('/me', async (request, reply) => {
    try {
      await request.jwtVerify();
      const decoded = request.user as { id: string };

      const userRes = await query(
        `SELECT id, email, username, display_name as "displayName", bio,
                avatar_url as "avatarUrl", avatar_kind as "avatarKind", age_tier as "ageTier",
                created_at as "createdAt"
         FROM users WHERE id = $1`,
        [decoded.id]
      );

      if (userRes.rowCount === 0) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      }

      const statusRes = await query(
        'SELECT down_for as "downFor", text, expires_at as "expiresAt" FROM user_status WHERE user_id = $1',
        [decoded.id]
      );

      const user = userRes.rows[0];
      user.status = statusRes.rows[0] || { downFor: 'talk', text: '' };

      return { user };
    } catch (err) {
      return reply.status(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Invalid token' } });
    }
  });

  // Switch demo account / list available demo accounts for testing
  fastify.get('/demo-accounts', async () => {
    const res = await query(
      `SELECT u.id, u.email, u.username, u.display_name as "displayName", u.bio,
              u.avatar_url as "avatarUrl", u.avatar_kind as "avatarKind",
              s.down_for as "downFor", s.text as "statusText"
       FROM users u
       LEFT JOIN user_status s ON u.id = s.user_id
       ORDER BY u.created_at ASC`
    );
    return { accounts: res.rows };
  });

  fastify.post('/demo-login', async (request, reply) => {
    const { userId } = request.body as any;
    const userRes = await query(
      `SELECT id, email, username, display_name as "displayName", bio,
              avatar_url as "avatarUrl", avatar_kind as "avatarKind", age_tier as "ageTier",
              created_at as "createdAt"
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rowCount === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Account not found' } });
    }

    const user = userRes.rows[0];
    const statusRes = await query(
      'SELECT down_for as "downFor", text, expires_at as "expiresAt" FROM user_status WHERE user_id = $1',
      [user.id]
    );
    user.status = statusRes.rows[0] || { downFor: 'talk', text: '' };

    const token = fastify.jwt.sign({ id: user.id, username: user.username });
    return { user, accessToken: token };
  });
};
