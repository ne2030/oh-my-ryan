#!/usr/bin/env node
// AUTO-GENERATED from scripts/src/lint-visuals.ts — do not edit directly.
/**
 * Automated SVG linter for rg-visual-explainer (v1.3.0).
 * Checks HTML or JS files containing <svg> blocks for:
 *  1. PROSE_IN_SVG: <text> nodes exceeding 26 characters (prose sentences belong in HTML <p>/<figcaption>)
 *  2. PLACEHOLDER_TOKEN: abstract tokens like "이름 A", "대상 X", "항목 1"
 *  3. MISSING_DESC: <svg> missing <desc> visual storyboard
 *  4. INTERNAL_CASE_ID: opaque test IDs like "q001", "q029" inside SVG <text> (use concrete case names)
 *
 * Usage:
 *   node skills/rg-visual-explainer/scripts/lint-visuals.mjs <file1> [file2 ...] [--max-chars 26] [--block DI-03,DI-15]
 */
import fs from "node:fs";
import path from "node:path";
const args = process.argv.slice(2);
let maxChars = 26;
let blockFilter = null;
const files = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === "--max-chars" && args[i + 1]) {
        maxChars = Number(args[++i]);
    }
    else if (args[i] === "--block" && args[i + 1]) {
        blockFilter = new Set(args[++i]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean));
    }
    else {
        files.push(args[i]);
    }
}
if (files.length === 0) {
    console.error("Usage: node lint-visuals.mjs <file.html|scenes.js> [--max-chars 26] [--block DI-03,DI-15]");
    process.exit(2);
}
const PLACEHOLDER_RE = /(?:이름\s*[A-Z]|대상\s*[A-Z]|항목\s*[1-9]|사례\s*[A-Z]|개체\s*[A-Z])/;
const INTERNAL_CASE_ID_RE = /\bq\d{3}\b/;
const findings = [];
for (const file of files) {
    const abs = path.resolve(file);
    const src = fs.readFileSync(abs, "utf8");
    // Support both raw HTML (<svg>...</svg>) and JS scene registries (/* DI-XX */ blocks)
    const isJs = abs.endsWith(".js");
    if (isJs) {
        const blocks = src.split(/(?=\/\* [A-Z]+-\d+ \*\/)/);
        for (const block of blocks) {
            const idMatch = block.match(/\/\* ([A-Z]+-\d+) \*\//);
            if (!idMatch)
                continue;
            const id = idMatch[1];
            if (blockFilter && !blockFilter.has(id))
                continue;
            if (!/\bd\s*:\s*['"`]/.test(block) && !/<desc\b/.test(block)) {
                findings.push({
                    file: path.basename(abs),
                    block: id,
                    rule: "MISSING_DESC",
                    detail: "Missing <desc> storyboard",
                });
            }
            const textRe = /<text\b[^>]*>([^<]+)<\/text>/g;
            let m;
            while ((m = textRe.exec(block)) !== null) {
                const txt = m[1].replace(/\s+/g, " ").trim();
                if (txt.includes("${"))
                    continue; // template expression
                if (txt.length > maxChars) {
                    findings.push({
                        file: path.basename(abs),
                        block: id,
                        rule: "PROSE_IN_SVG",
                        detail: `[${txt.length}ch > ${maxChars}] "${txt}"`,
                    });
                }
                if (PLACEHOLDER_RE.test(txt)) {
                    findings.push({
                        file: path.basename(abs),
                        block: id,
                        rule: "PLACEHOLDER_TOKEN",
                        detail: `"${txt}"`,
                    });
                }
                if (INTERNAL_CASE_ID_RE.test(txt)) {
                    findings.push({
                        file: path.basename(abs),
                        block: id,
                        rule: "INTERNAL_CASE_ID",
                        detail: `Use concrete case name instead of test ID: "${txt}"`,
                    });
                }
            }
        }
    }
    else {
        const svgRe = /<svg\b[\s\S]*?<\/svg>/g;
        let idx = 0;
        let sm;
        while ((sm = svgRe.exec(src)) !== null) {
            idx++;
            const svg = sm[0];
            const id = `svg#${idx}`;
            if (!/<desc\b/.test(svg)) {
                findings.push({
                    file: path.basename(abs),
                    block: id,
                    rule: "MISSING_DESC",
                    detail: "Missing <desc> storyboard",
                });
            }
            const textRe = /<text\b[^>]*>([^<]+)<\/text>/g;
            let m;
            while ((m = textRe.exec(svg)) !== null) {
                const txt = m[1]
                    .replace(/&[a-z]+;/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
                if (txt.length > maxChars) {
                    findings.push({
                        file: path.basename(abs),
                        block: id,
                        rule: "PROSE_IN_SVG",
                        detail: `[${txt.length}ch > ${maxChars}] "${txt}"`,
                    });
                }
                if (PLACEHOLDER_RE.test(txt)) {
                    findings.push({
                        file: path.basename(abs),
                        block: id,
                        rule: "PLACEHOLDER_TOKEN",
                        detail: `"${txt}"`,
                    });
                }
                if (INTERNAL_CASE_ID_RE.test(txt)) {
                    findings.push({
                        file: path.basename(abs),
                        block: id,
                        rule: "INTERNAL_CASE_ID",
                        detail: `Use concrete case name instead of test ID: "${txt}"`,
                    });
                }
            }
        }
    }
}
if (findings.length === 0) {
    console.log(JSON.stringify({
        status: "ok",
        violations: 0,
        files: files.map((f) => path.basename(f)),
    }, null, 2));
    process.exit(0);
}
else {
    console.log(JSON.stringify({ status: "fail", violations: findings.length, findings }, null, 2));
    process.exit(1);
}
