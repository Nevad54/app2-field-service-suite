const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/status', (_req, res) => {
  res.json({ ok: true, service: 'app2-field-service-suite-backend', timestamp: new Date().toISOString() });
});

app.get('/api/jobs', (_req, res) => {
  res.json([
    { id: 'JOB-1001', title: 'HVAC preventive maintenance', status: 'new', priority: 'medium' },
    { id: 'JOB-1002', title: 'Generator inspection', status: 'assigned', priority: 'high' }
  ]);
});

app.listen(PORT, () => {
  console.log(`App 2 backend running on http://localhost:${PORT}`);
});
