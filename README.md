# Implementation Project Dashboard

Production-style project implementation dashboard built with Angular, Angular Material, Chart.js, Express, Prisma, and PostgreSQL.

## Quick Start

1. Install dependencies:

```bash
npm install
npm --prefix apps/api install
npm --prefix apps/web install
```

2. Start PostgreSQL with either native Homebrew Postgres or Docker/Colima.

Native Postgres, fastest for this machine:

```bash
npm run db:native:start
```

Docker/Colima:

```bash
npm run colima:start
npm run db:up
```

3. Prepare the database and import the bundled CSV:

```bash
npm run db:migrate
npm run db:seed
```

4. Run the app:

```bash
npm run dev
```

The API runs at `http://localhost:4000` and the Angular app runs at `http://localhost:4200`.

## Local Database Installed Here

This workspace has been configured with:

- PostgreSQL 16 from Homebrew
- Docker CLI, Docker Compose, and Colima as the Docker-compatible engine
- Database: `implementation_dashboard`
- Role: `dashboard`
- Password: `dashboard`
- API env file: `apps/api/.env`

Docker Desktop could not be installed non-interactively because macOS requested an admin password. Colima is installed and verified as the local Docker engine.

The initial CSV import completed with 64 rows read, 59 projects imported, 5 duplicates skipped, and 0 invalid rows.

## CSV

The provided file has been copied to:

`apps/api/data/projects-filtered-20260713-1412.csv`

The backend also accepts `CSV_SEED_PATH=/mnt/data/projects-filtered-20260713-1412.csv` or any other readable CSV path.

## Full-Stack Web Deployment

This repo is configured to deploy as a real web app, not only as static files:

- Express serves the Angular production build.
- API routes stay available under `/api`.
- Prisma connects to hosted PostgreSQL through `DATABASE_URL`.
- `AUTO_SEED=true` imports the bundled CSV on first boot when the database is empty.
- CSV upload, edits, reset/restore, exports, charts, and filters work through the hosted backend.

### Render Blueprint

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Select this repository.
4. Render will read `render.yaml`, create:
   - a PostgreSQL database
   - a Node web service
5. Deploy.

Render uses:

```bash
npm ci && npm --prefix apps/api ci && npm --prefix apps/web ci && npm run build:deploy
```

and starts the app with:

```bash
npm run start:deploy
```

### Docker Deployment

The included `Dockerfile` can be used on platforms that support Docker plus a managed PostgreSQL database.

Required environment variables:

```bash
DATABASE_URL=postgresql://...
PORT=4000
WEB_ORIGIN=*
AUTO_SEED=true
CSV_SEED_PATH=./apps/api/data/projects-filtered-20260713-1412.csv
```
