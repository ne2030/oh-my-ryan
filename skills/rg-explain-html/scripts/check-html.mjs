#!/usr/bin/env node
/**
 * Deterministic structural & visual hard-gate checker for rg-explain-html outputs.
 * Catches common failure modes (especially CSS-box + text-arrow shortcuts with 0 SVGs,
 * missing <desc> storyboards, unreadable SVG viewBox scales, long SVG prose, missing
 * Korean word-break: keep-all, stripe-card anti-patterns, and missing doc-meta).
 */
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const opts = { file: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (!a.startsWith("-") && !opts.file) opts.file = a;
  }
  return opts;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractBlocks(html, tag) {
  const re = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ attrs: m[1] || "", body: m[2] || "", raw: m[0], index: m.index });
  }
  return out;
}

function getAttr(attrs, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = re.exec(attrs);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}

function parseViewBox(vb) {
  if (!vb) return null;
  const parts = vb.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

export function checkHtml(html) {
  const failures = [];
  const warnings = [];

  const svgs = extractBlocks(html, "svg");
  const h2s = extractBlocks(html, "h2");
  const tables = extractBlocks(html, "table");
  const styles = extractBlocks(html, "style").map((s) => s.body).join("\n");
  const bodyMatch = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const bodyWithoutSvg = bodyHtml.replace(/<svg\b[\s\S]*?<\/svg>/gi, "");

  // Identify content SVGs (exclude tiny icons <= 40px)
  const contentSvgs = svgs.filter((svg) => {
    const vb = parseViewBox(getAttr(svg.attrs, "viewBox"));
    const w = Number(getAttr(svg.attrs, "width"));
    const h = Number(getAttr(svg.attrs, "height"));
    if (vb && vb.width <= 40 && vb.height <= 40) return false;
    if (!vb && w > 0 && w <= 40 && h > 0 && h <= 40) return false;
    return true;
  });

  // 1. Inline SVG presence
  if (contentSvgs.length === 0) {
    failures.push({
      id: "inline-svg-required",
      message: "콘텐츠 인라인 <svg>가 0개입니다. 구조·메커니즘·비교 설명에는 실제 인라인 <svg> 도식이 필수입니다."
    });
  } else if (h2s.length >= 4 && contentSvgs.length < 2) {
    failures.push({
      id: "svg-coverage-too-low",
      message: `<h2> 절이 ${h2s.length}개인데 콘텐츠 <svg>가 ${contentSvgs.length}개뿐입니다. 도입부 1개 쏠림을 피하고 핵심 메커니즘·비교 절에도 SVG를 배치하세요.`
    });
  }

  // 2. CSS-box + plain text arrow shortcut detector
  const textArrowCount = (bodyWithoutSvg.match(/→/g) || []).length;
  const cellArrowPattern = (bodyWithoutSvg.match(/<\/(?:span|div)>\s*→\s*<(?:span|div)\b/gi) || []).length;
  if (contentSvgs.length === 0 && (cellArrowPattern >= 2 || textArrowCount >= 4)) {
    failures.push({
      id: "css-box-arrow-shortcut",
      message: `인라인 <svg> 없이 HTML 박스+텍스트 화살표('→' ${textArrowCount}회, 셀-화살표 패턴 ${cellArrowPattern}회)로 도식을 대체했습니다. 실제 <svg> 구조 도식으로 교체하세요.`
    });
  }

  // 3. Per-SVG checks: <desc>, viewBox scale, geometric primitives, prose length
  const svgStats = [];
  contentSvgs.forEach((svg, idx) => {
    const n = idx + 1;
    const vb = parseViewBox(getAttr(svg.attrs, "viewBox"));
    const descMatch = /<desc\b[^>]*>([\s\S]*?)<\/desc>/i.exec(svg.body);
    const descText = descMatch ? stripTags(descMatch[1]) : "";
    const texts = extractBlocks(svg.body, "text");
    const shapeCount = (svg.body.match(/<(?:rect|circle|ellipse|line|polyline|polygon|path)\b/gi) || []).length;

    svgStats.push({
      index: n,
      viewBox: vb ? `${vb.width}x${vb.height}` : null,
      descLength: descText.length,
      shapeCount,
      textCount: texts.length
    });

    if (!descText || descText.length < 20) {
      failures.push({
        id: "svg-desc-missing",
        message: `SVG #${n}에 시각 콘티 <desc>(20자 이상)가 없습니다. 도형을 그리기 전에 장면·구조를 <desc>로 명시하세요.`
      });
    }

    if (!vb) {
      failures.push({
        id: "svg-viewbox-missing",
        message: `SVG #${n}에 viewBox 속성이 없습니다. 본문 폭(720~960) 기준 viewBox를 지정하세요.`
      });
    } else if (vb.width < 480 || vb.width > 1200) {
      warnings.push({
        id: "svg-viewbox-scale",
        message: `SVG #${n}의 viewBox 폭(${vb.width})이 권장 범위(720~960)를 크게 벗어납니다.`
      });
    }

    if (shapeCount < 4) {
      warnings.push({
        id: "svg-too-few-shapes",
        message: `SVG #${n}의 기하 도형이 ${shapeCount}개뿐입니다. 실제 작동 구조가 드러나도록 보강하세요.`
      });
    }

    const longTexts = texts
      .map((t) => stripTags(t.body))
      .filter((txt) => !/<tspan\b/i.test(txt) && txt.length > 44);
    if (longTexts.length > 0) {
      warnings.push({
        id: "svg-prose-text",
        message: `SVG #${n} 안에 44자를 넘는 긴 <text>가 ${longTexts.length}건 있습니다(예: "${longTexts[0].slice(0, 36)}..."). 서술 문장은 HTML <p>/<figcaption>으로 분리하세요.`
      });
    }
  });

  // 4. Korean word-break: keep-all
  const hasKorean = /[가-힣]/.test(stripTags(bodyHtml));
  if (hasKorean && !/word-break\s*:\s*keep-all/i.test(styles)) {
    failures.push({
      id: "korean-word-break-missing",
      message: "한글 문서인데 CSS에 `word-break: keep-all`이 없습니다. 단어 중간 끊김을 막기 위해 추가하세요."
    });
  }

  // 5. doc-meta script
  const hasDocMeta = /<script\b[^>]*id\s*=\s*["']doc-meta["'][^>]*>/i.test(html);
  if (!hasDocMeta) {
    warnings.push({
      id: "doc-meta-missing",
      message: `<head>에 <script type="application/json" id="doc-meta"> 메타 블록이 없습니다.`
    });
  }

  // 6. Stripe card anti-pattern (border-left: 3px..8px solid)
  if (/border-left\s*:\s*[3-8]px\s+solid/i.test(styles)) {
    warnings.push({
      id: "stripe-card-antipattern",
      message: "CSS에 두꺼운 `border-left: 3~8px solid` 좌측 컬러 띠 카드 스타일이 감지되었습니다."
    });
  }

  // 7. Table dominance warning
  if (tables.length >= 2 && contentSvgs.length <= 1) {
    warnings.push({
      id: "table-heavy-layout",
      message: `<table>이 ${tables.length}개인데 콘텐츠 <svg>가 ${contentSvgs.length}개입니다. 메커니즘·분기 설명을 표로 대체하지 않았는지 확인하세요.`
    });
  }

  return {
    passed: failures.length === 0,
    summary: {
      h2_count: h2s.length,
      content_svg_count: contentSvgs.length,
      table_count: tables.length,
      has_korean: hasKorean,
      has_doc_meta: hasDocMeta
    },
    svgs: svgStats,
    failures,
    warnings
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.file) {
    process.stderr.write("Usage: node check-html.mjs <path-to-html> [--json]\n");
    process.exit(2);
  }
  const abs = path.resolve(opts.file);
  if (!fs.existsSync(abs)) {
    process.stderr.write(`File not found: ${abs}\n`);
    process.exit(2);
  }
  const html = fs.readFileSync(abs, "utf8");
  const result = checkHtml(html);

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    const status = result.passed ? "PASS" : "FAIL";
    process.stdout.write(
      `[${status}] ${path.basename(abs)} — h2: ${result.summary.h2_count}, svg: ${result.summary.content_svg_count}, table: ${result.summary.table_count}\n`
    );
    for (const f of result.failures) {
      process.stdout.write(`  FAIL [${f.id}]: ${f.message}\n`);
    }
    for (const w of result.warnings) {
      process.stdout.write(`  WARN [${w.id}]: ${w.message}\n`);
    }
  }

  process.exit(result.passed ? 0 : 1);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main();
