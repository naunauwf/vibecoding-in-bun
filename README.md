# Vibecoding in Bun

A modern backend setup powered by **Bun**, **ElysiaJS**, and **Drizzle ORM** with **MySQL**.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: MySQL (via `mysql2`)
- **Language**: TypeScript

---

## Project Structure

```text
├── src/
│   ├── config/
│   │   └── env.ts        # Environment & app configuration
│   ├── db/
│   │   ├── index.ts      # Drizzle client & MySQL pool
│   │   └── schema.ts     # Drizzle table schemas
│   ├── routes/
│   │   └── health.ts     # Health-check route
│   └── index.ts          # Server entry point
├── drizzle/              # Generated SQL migrations
├── drizzle.config.ts     # Drizzle Kit configuration
├── .env.example          # Environment variables template
├── package.json
└── tsconfig.json
```

---

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Copy the example env file and adjust your database connection:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`.

---

## Database Commands

- **Generate Migrations**:

  ```bash
  bun run db:generate
  ```

- **Apply Migrations**:

  ```bash
  bun run db:migrate
  ```

- **Open Drizzle Studio**:

  ```bash
  bun run db:studio
  ```

---

## API Endpoints

- `GET /`: API welcome message and status.
- `GET /health`: Health-check endpoint reporting server uptime and database connectivity.
