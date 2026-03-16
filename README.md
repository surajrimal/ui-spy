# Trading Journal Dashboard

A React + TypeScript dashboard that reads a fixed Google Sheets tab and turns it into a mobile-friendly trading journal UI.

## What It Does

- Loads data from a constant Google Sheets URL configured in `src/App.tsx`
- Parses the sheet as CSV in the browser
- Displays trade performance metrics such as:
  - Net P/L
  - Total buy
  - Total sell
  - Win/loss count
- Supports filtering and exploration with:
  - Search
  - Month filter
  - Sort by newest, oldest, best P/L, or worst P/L
- Includes:
  - Interactive trend list
  - Trade detail panel
  - Desktop ledger table
  - Mobile card-based ledger

## Current Data Shape

The UI is built around the current sheet structure:

- `Date`
- `Buy`
- `Sell`
- `Net P/L`
- `Month`
- optional note/helper text columns

The parser also handles currency strings like `$510.00` and negative values like `($265.00)`.

## Tech Stack

- React 19
- TypeScript
- Vite
- Plain CSS

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
src/
  App.tsx       Main dashboard logic and Google Sheets parsing
  main.tsx      React entry point
  styles.css    Layout, theme, and responsive styles
```

## Data Source

The dashboard reads from a fixed Google Sheets document URL defined in `src/App.tsx`.

If you want to point the app to a different sheet later, update:

- `defaultSheetUrl` in `src/App.tsx`

The app converts the Google Sheets URL into a CSV export URL internally and fetches it client-side.

## Important Notes

- The Google Sheet tab must be publicly readable or published in a way that allows CSV export.
- This app currently reads data only. It does not write back to Google Sheets.
- The displayed analytics depend on the existing column names and current sheet format.

## UX Notes

- The layout is optimized for both desktop and mobile.
- On smaller screens, the ledger switches from a wide table to stacked cards.
- The selected trade is highlighted consistently across the trend panel and ledger.

## Future Improvements

- Add cumulative equity curve charts
- Add Google authentication for private sheets
- Add editable trades with Google Sheets API write-back
- Add richer date-range filtering

