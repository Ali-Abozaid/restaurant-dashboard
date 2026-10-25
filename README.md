# Restaurant Data Management Dashboard

A menu dashboard for 50,000 items. The browser never downloads the full dataset. Each table page, filter, and sort runs on the mock API, and the dashboard numbers come from a separate stats request.

## Setup

### Prerequisites

- Node.js and npm
- Two terminal windows

### 1. Install dependencies and generate the dataset

Run these commands from the project root, one at a time:

```bash
npm install
```

```bash
npm run generate:data
```

The generator creates 50,000 deterministic menu items in `server/data/menu-items.json`. This file is generated locally and is not committed to Git.

### 2. Start the mock API

In the first terminal:

```bash
npm run start:api
```

The API listens at `http://localhost:3000`. If the dataset is missing, generate it before starting the API.

### 3. Start Angular

In the second terminal:

```bash
npm start
```

Open `http://localhost:4200/` in your browser.

Angular proxies `/api` requests to the mock API, so the frontend uses relative API URLs.

## Architecture

The app is standalone Angular with signals and RxJS. There is no NgRx and no `zone.js`.

| Piece | Responsibility |
| --- | --- |
| `server/` | Holds the 50,000 items in memory. Filters, sorts, pages, and aggregates there. |
| `MenuApiService` and `StatsApiService` | HTTP only. They map failures to `ApiError` and do not keep state. |
| `MenuStore` | Menu UI state and the current page. Created by the `/menu` route. |
| `DashboardStore` | KPI state for the whole app. `load()` calls `GET /api/stats`. |

The menu screen does not call `HttpClient`. Filters write into `MenuStore`. The store turns `query` into an observable, waits 300ms, skips an unchanged query, and uses `switchMap` so an older response cannot overwrite a newer one. `items` and `total` are `computed` from the page the server returned.

`/api/filters` runs once when the menu store is created. Typing in search does not reload the restaurant, branch, or category lists. The branch list is `computed` from the selected restaurant, and a branch that does not belong to that restaurant is cleared.

Saving an item sends `PATCH /api/items/:id`. The store replaces that row if it is on the current page, then calls `dashboardStore.load()`. The dashboard cards and the category chart read `stats` only. They are not calculated from the 25 visible rows.

The edit dialog validates price (`required`, `min(0)`) and availability (`required`). Save stays disabled while the form is invalid or a save is in flight, so a negative price never reaches the API.

## Performance choices

- The first page is 25 rows. `pageSize` cannot exceed 100, in the store and in the API.
- There is no request for `/api/items` without `page` and `pageSize`.
- Pages, filters, the table, the dialog, the chart, and the dashboard use `OnPush`.
- The table tracks `item.id`.
- Category counts and the other KPIs are aggregated in the API process.

## What to Try

- Search for menu items by name.
- Filter by restaurant, branch, category, and price range.
- Change sorting and navigate between pages.
- Edit an item's price or availability and verify that the dashboard statistics refresh.
- Switch between Arabic and English, and between light and dark themes.
- Run `npm test` to verify the main data-loading and update behaviors.

## Tests

```bash
npm test
```

Vitest covers three behaviors with `HttpClient` mocked:

- Search, category, and a price range on page 2 are all present on the request. A 30-row fixture checks that the server filters first, then slices, and that `total` is the filtered count.
- A successful PATCH updates the row and asks the dashboard store to reload. A price of `-1` does not send a request.
- When two item requests overlap, the store keeps the newer page. A failed request sets `status` to `error` and leaves the previous page in place.

## Limitations

- The API is one Node process with the JSON file in memory. It is not a production database, and a second API process would not share unsaved edits.
- The whole menu query waits 300ms, including page and sort changes. That keeps one code path and still feels immediate.
- The chart is CSS bars, one per category, scaled to the largest count.
- An edit can change price and availability only.
- The average price is rounded to 4 decimals. Two decimals would hide a single price edit across 50,000 rows.
- There is no authentication. The mock API accepts any PATCH.
