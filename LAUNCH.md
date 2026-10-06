# Repo Star Doctor Launch Plan

Goal: make a small tool that developers can try immediately, share without explanation, and star because it fixes a familiar open-source pain.

## Today scope

Ship only the loop that matters:

1. Paste GitHub repo URL.
2. Fetch public repo metadata and README.
3. Show score, leaks, fixes, README plan, launch post, checklist.
4. Let users copy every useful output block.
5. Support `?repo=owner/name` so posts can link directly to a report.

No accounts, no server, no database, no AI key requirement in v1.

## Repo name candidates

Recommended:

- `repo-star-doctor`

Alternatives:

- `readme-doctor`
- `star-readiness`
- `repo-roast`

`repo-star-doctor` is the safest launch name because it explains the value without needing the joke.

## GitHub repo setup

Description:

```text
Paste your GitHub repo. Get a blunt README and star-growth diagnosis in 30 seconds.
```

Topics:

```text
github readme open-source developer-tools growth audit repo-analyzer stars
```

About links:

- Homepage: deployed demo URL
- README screenshot: add after first deployment

Pinned issue:

```text
Drop your repo URL here and I will run it through Repo Star Doctor.
```

## First wave posts

### X / Twitter

```text
I built Repo Star Doctor.

Paste any GitHub repo and it gives you:
- star-readiness score
- README leaks
- fast fixes
- README surgery plan
- launch post copy

No login. No backend. Just a tiny browser tool for open-source maintainers.

Demo: <demo>
GitHub: <repo>
```

### Hacker News

```text
Show HN: Repo Star Doctor - no-login README and star-readiness audit for GitHub repos

I built a small static web app that audits a public GitHub repo's README and metadata.

It gives a score, points out missing trust signals, and generates a README improvement outline plus launch copy.

It is deliberately simple: no account, no backend, no token for v1. It uses GitHub's public REST API from the browser.

I made it because a lot of useful open-source projects lose potential users before anyone reaches the code.
```

### V2EX

```text
做了一个小工具：输入 GitHub repo，自动检查 README 和开源项目包装哪里影响 star

功能很小：
- 看 repo 描述、topics、README、demo/截图/quickstart 等信号
- 给 star readiness 分数
- 输出 README 修改建议和 launch post

无登录、无后端、纯静态页面。

欢迎拿自己的 repo 测一下，喷也行，我就是想把它打磨成一个对开源项目有用的小工具。

Demo: <demo>
GitHub: <repo>
```

### Reddit

```text
I made a tiny no-login tool that audits your GitHub repo's README and tells you why people may not star it.

It checks basic trust signals like demo links, screenshots, quickstart, topics, roadmap, contribution path, and repo metadata.

The output is intentionally blunt: leaks, fast fixes, a README surgery plan, and launch copy.

Would love feedback from maintainers.
```

## R2D2 task pack

Hand this to R2D2 if another agent is available:

```text
Please take /root/.openclaw/workspace/output/repo-star-doctor and do a quick engineering pass:
1. Try the app locally with 3 repos: vercel/next.js, oven-sh/bun, and a small low-star repo.
2. Check console/network errors if you have browser access.
3. Suggest one low-risk improvement that makes the output more shareable today.
4. Do not add dependencies unless there is a clear launch-critical reason.
```

## Next build after launch

- Add Markdown export.
- Add side-by-side before/after README preview.
- Add optional OpenAI-compatible API key for full README rewrite.
- Add "roast mode" for more viral output.
