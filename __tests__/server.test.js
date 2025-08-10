const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

const DATA_FILE = path.join(__dirname, '..', 'airlines.json');
let originalData;

beforeEach(() => {
  originalData = fs.readFileSync(DATA_FILE, 'utf-8');
});

afterEach(() => {
  fs.writeFileSync(DATA_FILE, originalData);
});

describe('Airline API', () => {
  test('GET /api/airlines returns all records', async () => {
    const data = JSON.parse(originalData);
    const res = await request(app).get('/api/airlines');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(data);
  });

  test('GET /api/airlines/:icao returns a single record and 404 for unknown codes', async () => {
    const res = await request(app).get('/api/airlines/SWA');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ icao: 'SWA', callsign: 'SOUTHWEST' });

    const res404 = await request(app).get('/api/airlines/ZZZ');
    expect(res404.status).toBe(404);
  });

  test('POST, PUT, DELETE require auth token and persist data changes', async () => {
    const code = 'TST';
    const callsign = 'TestAir';

    let res = await request(app).post('/api/airlines').send({ icao: code, callsign });
    expect(res.status).toBe(401);

    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'author', password: 'secret' });
    const token = loginRes.body.token;

    res = await request(app)
      .post('/api/airlines')
      .set('Authorization', `Bearer ${token}`)
      .send({ icao: code, callsign });
    expect(res.status).toBe(201);

    res = await request(app).get(`/api/airlines/${code}`);
    expect(res.status).toBe(200);
    expect(res.body.callsign).toBe(callsign);

    res = await request(app).put(`/api/airlines/${code}`).send({ callsign: 'Updated' });
    expect(res.status).toBe(401);

    res = await request(app)
      .put(`/api/airlines/${code}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ callsign: 'Updated' });
    expect(res.status).toBe(200);

    res = await request(app).get(`/api/airlines/${code}`);
    expect(res.body.callsign).toBe('Updated');

    res = await request(app).delete(`/api/airlines/${code}`);
    expect(res.status).toBe(401);

    res = await request(app)
      .delete(`/api/airlines/${code}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);

    res = await request(app).get(`/api/airlines/${code}`);
    expect(res.status).toBe(404);
  });
});
