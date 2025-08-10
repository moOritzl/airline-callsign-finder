# airline-callsign-finder

This PWA is for a friend of mine.

## Environment Variables

The server reads configuration from environment variables using [`dotenv`](https://www.npmjs.com/package/dotenv).
Create a `.env` file or export variables in your shell.

- `PORT`: Port number for the HTTP server (defaults to `3000`).
- `DATA_PATH`: Path to the `airlines.json` data file (defaults to the copy in this repository).

## Logging

HTTP requests are logged using [`morgan`](https://www.npmjs.com/package/morgan).
In production (`NODE_ENV=production`) logs are written to stdout using the `combined` format;
in other environments the `dev` format is used.
