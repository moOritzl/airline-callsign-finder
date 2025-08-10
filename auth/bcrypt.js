const crypto = require('crypto');

function hash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${derived}`;
}

function compare(password, hashed) {
  const [salt, key] = hashed.split(':');
  const derived = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return derived === key;
}

module.exports = { hash, compare };
