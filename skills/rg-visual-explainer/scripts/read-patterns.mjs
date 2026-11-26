#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LIBRARY = path.resolve(SCRIPT_DIR, "../assets/pattern-library.json");

function usage() {
  return [
    "Usage:",
    "  node skills/rg-explain-html/scripts/read-patterns.mjs [--list] [--library /absolute/path/library.json]",
    "  node skills/rg-explain-html/scripts/read-patterns.mjs --ids id[,id...] [--library /absolute/path/library.json]",
    "",
    "--list       print common design rules and pattern metadata without SVG or HTML bodies",
    "--ids        print common design rules and only the selected SVG or HTML patterns",
    "--library    read an absolute JSON library path instead of the packaged snapshot",
    "",
    "Without --ids the CLI prints the metadata list; it never prints every SVG by default."
  ].join("\n");
}

function optionValue(argv, index, name) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} 값이 필요합니다.`);
  return value;
}

export function parseArgs(argv) {
  let mode = "list";
  let ids = null;
  let libraryPath = DEFAULT_LIBRARY;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }
    if (argument === "--list") {
      if (ids) throw new Error("--list와 --ids를 함께 사용할 수 없습니다.");
      mode = "list";
      continue;
    }
    if (argument === "--ids" || argument.startsWith("--ids=")) {
      if (mode === "list" && ids === null && argv.includes("--list")) {
        throw new Error("--list와 --ids를 함께 사용할 수 없습니다.");
      }
      const rawIds = argument.includes("=") ? argument.slice(argument.indexOf("=") + 1) : optionValue(argv, index++, "--ids");
      const parsedIds = rawIds.split(",").map((id) => id.trim()).filter(Boolean);
      if (parsedIds.length === 0) throw new Error("--ids에 하나 이상의 패턴 ID가 필요합니다.");
      ids = [...new Set(parsedIds)];
      mode = "ids";
      continue;
    }
    if (argument === "--library" || argument.startsWith("--library=")) {
      const rawPath = argument.includes("=") ? argument.slice(argument.indexOf("=") + 1) : optionValue(argv, index++, "--library");
      if (!path.isAbsolute(rawPath)) throw new Error("--library는 절대 JSON 경로여야 합니다.");
      libraryPath = rawPath;
      continue;
    }
    throw new Error(`알 수 없는 옵션: ${argument}`);
  }

  return {help, mode, ids, libraryPath};
}

function requiredString(value, field, patternId = "library") {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${patternId}.${field}는 비어 있지 않은 문자열이어야 합니다.`);
  return value;
}

function optionalString(value, field, patternId) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error(`${patternId}.${field}는 문자열·null·미작성 중 하나여야 합니다.`);
  return value;
}

function displayText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "미작성";
}

export function loadLibrary(libraryPath = DEFAULT_LIBRARY) {
  const source = fs.readFileSync(libraryPath, "utf8");
  let library;
  try {
    library = JSON.parse(source);
  } catch (error) {
    throw new Error(`패턴 라이브러리 JSON을 읽을 수 없습니다: ${error.message}`);
  }
  if (!library || typeof library !== "object" || Array.isArray(library)) throw new Error("패턴 라이브러리는 객체여야 합니다.");
  if (!Array.isArray(library.patterns)) throw new Error("패턴 라이브러리에 patterns 배열이 필요합니다.");
  if (!library.design_rules || typeof library.design_rules !== "object") throw new Error("패턴 라이브러리에 design_rules가 필요합니다.");
  requiredString(library.design_rules.name, "name", "design_rules");
  requiredString(library.design_rules.text, "text", "design_rules");

  const ids = new Set();
  for (const pattern of library.patterns) {
    if (!pattern || typeof pattern !== "object" || Array.isArray(pattern)) throw new Error("patterns의 항목은 객체여야 합니다.");
    const id = requiredString(pattern.id, "id");
    if (ids.has(id)) throw new Error(`패턴 ID가 중복됩니다: ${id}`);
    ids.add(id);
    requiredString(pattern.name, "name", id);
    optionalString(pattern.category, "category", id);
    optionalString(pattern.when, "when", id);
    optionalString(pattern.description, "description", id);
    const hasSvg = typeof pattern.svg === "string" && pattern.svg.trim() !== "";
    const hasHtml = typeof pattern.html === "string" && pattern.html.trim() !== "";
    if (hasSvg === hasHtml) throw new Error(`${id}는 svg와 html 가운데 하나만 비어 있지 않은 문자열로 가져야 합니다.`);
  }
  return library;
}

function commonRules(library) {
  return `## 공통 디자인 규칙\n\n${library.design_rules.text.trim()}`;
}

function metadata(pattern) {
  return [
    `### ${pattern.name}`,
    `- id: \`${pattern.id}\``,
    `- 형식: ${pattern.html ? "HTML 컴포넌트" : "SVG"}`,
    `- 사용 시점: ${displayText(pattern.when)}`,
    `- 설명: ${displayText(pattern.description)}`
  ].join("\n");
}

export function renderList(library) {
  const entries = library.patterns.map(metadata);
  return ["# 작은 그림 패턴 참고", commonRules(library), "## 사용 가능한 패턴", entries.join("\n\n")].join("\n\n") + "\n";
}

function codeFence(pattern) {
  const [language, body] = pattern.html ? ["html", pattern.html] : ["svg", pattern.svg];
  const fence = body.includes("~~~") ? "`````" : "~~~";
  return `${fence}${language}\n${body.trim()}\n${fence}`;
}

export function renderSelected(library, ids) {
  const byId = new Map(library.patterns.map((pattern) => [pattern.id, pattern]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) throw new Error(`알 수 없는 패턴 ID: ${missing.join(", ")}`);
  const entries = ids.map((id) => {
    const pattern = byId.get(id);
    return [
      `### ${pattern.name}`,
      `- id: \`${pattern.id}\``,
      ...(pattern.category ? [`- 카테고리: ${displayText(pattern.category)}`] : []),
      `- 사용 시점: ${displayText(pattern.when)}`,
      `- 설명: ${displayText(pattern.description)}`,
      "",
      `- 형식: ${pattern.html ? "HTML 컴포넌트" : "SVG"}`,
      "",
      codeFence(pattern)
    ].join("\n");
  });
  return ["# 작은 그림 패턴 참고", commonRules(library), "## 선택한 패턴", entries.join("\n\n")].join("\n\n") + "\n";
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const library = loadLibrary(args.libraryPath);
  process.stdout.write(args.mode === "ids" ? renderSelected(library, args.ids) : renderList(library));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`read-patterns: ${error.message}\n`);
    process.exitCode = 1;
  }
}
