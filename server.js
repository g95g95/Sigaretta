const path = require('path');
const express = require('express');
const Gun = require('gun');

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/gun')) {
    next();
    return;
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`[sigaretta] server avviato su http://localhost:${PORT}`);
});

Gun({ web: server, file: 'data' });
