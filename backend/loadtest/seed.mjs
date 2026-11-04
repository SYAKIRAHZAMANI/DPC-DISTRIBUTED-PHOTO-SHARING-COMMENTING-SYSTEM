// Prepares a realistic test: N accounts, all in one friend group, plus one shared photo.
// It ALSO tests concurrency: all N users join the group at the same instant.
// Usage:  node loadtest/seed.mjs <API_BASE> <USERS>
//   e.g.  node loadtest/seed.mjs http://localhost:5000 50
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:5000').replace(/\/$/, '');
const N = Number(process.argv[3] || 20);
const PASSWORD = 'Test@12345';
const json = (token) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });

async function getToken(i) {
  const email = `tester${i}@moments.test`;
  let r = await fetch(`${BASE}/api/auth/register`, { method: 'POST', headers: json(), body: JSON.stringify({ name: `Tester ${i}`, email, password: PASSWORD }) });
  if (r.status === 409) r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: json(), body: JSON.stringify({ email, password: PASSWORD }) });
  const body = await r.json();
  if (!body.token) throw new Error(`tester${i}: ${r.status} ${body.message}`);
  return body.token;
}

console.log(`1) Creating/logging in ${N} test users...`);
const tokens = [];
for (let i = 1; i <= N; i++) tokens.push(await getToken(i));
console.log('   done');

console.log('2) Tester 1 creates (or reuses) "Load Test Group"...');
const { groups } = await (await fetch(`${BASE}/api/groups`, { headers: json(tokens[0]) })).json();
let group = groups.find((g) => g.name === 'Load Test Group');
if (!group) group = (await (await fetch(`${BASE}/api/groups`, { method: 'POST', headers: json(tokens[0]), body: JSON.stringify({ name: 'Load Test Group', description: 'Created by seed.mjs' }) })).json()).group;
console.log(`   invite code: ${group.inviteCode}`);

console.log(`3) All ${N - 1} other users join AT THE SAME TIME...`);
const joins = await Promise.all(tokens.slice(1).map((t) => fetch(`${BASE}/api/groups/join`, { method: 'POST', headers: json(t), body: JSON.stringify({ inviteCode: group.inviteCode }) })));
const after = (await (await fetch(`${BASE}/api/groups`, { headers: json(tokens[0]) })).json()).groups.find((g) => g._id === group._id);
console.log(`   join responses OK: ${joins.filter((r) => r.ok).length}/${joins.length}`);
console.log(`   members now: ${after.members.length} (expected ${N}) -> ${after.members.length === N ? 'PASS' : 'CHECK'}`);

console.log('4) Tester 1 uploads a test photo...');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const form = new FormData();
form.append('photo', new Blob([png], { type: 'image/png' }), 'loadtest.png');
form.append('caption', 'Load test photo');
const up = await fetch(`${BASE}/api/photos`, { method: 'POST', headers: { Authorization: `Bearer ${tokens[0]}` }, body: form });
const upBody = await up.json();
if (!up.ok) throw new Error(`Upload failed: ${up.status} ${upBody.message}`);
const photoId = upBody.photo._id;

writeFileSync(new URL('./users.csv', import.meta.url), ['email,password', ...tokens.map((_, i) => `tester${i + 1}@moments.test,${PASSWORD}`)].join('\n') + '\n');
writeFileSync(new URL('./loadtest-config.json', import.meta.url), JSON.stringify({ base: BASE, photoId, groupId: group._id, users: N }, null, 2));
console.log(`\nReady. PHOTO_ID = ${photoId}`);
console.log('Wrote loadtest/users.csv and loadtest/loadtest-config.json');
