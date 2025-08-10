const express = require('express');
const fs = require('fs');
const path = require('path');
const { router: authRouter, authenticateToken, requireRole } = require('./auth');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use('/api', authRouter);

const DATA_FILE = path.join(__dirname, 'airlines.json');

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const requireAuthor = requireRole('author');

app.get('/api/airlines', (req, res) => {
  res.json(readData());
});

app.get('/api/airlines/:icao', (req, res) => {
  const data = readData();
  const icao = req.params.icao.toUpperCase();
  const callsign = data[icao];
  if (!callsign) return res.status(404).end();
  res.json({ icao, callsign });
});

app.post('/api/airlines', authenticateToken, requireAuthor, (req, res) => {
  const { icao, callsign } = req.body;
  if (!icao || !callsign) {
    return res.status(400).json({ error: 'icao and callsign required' });
  }
  const data = readData();
  data[icao.toUpperCase()] = callsign;
  writeData(data);
  res.status(201).json({ icao: icao.toUpperCase(), callsign });
});

app.put('/api/airlines/:icao', authenticateToken, requireAuthor, (req, res) => {
  const { callsign } = req.body;
  const icao = req.params.icao.toUpperCase();
  const data = readData();
  if (!data[icao]) return res.status(404).end();
  data[icao] = callsign;
  writeData(data);
  res.json({ icao, callsign });
});

app.delete('/api/airlines/:icao', authenticateToken, requireAuthor, (req, res) => {
  const icao = req.params.icao.toUpperCase();
  const data = readData();
  if (!data[icao]) return res.status(404).end();
  delete data[icao];
  writeData(data);
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
