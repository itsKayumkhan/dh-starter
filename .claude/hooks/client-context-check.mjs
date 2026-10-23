// Keeps docs/project/ (client-context skill) up to date. Node port of the team's Python hook.
//
// SessionStart:     base chat file changed since last ingestion -> tell Claude to run client-context.
// UserPromptSubmit: prompt looks like pasted Fiverr / WhatsApp messages -> tell Claude to run client-context.
// Stop:             project files changed but docs/project/ was not touched -> make Claude update it once.
// Silent in every other case, and silent when the older global Python hook is installed (no double prompts).
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, extname, join, resolve } from "node:path";

const CHAT_EXTS = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".docx",
  ".html",
  ".json",
  ".csv",
]);
const KEYWORDS = [
  "chat",
  "conversation",
  "messages",
  "client",
  "brief",
  "fiverr",
  "inbox",
  "whatsapp",
];
const SKIP_NAMES = new Set([
  "readme.md",
  "claude.md",
  "agents.md",
  "changelog.md",
  "package.json",
  "package-lock.json",
  "composer.json",
  "tsconfig.json",
  "components.json",
  "theme.json",
  "license.md",
]);
const MAX_BYTES = 60 * 1024 * 1024;
const STATE_DIR = join(homedir(), ".claude", "hooks", "state");
const FIVERR_TS = /^\s*\d{1,2} [A-Z][a-z]{2,4},? \d{1,2}:\d{2}\s*$/gm;
const WHATSAPP_TS = /^\s*\[?\d{1,2}\/\d{1,2}\/\d{2,4},? \d{1,2}:\d{2}/gm;

const emit = (event, msg) =>
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: event, additionalContext: msg },
    }),
  );

const sha256 = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

function globalHookInstalled() {
  try {
    return readFileSync(
      join(homedir(), ".claude", "settings.json"),
      "utf8",
    ).includes("client-context-check.py");
  } catch {
    return false;
  }
}

function loadState(root) {
  try {
    return JSON.parse(
      readFileSync(join(root, "docs", "project", ".ingest-state.json"), "utf8"),
    );
  } catch {
    return {};
  }
}

function chatCandidates(root, knownFile) {
  const folder = basename(root).toLowerCase();
  const out = [];
  for (const name of readdirSync(root)) {
    const full = join(root, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    const ext = extname(name).toLowerCase();
    if (
      !st.isFile() ||
      !CHAT_EXTS.has(ext) ||
      SKIP_NAMES.has(name.toLowerCase()) ||
      st.size > MAX_BYTES
    )
      continue;
    const stem = basename(name, extname(name)).toLowerCase();
    if (
      name === knownFile ||
      KEYWORDS.some((k) => stem.includes(k)) ||
      (ext === ".pdf" && (folder.includes(stem) || stem.includes(folder)))
    )
      out.push(full);
  }
  return out;
}

function sessionStart(data) {
  const root = data.cwd || ".";
  const ctx = join(root, "docs", "project");
  const known = loadState(root).base_chat ?? {};
  const files = chatCandidates(root, known.file ?? "");
  if (!files.length) return;
  if (!existsSync(ctx)) {
    emit(
      "SessionStart",
      `client-context: client chat file found (${files.map((f) => basename(f)).join(", ")}) but docs/project/ does not exist. Invoke the client-context skill to build the project context before other work.`,
    );
    return;
  }
  const changed = files
    .filter((f) => sha256(f) !== known.sha256)
    .map((f) => basename(f));
  if (changed.length)
    emit(
      "SessionStart",
      `client-context: base chat changed or new export since last ingestion (${changed.join(", ")}; last ingested message: ${known.last_message ?? "unknown"}). Invoke the client-context skill and ingest only the new messages before other work.`,
    );
}

function promptSubmit(data) {
  const prompt = data.prompt ?? "";
  if (prompt.trimStart().startsWith("/client-context")) return;
  const hits =
    (prompt.match(FIVERR_TS) ?? []).length +
    (prompt.match(WHATSAPP_TS) ?? []).length;
  if (hits >= 2 || (hits === 1 && prompt.length > 200))
    emit(
      "UserPromptSubmit",
      "client-context: this prompt contains pasted client messages (Fiverr/WhatsApp timestamps). Invoke the client-context skill on them and update docs/project/, in addition to answering.",
    );
}

function git(root, ...args) {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      timeout: 10_000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const isWorkPath = (path, chatFile) => {
  const p = path.replace(/^"|"$/g, "").replaceAll("\\", "/");
  return !(
    p.startsWith("docs/") ||
    p.startsWith(".env") ||
    p === ".gitignore" ||
    p === chatFile
  );
};

function stop(data) {
  if (data.stop_hook_active) return;
  const root = data.cwd || ".";
  if (
    !existsSync(join(root, "docs", "project")) ||
    git(root, "rev-parse", "--is-inside-work-tree") !== "true"
  )
    return;
  const chatFile = loadState(root).base_chat?.file ?? "";

  const status =
    git(root, "status", "--porcelain", "--untracked-files=all") ?? "";
  const dirty = status
    .split("\n")
    .map((l) => l.slice(3))
    .filter(Boolean)
    .sort();
  const docsDirty = dirty.some((p) =>
    p.replaceAll("\\", "/").startsWith("docs/project/"),
  );
  const workDirty = dirty.filter((p) => isWorkPath(p, chatFile));

  const lastDocs = git(root, "log", "-1", "--format=%H", "--", "docs/project");
  let committed = [];
  if (lastDocs) {
    const changed = (
      git(root, "diff", "--name-only", `${lastDocs}..HEAD`) ?? ""
    )
      .split("\n")
      .filter(Boolean);
    committed = changed.some((p) => p.startsWith("docs/project/"))
      ? []
      : changed.filter((p) => isWorkPath(p, chatFile));
  }

  const pending = [...new Set([...workDirty, ...committed])].sort();
  if (docsDirty || !pending.length) return;

  // Ask once per distinct set of changes, so a "nothing to record" answer is respected.
  mkdirSync(STATE_DIR, { recursive: true });
  const sig = createHash("sha256")
    .update(pending.join("|") + (git(root, "rev-parse", "HEAD") ?? ""))
    .digest("hex");
  const marker = join(
    STATE_DIR,
    `${createHash("sha256").update(resolve(root)).digest("hex").slice(0, 16)}.stop`,
  );
  if (existsSync(marker) && readFileSync(marker, "utf8") === sig) return;
  writeFileSync(marker, sig, "utf8");

  const shown =
    pending.slice(0, 8).join(", ") + (pending.length > 8 ? " ..." : "");
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason: `client-context: project files changed (${shown}) but docs/project/ was not updated. Without re-reading the chat, update only what this work changed: project-context.md Current Status and Last updated, prepend change-log.md, remove resolved items from pending-items.md, and decisions/requirements only if a client decision changed. Commit with the work. If nothing project-level changed (pure refactor/typo), say so in one line and stop.`,
    }),
  );
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  if (globalHookInstalled()) return;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  try {
    if (data.hook_event_name === "SessionStart") sessionStart(data);
    else if (data.hook_event_name === "UserPromptSubmit") promptSubmit(data);
    else if (data.hook_event_name === "Stop") stop(data);
  } catch {
    // never break a session because of this helper
  }
});
