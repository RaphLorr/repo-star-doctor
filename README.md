# Repo Star Doctor

A no-login GitHub repo audit that turns a quiet repository into a clearer, more star-worthy project page.

Paste a public GitHub repository URL and get:

- Star readiness score
- README and metadata leaks
- Fast fixes
- README rewrite outline
- Launch post copy
- Star bait checklist

## Why this exists

Most useful open-source projects do not lose stars because the code is bad. They lose stars because the first screen is vague, the demo is hidden, or the README asks visitors to do too much work.

Repo Star Doctor is designed as a fast public-facing diagnostic that gives maintainers a concrete punch list in under a minute.

## Run locally

This is a static app. No build step and no token required.

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

If you run it from this folder:

```bash
cd /root/.openclaw/workspace/output/repo-star-doctor
python3 -m http.server 4173
```

## How it works

The app calls GitHub's public REST API from the browser:

- `GET /repos/{owner}/{repo}` for metadata
- `GET /repos/{owner}/{repo}/readme` for README content
- `GET /repos/{owner}/{repo}/languages` for the main language signal

GitHub's docs currently describe unauthenticated REST API limits as rate-limited by originating IP, commonly 60 primary requests per hour. Keep demos polite or add optional token support later.

## Share a prefilled report

Use the `repo` query parameter:

```text
http://localhost:4173/?repo=vercel/next.js
```

## Roadmap

- Optional GitHub token field stored only in browser memory
- Export report as Markdown
- Compare two repos in the same niche
- AI-generated README rewrite when a model key is configured

## Launch positioning

One-line pitch:

```text
Paste your GitHub repo. Get a blunt README and star-growth diagnosis in 30 seconds.
```

Launch post:

```text
I built Repo Star Doctor: a tiny no-login tool that audits a GitHub repo's README, metadata, and launch readiness.

It gives you the leaks, the fast fixes, a README surgery plan, and copy for a launch post.

Try it: <repo/demo link>

I want brutal feedback: would this make your repo easier to star?
```
