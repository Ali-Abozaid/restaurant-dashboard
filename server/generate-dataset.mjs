import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ITEM_COUNT = 50_000;
const SEED = 20261025;
const ANCHOR_ISO = '2026-10-25T00:00:00.000Z';
const WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
const MIN_CENTS = 250;
const MAX_CENTS = 4500;

const restaurants = [
  {
    id: 'rest-01',
    name: 'Nile Grill',
    branches: [
      { id: 'rest-01-branch-01', name: 'Downtown' },
      { id: 'rest-01-branch-02', name: 'Zamalek' },
      { id: 'rest-01-branch-03', name: 'Maadi' },
    ],
  },
  {
    id: 'rest-02',
    name: 'Cairo Kitchen',
    branches: [
      { id: 'rest-02-branch-01', name: 'Heliopolis' },
      { id: 'rest-02-branch-02', name: 'Nasr City' },
      { id: 'rest-02-branch-03', name: 'New Cairo' },
    ],
  },
  {
    id: 'rest-03',
    name: 'Marina House',
    branches: [
      { id: 'rest-03-branch-01', name: 'Alexandria' },
      { id: 'rest-03-branch-02', name: 'Stanley' },
      { id: 'rest-03-branch-03', name: 'Montaza' },
    ],
  },
  {
    id: 'rest-04',
    name: 'Oasis Bites',
    branches: [
      { id: 'rest-04-branch-01', name: 'Giza' },
      { id: 'rest-04-branch-02', name: 'Dokki' },
      { id: 'rest-04-branch-03', name: 'Mohandessin' },
    ],
  },
  {
    id: 'rest-05',
    name: 'Red Sea Diner',
    branches: [
      { id: 'rest-05-branch-01', name: 'Hurghada' },
      { id: 'rest-05-branch-02', name: 'El Gouna' },
      { id: 'rest-05-branch-03', name: 'Sahl Hasheesh' },
    ],
  },
  {
    id: 'rest-06',
    name: 'Lotus Table',
    branches: [
      { id: 'rest-06-branch-01', name: 'Luxor' },
      { id: 'rest-06-branch-02', name: 'Aswan' },
      { id: 'rest-06-branch-03', name: 'Karnak' },
    ],
  },
  {
    id: 'rest-07',
    name: 'Spice Route',
    branches: [
      { id: 'rest-07-branch-01', name: '6th of October' },
      { id: 'rest-07-branch-02', name: 'Sheikh Zayed' },
      { id: 'rest-07-branch-03', name: 'Smart Village' },
    ],
  },
  {
    id: 'rest-08',
    name: 'Palm Yard',
    branches: [
      { id: 'rest-08-branch-01', name: 'Sharm El Sheikh' },
      { id: 'rest-08-branch-02', name: 'Naama Bay' },
      { id: 'rest-08-branch-03', name: 'Dahab' },
    ],
  },
];

const categories = [
  'Burgers',
  'Pizza',
  'Salads',
  'Drinks',
  'Desserts',
  'Pasta',
  'Sandwiches',
  'Seafood',
  'Breakfast',
  'Sides',
];

const adjectives = [
  'Chicken',
  'Spicy',
  'Grilled',
  'Classic',
  'Cheese',
  'Smoky',
  'Crispy',
  'Golden',
  'Herb',
  'Sweet',
];

const outputPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'menu-items.json');

function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

export function generateMenuItems(count = ITEM_COUNT, seed = SEED) {
  const random = mulberry32(seed);
  const anchorMs = Date.parse(ANCHOR_ISO);
  const items = [];

  for (let index = 1; index <= count; index += 1) {
    const restaurant = pick(random, restaurants);
    const branch = pick(random, restaurant.branches);
    const category = pick(random, categories);
    const adjective = pick(random, adjectives);
    const cents = MIN_CENTS + Math.floor(random() * (MAX_CENTS - MIN_CENTS + 1));
    const offsetMs = Math.floor(random() * WINDOW_MS);

    items.push({
      id: `item-${String(index).padStart(6, '0')}`,
      name: `${adjective} ${category} ${index}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      branchId: branch.id,
      branchName: branch.name,
      category,
      price: cents / 100,
      availability: random() < 0.8 ? 'available' : 'unavailable',
      lastUpdated: new Date(anchorMs - offsetMs).toISOString(),
    });
  }

  return items;
}

const isDirectRun = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const items = generateMenuItems();
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(items));
  console.log(`Wrote ${items.length} items to ${outputPath}`);
}
