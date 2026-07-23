# Journal

Personal journaling app — voice recordings, free-form entries, and question prompts. See [PLAN.md](./PLAN.md) for architecture and roadmap.

## Setup

**macOS:**

```sh
# Homebrew -- skip if you already have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install volta && volta setup   # then open a new terminal
brew install --cask docker          # then launch it once from Applications

curl https://raw.githubusercontent.com/zwade/piqued/refs/heads/master/rust/piqued/scripts/install.sh | bash

yarn install
yarn setup
yarn dev                            # server :3000, client :5173 (proxies /api)
```

**Linux:**

```sh
curl https://get.volta.sh | bash    # then open a new terminal

curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"     # then log out/in; RPM distros also need: sudo systemctl enable --now docker

curl https://raw.githubusercontent.com/zwade/piqued/refs/heads/master/rust/piqued/scripts/install.sh | bash

yarn install
yarn setup
yarn dev
```

**Windows:** piqued has no native Windows build (its installer needs `uname`/`arch`,
Unix-only) — use WSL (make Windows understand Linux) and follow the Linux block above inside it. Docker Desktop's
Windows install can still run outside WSL if you want:

```powershell
winget install Volta.Volta
winget install Docker.DockerDesktop   # then launch it once from the Start menu
```

_Asides, for when something doesn't work:_

- **Volta** — pins Node + Yarn from the `volta` field in `package.json`
  (currently node 24.18.0 / yarn 4.17.1), auto-activates on `cd`, nothing to
  run by hand after `volta setup`. No `nvm use`/`corepack enable` needed.
  If `node --version` doesn't match: something else (old Homebrew `node`,
  leftover nvm) is winning your `PATH` — check `which node`.
- **Docker** — `docker info` has to succeed before `yarn setup` will work.
  Installed ≠ running; Docker Desktop (or the Linux daemon) needs to actually
  be started once, and on Linux your user needs to be in the `docker` group
  (see above) or every `docker` command needs `sudo`.
- **piqued** — pinned upstream at **0.7.12**. Writes to `/usr/local/bin`,
  asks for your `sudo` password interactively — can't be scripted, has to be
  run by hand, in a real terminal.
- **`yarn setup`** (`scripts/setup.ts`) — collapses the sequence below into
  one command, with a wait-for-Postgres poll in between (`docker compose up
  -d` returns before Postgres actually accepts connections, so migrating
  right after it can race). Doesn't install Docker or piqued itself — fails
  fast with a pointer back up to this section if either's missing. Manual
  equivalent, if you want to run it step by step:
  ```sh
  yarn db:up
  yarn db:upgrade
  piqued --config piqued.toml
  ```

## Workspaces

| Package              | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `@journal/common`    | Shared zod schemas + types. Depends on nothing internal.             |
| `@journal/db`        | Piqued connection, queries, migrations. See `packages/db/CLAUDE.md`. |
| `@journal/ui-common` | Shared Vue components/composables.                                   |
| `@journal/client`    | Vite + Vue 3 app. Consumes the server's `AppType` for typed RPC.     |
| `@journal/server`    | Hono API on Node. Exports `AppType` from `src/app.ts`.               |

Internal packages export TypeScript source directly (no build step) — Vite and tsx consume `.ts` from workspace deps as-is.

## Scripts

- `yarn dev` — hand-rolled runner (`scripts/dev.ts`) spawns both dev servers, prefixed output, dies together
- `yarn typecheck` — `tsc`/`vue-tsc --noEmit` across all workspaces
- `yarn lint` / `yarn lint:fix` — ESLint across the repo
- `yarn format` / `yarn format:check` — Prettier across the repo
- `yarn build` — type-check + production build of the client
- `yarn db:up` / `yarn db:down` — Postgres container
- `yarn db:new <name>` / `yarn db:upgrade` — create / apply piqued migrations (see `packages/db/CLAUDE.md`)
- `yarn kill` — frees the dev ports (3000, 5173) if a stale process survives an unclean `yarn dev` shutdown ("port already in use" on next run)

## Config

```sh
cp .env.example .env   # defaults already work; edit only if you need to change something
```

_Aside: everything reads through one typed `settings` object
(`packages/common/src/settings.ts`) parsed once at startup — a bad value
fails immediately with a clear error instead of surfacing later._

## Known risk

`vue-tsc` throwing compiler-internal errors in `.vue` files → TS 6 pairing issue:

```sh
yarn add -D -W typescript@^5.9.3   # then re-run: yarn install
```
