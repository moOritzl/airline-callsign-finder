const request = require('supertest');
const fs = require('fs');
const path = require('path');
const jwt = require('../auth/jwt');
const app = require('../server');

const DATA_FILE = path.join(__dirname, '..', 'airlines.json');
let originalData;

beforeEach(() => {
  originalData = fs.readFileSync(DATA_FILE, 'utf-8');
});

afterEach(() => {
  fs.writeFileSync(DATA_FILE, originalData);
});

describe('Authentication', () => {
  test('login fails with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'author', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('invalid token is rejected', async () => {
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'author', password: 'secret' });
    const token = loginRes.body.token;
    const badToken = token + 'x';
    const res = await request(app)
      .post('/api/airlines')
      .set('Authorization', `Bearer ${badToken}`)
      .send({ icao: 'INV', callsign: 'Invalid' });
    expect(res.status).toBe(403);
  });

  test('role-based access', async () => {
    const userToken = jwt.sign({ username: 'user', role: 'user' }, 'supersecret');
    let res = await request(app)
      .post('/api/airlines')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ icao: 'TST', callsign: 'Test' });
    expect(res.status).toBe(403);

    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'author', password: 'secret' });
    const token = loginRes.body.token;
    res = await request(app)
      .post('/api/airlines')
      .set('Authorization', `Bearer ${token}`)
      .send({ icao: 'TST', callsign: 'Test' });
    expect(res.status).toBe(201);
  });
});
