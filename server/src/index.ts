import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { Redis } from 'ioredis';

const app = new Hono();

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const CACHE_TTL_SECONDS = process.env.CACHE_TTL ?? 10;
const TVMAZE_BASE = process.env.TVMAZE_BASE_URL || 'https://api.tvmaze.com';

const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
});

app.get('/search/shows', async c => {
  const q = (c.req.query('q') ?? '').trim();
  if (!q) return c.json({ error: 'Missing query param: q' }, 400);

  const key = `cup-movie://api.tvmaze.com/search/shows?q=${q.toLowerCase()}`;

  try {
    const cached = await redis.get(key);
    if (cached) {
      c.header('X-Cache', 'HIT');
      c.header('Cache-Control', 'public, max-age=60');
      return c.body(cached, 200, { 'Content-Type': 'application/json; charset=utf-8' });
    }

    const url = `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(q)}`;
    const res = await fetch(url);

    if (!res.ok) {
      return c.json({ error: `Upstream error ${res.status}: ${res.statusText}` }, 502);
    }

    const body = await res.text(); // we don't have to parse
    await redis.set(key, body, 'EX', CACHE_TTL_SECONDS);

    c.header('X-Cache', 'MISS');
    c.header('Cache-Control', 'public, max-age=60');
    return c.body(body, 200, { 'Content-Type': 'application/json; charset=utf-8' });
  } catch (err) {
    return c.json({ error: 'Proxy failure' }, 500);
  }
});

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});