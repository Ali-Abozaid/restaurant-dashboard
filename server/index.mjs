import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HttpError, parseItemQuery, queryItems } from './item-query.mjs';
import { buildFilterOptions, buildStats } from './item-summary.mjs';
import { createItemStore, parseItemPatch } from './item-store.mjs';

const PORT = 3000;
const ALLOWED_ORIGIN = 'http://localhost:4200';
const dataPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'menu-items.json');

const store = createItemStore(dataPath);
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get('/api/items', (req, res, next) => {
  try {
    const query = parseItemQuery(req.query);
    res.json(queryItems(store.items, query, store.branchRestaurantIds));
  } catch (error) {
    next(error);
  }
});

app.get('/api/items/:id', (req, res) => {
  const item = store.findById(req.params.id);
  if (!item) {
    res.status(404).json({ message: 'Menu item not found' });
    return;
  }
  res.json(item);
});

app.patch('/api/items/:id', (req, res) => {
  const parsed = parseItemPatch(req.body);
  if (parsed.error) {
    res.status(400).json({ message: parsed.error });
    return;
  }

  const updated = store.update(req.params.id, parsed.patch);
  if (!updated) {
    res.status(404).json({ message: 'Menu item not found' });
    return;
  }
  res.json(updated);
});

app.get('/api/stats', (_req, res) => {
  res.json(buildStats(store.items));
});

app.get('/api/filters', (_req, res) => {
  res.json(buildFilterOptions(store.items));
});

app.use((error, _req, res, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  if (statusCode === 500) {
    console.error(error);
  }
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  res.status(statusCode).json({ message });
});

app.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT} (${store.items.length} items)`);
});
