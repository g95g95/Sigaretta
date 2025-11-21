const path = require('path');
const express = require('express');
const Gun = require('gun');

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/image', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(400).json({ error: 'Configura OPENAI_API_KEY sul server per generare immagini.' });
    return;
  }
  const prompt = (req.body?.prompt || '').toString().trim();
  if (!prompt) {
    res.status(400).json({ error: 'Prompt mancante per la generazione.' });
    return;
  }
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024' }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[openai:image] risposta non valida', detail);
      res.status(500).json({ error: 'Generazione immagine non riuscita.', detail });
      return;
    }

    const data = await response.json();
    const url = data?.data?.[0]?.url;
    if (!url) {
      res.status(500).json({ error: 'Nessuna URL di immagine ricevuta dal provider.' });
      return;
    }

    res.json({ url });
  } catch (error) {
    console.error('[openai:image] errore', error);
    res.status(500).json({ error: 'Errore durante la generazione dell’immagine.', detail: error.message });
  }
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
