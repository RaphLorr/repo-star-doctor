const form = document.querySelector("#repo-form");
const input = document.querySelector("#repo-input");
const statusBox = document.querySelector("#status");
const results = document.querySelector("#results");

const els = {
  score: document.querySelector("#score"),
  grade: document.querySelector("#grade"),
  repoName: document.querySelector("#repo-name"),
  repoDescription: document.querySelector("#repo-description"),
  repoStats: document.querySelector("#repo-stats"),
  leaks: document.querySelector("#leaks"),
  fixes: document.querySelector("#fixes"),
  readmePlan: document.querySelector("#readme-plan"),
  launchPost: document.querySelector("#launch-post"),
  checklist: document.querySelector("#checklist"),
};

const SECTION_TESTS = [
  { key: "demo", label: "demo link or screenshot", re: /(demo|preview|screenshot|video|gif|try it|playground)/i },
  { key: "install", label: "install or quickstart", re: /(install|quickstart|getting started|usage|run locally)/i },
  { key: "why", label: "clear why this exists", re: /(why|motivation|problem|features|use cases?)/i },
  { key: "roadmap", label: "roadmap", re: /(roadmap|planned|todo|next)/i },
  { key: "contribute", label: "contribution path", re: /(contributing|contribute|pull request|issues)/i },
  { key: "license", label: "license", re: /(license|mit|apache|gpl|bsd)/i },
];

document.querySelectorAll("[data-repo]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.repo;
    form.requestSubmit();
  });
});

document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(button.dataset.copy);
    const text = target.matches("ul, ol")
      ? [...target.querySelectorAll("li")].map((li) => `- ${li.textContent}`).join("\n")
      : target.textContent;
    await navigator.clipboard.writeText(text);
    const old = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = old;
    }, 1100);
  });
});

const initialRepo = new URLSearchParams(window.location.search).get("repo");
if (initialRepo) {
  input.value = initialRepo;
  window.setTimeout(() => form.requestSubmit(), 50);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const parsed = parseRepo(input.value);
  if (!parsed) {
    setStatus("Paste a normal GitHub repo URL, like https://github.com/owner/repo.", true);
    return;
  }

  setStatus("Diagnosing repo front door...");
  results.hidden = true;

  try {
    const report = await diagnose(parsed.owner, parsed.repo);
    render(report);
    setStatus("");
  } catch (error) {
    setStatus(error.message || "Diagnosis failed. GitHub may be rate limiting this browser.", true);
  }
});

function parseRepo(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)\/?/) || trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
}

async function diagnose(owner, repo) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const repoRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    throw new Error(messageForGitHubError(repoRes.status));
  }

  const metadata = await repoRes.json();
  const [readme, languages] = await Promise.all([
    fetchReadme(owner, repo, metadata.default_branch),
    fetchJson(`https://api.github.com/repos/${owner}/${repo}/languages`, headers, {}),
  ]);

  const signals = analyze(metadata, readme, languages);
  return { owner, repo, metadata, readme, languages, signals };
}

