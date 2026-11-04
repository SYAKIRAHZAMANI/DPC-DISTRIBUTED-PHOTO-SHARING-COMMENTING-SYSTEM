// N different users act AT THE SAME TIME, then we check the results are correct.
//   Phase 1: N users load the feed simultaneously            (concurrent reads)
//   Phase 2: N users comment on the SAME photo simultaneously (concurrent writes, same document)
//   Verify:  exactly N new comments exist -> no lost writes
// Run seed.mjs first. Usage:  node loadtest/concurrency-test.mjs <USERS>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const cfg = JSON.parse(readFileSync(new URL('./loadtest-config.json', import.meta.url), 'utf8'));
const BASE = cfg.base;
const N = Number(process.argv[2] || 10);
if (N > cfg.users) { console.error(`Only ${cfg.users} seeded users. Re-run seed.mjs with at least ${N}.`); process.exit(1); }
const users = readFileSync(new URL('./users.csv', import.meta.url), 'utf8').trim().split('\n').slice(1).slice(0, N).map((l) => l.split(','));
const headers = (t) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

const stats = (ms) => {
  const s = [...ms].sort((a, b) => a - b);
  const p = (q) => s[Math.min(s.length - 1, Math.ceil((q / 100) * s.length) - 1)];
  return { avg: +(s.reduce((a, b) => a + b, 0) / s.length).toFixed(0), median: +p(50).toFixed(0), p95: +p(95).toFixed(0), min: +s[0].toFixed(0), max: +s[s.length - 1].toFixed(0) };
};
async function timed(doFetch) {
  const t0 = performance.now();
  try { const r = await doFetch(); return { ok: r.ok, status: r.status, ms: performance.now() - t0 }; }
  catch (e) { return { ok: false, status: e.message, ms: performance.now() - t0 }; }
}
const summarize = (name, rs, wallMs) => ({
  scenario: name, users: N, success: `${rs.filter((r) => r.ok).length}/${rs.length}`,
  errorRatePct: +(100 * rs.filter((r) => !r.ok).length / rs.length).toFixed(1),
  ...stats(rs.map((r) => r.ms)), throughputReqPerSec: +(rs.length / (wallMs / 1000)).toFixed(1)
});

console.log(`Target: ${BASE}   Users: ${N}   Photo: ${cfg.photoId}`);
console.log(`Logging in ${N} users (each gets its own session token)...`);
const tokens = await Promise.all(users.map(async ([email, password]) => {
  const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const b = await r.json();
  if (!b.token) throw new Error(`Login failed for ${email}: ${r.status} ${b.message}`);
  return b.token;
}));

console.log('Phase 1: concurrent feed reads...');
let t = performance.now();
const reads = await Promise.all(tokens.map((tk) => timed(() => fetch(`${BASE}/api/photos`, { headers: headers(tk) }))));
const readWall = performance.now() - t;

const tag = `run-${Date.now()}`;
console.log('Phase 2: concurrent comments on the same photo...');
t = performance.now();
const writes = await Promise.all(tokens.map((tk, i) => timed(() => fetch(`${BASE}/api/photos/${cfg.photoId}/comments`, {
  method: 'POST', headers: headers(tk), body: JSON.stringify({ text: `Concurrent comment from tester${i + 1} [${tag}]` })
}))));
const writeWall = performance.now() - t;

const { photo } = await (await fetch(`${BASE}/api/photos/${cfg.photoId}`, { headers: headers(tokens[0]) })).json();
const found = photo.comments.filter((c) => c.text.includes(tag)).length;

const results = [summarize('View feed (GET /api/photos)', reads, readWall), summarize('Comment on same photo (POST)', writes, writeWall)];
console.log('\n=== RESULTS (times in ms) ===');
console.table(results);
const failed = [...reads, ...writes].filter((r) => !r.ok);
if (failed.length) console.log('Failed requests:', failed.map((f) => f.status));
console.log(`Correctness: expected ${N} new comments, found ${found} -> ${found === N ? 'PASS (no lost writes)' : 'FAIL'}`);

mkdirSync(new URL('./results/', import.meta.url), { recursive: true });
const file = `results/${N}users-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
writeFileSync(new URL(`./${file}`, import.meta.url), JSON.stringify({ base: BASE, at: new Date().toISOString(), users: N, results, commentsExpected: N, commentsFound: found }, null, 2));
console.log(`Saved loadtest/${file}`);
