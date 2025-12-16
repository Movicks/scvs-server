import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config({ override: true });

function ensureDbName(input?: string): string {
  const fallback = 'mongodb://localhost:27017/scvs';
  let url = (input || '').trim();
  if (!url) return fallback;
  url = url.replace(/\s+/g, '');
  const m = url.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/([^?]*))?(\?.*)?$/i);
  if (!m) return fallback;
  const base = m[1];
  const pathDb = m[2] || '';
  const query = m[3] || '';
  const db = pathDb && pathDb !== '' ? pathDb : 'scvs';
  return `${base}/${db}${query}`;
}

const raw = process.env.DATABASE_URL;
const url = ensureDbName(raw);
console.log('[PrismaConfig] Using DATABASE_URL =', url);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url,
  },
});