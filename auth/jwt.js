const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign(payload, secret) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const signature = base64url(
    crypto.createHmac('sha256', secret).update(data).digest()
  );
  return `${data}.${signature}`;
}

function verify(token, secret, cb) {
  try {
    const [header, body, signature] = token.split('.');
    const data = `${header}.${body}`;
    const expected = base64url(
      crypto.createHmac('sha256', secret).update(data).digest()
    );
    if (expected !== signature) throw new Error('invalid signature');
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    if (cb) cb(null, payload);
    return payload;
  } catch (err) {
    if (cb) cb(err);
    else throw err;
  }
}

module.exports = { sign, verify };
