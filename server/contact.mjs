import { createCipheriv, createHmac, randomBytes } from 'node:crypto';
const topics = ['', 'An AI Agent', 'An AI App', 'Tokenization or digital utility', 'Not sure yet'];
export function createContactHandler({ store, key, origin, verifyChallenge, rateLimit } = {}) {
  const ready = store && Buffer.isBuffer(key) && key.length === 32 && origin && verifyChallenge && rateLimit;
  return async function contact(request, context = {}) {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (request.headers.get('origin') === origin) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });
    if (!ready) return reply(503, { message: 'Requests are not available yet.' });
    if (new URL(request.url).pathname !== '/contact') return reply(404, { message: 'Not found.' });
    if (request.headers.get('origin') !== origin) return reply(403, { message: 'Request origin not allowed.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key' } });
    if (request.method !== 'POST') return reply(405, { message: 'Use POST.' });
    if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) return reply(415, { message: 'Use JSON.' });
    const id = request.headers.get('idempotency-key');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '')) return reply(400, { message: 'A request identifier is required.' });
    try {
      if (!context.clientAddress || !await rateLimit(context.clientAddress)) return reply(429, { message: 'Please wait before trying again.' });
      const reader = request.body?.getReader();
      if (!reader) return reply(400, { message: 'Missing request.' });
      let size = 0; const chunks = [];
      for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 12000) { await reader.cancel(); return reply(413, { message: 'Request too large.' }); } chunks.push(value); }
      let input; try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reply(400, { message: 'Invalid JSON.' }); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, { message: 'Invalid request.' });
      const payload = {};
      for (const [field, limit] of Object.entries({ name: 120, email: 254, topic: 80, notes: 4000 })) {
        if (typeof input[field] !== 'string' || input[field].length > limit) return reply(400, { message: 'Check the form fields.' });
        payload[field] = input[field].trim();
      }
      if (!payload.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email) || !topics.includes(payload.topic)) return reply(400, { message: 'Check your name, email and topic.' });
      if (typeof input.challengeToken !== 'string' || input.challengeToken.length > 4096 || !await verifyChallenge(input.challengeToken, context.clientAddress)) return reply(403, { message: 'Please complete verification again.' });
      const plain = JSON.stringify(payload);
      const hash = createHmac('sha256', key).update('nolmt-contact-v1:').update(plain).digest('hex');
      const nonce = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, nonce); cipher.setAAD(Buffer.from(id));
      const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      const envelope = JSON.stringify({ version: 1, nonce: nonce.toString('base64'), ciphertext: ciphertext.toString('base64'), tag: cipher.getAuthTag().toString('base64') });
      const saved = await store.save({ id, hash, envelope });
      if (saved.conflict) return reply(409, { message: 'This request identifier was already used for different information.' });
      return reply(200, { ok: true, receipt: id });
    } catch { return reply(503, { message: 'Receipt could not be confirmed. Retry the same request.' }); }
  };
}
export function postgresContactStore(query) {
  return { async save({ id, hash, envelope }) {
    await query('insert into nolmt_private.inquiries (id, payload_hash, envelope) values ($1, $2, $3) on conflict (id) do nothing', [id, hash, envelope]);
    const { rows } = await query('select payload_hash from nolmt_private.inquiries where id = $1', [id]);
    if (!rows[0]) throw new Error('No durable receipt');
    return { conflict: rows[0].payload_hash !== hash };
  } };
}
