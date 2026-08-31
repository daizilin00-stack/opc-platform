const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const AGENT_ID = process.env.AGENT_ID || 'unknown';
const MODEL_API_KEY = process.env.MODEL_API_KEY || '';
const MODEL_BASE_URL = process.env.MODEL_BASE_URL || 'http://host.docker.internal:3003';
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || '';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', agent_id: AGENT_ID });
});

app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: [{
      id: process.env.MODEL || 'gpt-5.4-mini',
      object: 'model',
      created: Date.now(),
      owned_by: 'opc'
    }]
  });
});

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { model, messages, temperature, max_tokens, stream } = req.body;

    const upstreamMessages = [];
    if (SYSTEM_PROMPT) {
      upstreamMessages.push({ role: 'system', content: SYSTEM_PROMPT });
    }
    if (Array.isArray(messages)) {
      upstreamMessages.push(...messages);
    }

    const body = {
      model: model || process.env.MODEL || 'gpt-5.4-mini',
      messages: upstreamMessages,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 2048,
      stream: !!stream
    };

    const url = `${MODEL_BASE_URL}/api/v1/deploy/chat`;

    if (stream) {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MODEL_API_KEY}`
        },
        body: JSON.stringify(body)
      });

      if (!upstream.ok) {
        const text = await upstream.text();
        return res.status(upstream.status).json({ error: text });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } else {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MODEL_API_KEY}`
        },
        body: JSON.stringify(body)
      });

      const data = await upstream.json();
      res.status(upstream.status).json(data);
    }
  } catch (error) {
    console.error('[Agent Runtime] Error:', error);
    res.status(500).json({
      error: { message: error.message, type: 'agent_runtime_error' }
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Agent Runtime] Agent ${AGENT_ID} listening on port ${PORT}`);
});