async function fetchReadme(owner, repo, branch) {
  const apiRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: {
      Accept: "application/vnd.github.raw",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (apiRes.ok) return apiRes.text();

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
  const rawRes = await fetchWithTimeout(rawUrl);
  return rawRes.ok ? rawRes.text() : "";
}

async function fetchJson(url, headers, fallback) {
  const res = await fetchWithTimeout(url, { headers });
  return res.ok ? res.json() : fallback;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("GitHub took too long to respond. Try again in a moment.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function messageForGitHubError(status) {
  if (status === 404) return "Repo not found or private. Public repos work without a token.";
  if (status === 403) return "GitHub unauthenticated rate limit hit. Retry later, or add optional token support in a later version.";
  return `GitHub API returned ${status}. Try again in a moment.`;
}

function analyze(repo, readme, languages) {
  const foundSections = SECTION_TESTS.filter((test) => test.re.test(readme));
  const hasLicense = Boolean(repo.license) || /(license|mit|apache|gpl|bsd)/i.test(readme);
  const missingSections = SECTION_TESTS.filter((test) => (test.key === "license" ? !hasLicense : !test.re.test(readme)));
  const hasHomepage = Boolean(repo.homepage);
  const hasTopics = Array.isArray(repo.topics) && repo.topics.length >= 3;
  const hasDescription = Boolean(repo.description && repo.description.length >= 35);
  const hasRecentPush = daysSince(repo.pushed_at) <= 45;
  const hasIssues = repo.has_issues;
  const hasEnoughReadme = readme.length >= 900;
  const hasVisual = /!\[|<img|\.gif|\.png|\.jpg|youtube|loom|asciinema/i.test(readme);
  const hasCommand = /```|npm |pnpm |yarn |pip |cargo |go install|docker /i.test(readme);
  const hasBadges = /\!\[[^\]]+\]\([^)]+\)/.test(readme) || /shields\.io/i.test(readme);

  const positives = [
    hasDescription,
    hasHomepage,
    hasTopics,
    hasRecentPush,
    hasIssues,
    hasEnoughReadme,
    hasVisual,
    hasCommand,
    hasBadges,
    hasLicense,
    foundSections.length >= 4,
  ];
  const score = Math.max(8, Math.min(98, positives.filter(Boolean).length * 9));

  const leaks = [];
  if (!hasDescription) leaks.push("The repo description is too thin. GitHub search and social cards need a sharp one-line promise.");
  if (!hasHomepage) leaks.push("No homepage/demo URL. People are being asked to imagine the payoff before they star.");
  if (!hasTopics) leaks.push("Too few topics. Discovery on GitHub depends on boring metadata more than we like to admit.");
  if (!hasVisual) leaks.push("The README does not show the thing. Add a screenshot, GIF, terminal recording, or hosted demo.");
  if (!hasCommand) leaks.push("No obvious copy-paste command. Developers star faster when they can run it in under 60 seconds.");
  if (!hasEnoughReadme) leaks.push("README is short enough to feel unfinished. Add problem, demo, install, examples, roadmap, and contribution notes.");
  if (repo.open_issues_count === 0) leaks.push("Zero open issues can look inactive. Seed a few roadmap issues so contributors know where to jump in.");
  if (Object.keys(languages || {}).length > 5) leaks.push("Many languages in one repo. Add an architecture note or diagram so visitors understand the moving parts.");
  missingSections.slice(0, 4).forEach((section) => leaks.push(`Missing ${section.label}. That is a trust gap for first-time visitors.`));
  if (!leaks.length) leaks.push("The basics are strong. The next leak is positioning: make the first screen more specific and more opinionated.");

  const fixes = [
    `Rewrite the first paragraph as: "${makeTagline(repo)}"`,
    hasHomepage ? "Move the demo link into the first 5 lines of the README." : "Ship a tiny live demo or recorded GIF and put it above installation.",
    "Add a 3-step quickstart that a tired developer can finish without reading the whole README.",
    "Add one opinionated example with input, output, and the exact use case it solves.",
    "End with a roadmap that invites small contributions instead of pretending the project is finished.",
  ];

  const checklist = [
    "One-line promise appears in repo description and README headline.",
    "Screenshot/GIF/demo appears before installation.",
    "Quickstart has no more than three commands.",
    "README includes one real-world example, not abstract feature bullets.",
    "Issues are labeled with good-first-issue or help-wanted.",
    "Release notes or changelog exists before public launch.",
    "Pinned launch post asks for feedback before asking for stars.",
  ];

  return {
    score: Math.round(score),
    grade: gradeFor(score),
    leaks,
    fixes,
    checklist,
    readmePlan: buildReadmePlan(repo, languages, missingSections),
    launchPost: buildLaunchPost(repo),
  };
}

function render(report) {
  const { metadata, languages, signals } = report;
  els.score.textContent = signals.score;
  els.grade.textContent = signals.grade;
  els.repoName.textContent = metadata.full_name;
  els.repoDescription.textContent = metadata.description || "No description yet. That is the first fix.";
  els.repoStats.innerHTML = "";

  [
    `${metadata.stargazers_count.toLocaleString()} stars`,
    `${metadata.forks_count.toLocaleString()} forks`,
    `${metadata.open_issues_count.toLocaleString()} open issues`,
    `pushed ${daysSince(metadata.pushed_at)}d ago`,
    `main: ${topLanguage(languages)}`,
  ].forEach((item) => {
    const span = document.createElement("span");
    span.className = "stat";
    span.textContent = item;
    els.repoStats.append(span);
  });

  renderList(els.leaks, signals.leaks);
  renderList(els.fixes, signals.fixes);
  renderList(els.checklist, signals.checklist);
  els.readmePlan.textContent = signals.readmePlan;
  els.launchPost.textContent = signals.launchPost;
  results.hidden = false;
}

function renderList(node, items) {
  node.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    node.append(li);
  });
}

function makeTagline(repo) {
  const name = repo.name.replace(/[-_]/g, " ");
  if (repo.description) return repo.description.replace(/\.$/, "");
  return `${name} helps developers solve one painful workflow with a tiny, inspectable tool`;
}

function buildReadmePlan(repo, languages, missingSections) {
  const language = topLanguage(languages);
  const tagline = makeTagline(repo);
  const missing = missingSections.map((item) => item.label).join(", ") || "positioning polish";
  return `# ${repo.name}

${tagline}.

[Live demo / screenshot goes here]

## Why this exists
Explain the painful before-state in 3-5 lines. Name the user, the workflow, and the old annoying workaround.

## Quickstart
\`\`\`bash
# replace with the fastest possible path
git clone https://github.com/${repo.full_name}.git
cd ${repo.name}
# run the ${language} app
\`\`\`

## Example
Input:
- Show the exact repo, file, prompt, or command.

Output:
- Show the result people came for.

## When to use it
- Best-fit use case 1
- Best-fit use case 2
- Not a good fit for: one honest limitation

## Roadmap
- Small visible improvement
- Integration people can request
- Good first issue for contributors

## Missing right now
${missing}`;
}

function buildLaunchPost(repo) {
  const tagline = makeTagline(repo);
  return `I built ${repo.name}: ${tagline}.

It is for developers who open a repo and need the value to be obvious in 30 seconds.

Try it: https://github.com/${repo.full_name}

I would love brutal feedback on:
1. Is the README clear?
2. Would you run it?
3. What would make it worth a star?`;
}

function gradeFor(score) {
  if (score >= 86) return "Launch-ready";
  if (score >= 70) return "Promising";
  if (score >= 52) return "Needs packaging";
  return "Needs surgery";
}

function daysSince(dateString) {
  return Math.max(0, Math.round((Date.now() - new Date(dateString).getTime()) / 86400000));
}

function topLanguage(languages) {
  const entries = Object.entries(languages || {});
  if (!entries.length) return "unknown";
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

function setStatus(message, isError = false) {
  if (!message) {
    statusBox.hidden = true;
    statusBox.textContent = "";
    return;
  }
  statusBox.hidden = false;
  statusBox.textContent = message;
  statusBox.style.borderColor = isError ? "#f2b8a2" : "";
  statusBox.style.color = isError ? "#9a3412" : "";
}
