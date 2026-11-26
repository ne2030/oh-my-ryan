// 렌더된 문서의 그림(figure)마다 실제 화면 기준 글자 크기, 줄 간격, 대비, 넘침, 안쪽 여백을 측정한다.
// 사용: gstack browse로 문서를 연 뒤 `browse eval <이 파일>`. 결과는 JSON 문자열이다.
// 측정값은 판정 신호다. 합격선으로 쓰지 않고 스크린샷 검토와 함께 읽는다.
(() => {
  const parseRgb = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const [r, g, b] = match[1].split(",").map((part) => parseFloat(part));
    return [r, g, b];
  };
  const luminance = ([r, g, b]) => {
    const channel = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const contrast = (fg, bg = [255, 255, 255]) => {
    const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  };
  const round = (n) => Math.round(n * 10) / 10;

  const measureSvg = (svg) => {
    const box = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const scale = viewBox && viewBox.width ? box.width / viewBox.width : 1;
    const texts = [...svg.querySelectorAll("text")].filter((t) => t.textContent.trim());
    const items = texts.map((t) => {
      const style = getComputedStyle(t);
      const fill = parseRgb(style.fill) || [0, 0, 0];
      return {
        text: t.textContent.trim().slice(0, 40),
        px: round(parseFloat(style.fontSize) * scale),
        contrast: round(contrast(fill)),
        y: t.getBBox().y,
        x: t.getBBox().x,
        width: t.getBBox().width
      };
    });
    // 같은 x에서 연속한 줄의 간격을 줄 간격으로 본다.
    const gaps = [];
    const byX = new Map();
    for (const item of items) {
      const key = Math.round(item.x);
      if (!byX.has(key)) byX.set(key, []);
      byX.get(key).push(item);
    }
    for (const column of byX.values()) {
      column.sort((a, b) => a.y - b.y);
      for (let i = 1; i < column.length; i += 1) {
        const gap = (column[i].y - column[i - 1].y) * scale;
        if (gap > 0 && gap < 40) gaps.push(round(gap / column[i].px));
      }
    }
    // 글자가 자신을 감싸는 가장 작은 사각형의 오른쪽 경계를 넘거나 안쪽 여백이 좁은지 본다.
    const rects = [...svg.querySelectorAll("rect")].map((r) => r.getBBox());
    let overflow = 0;
    const paddings = [];
    for (const t of texts) {
      const b = t.getBBox();
      const holders = rects.filter((r) => b.x >= r.x && b.y >= r.y - 2 && b.x < r.x + r.width && b.y < r.y + r.height && r.width < box.width / scale - 1);
      if (!holders.length) continue;
      const holder = holders.sort((a, c) => a.width * a.height - c.width * c.height)[0];
      if (b.x + b.width > holder.x + holder.width) overflow += 1;
      paddings.push(round((b.x - holder.x) * scale));
    }
    return {kind: "svg", renderedWidth: round(box.width), scale: round(scale), items, gaps, overflow, paddings};
  };

  const measureHtml = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const items = [];
    let overflow = 0;
    const seen = new Set();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim()) continue;
      const el = node.parentElement;
      if (seen.has(el) || el.closest("figcaption")) continue;
      seen.add(el);
      const style = getComputedStyle(el);
      const px = parseFloat(style.fontSize);
      const lh = style.lineHeight === "normal" ? 1.2 : parseFloat(style.lineHeight) / px;
      items.push({text: el.textContent.trim().slice(0, 40), px: round(px), lineHeight: round(lh), contrast: round(contrast(parseRgb(style.color) || [0, 0, 0]))});
      if (el.scrollWidth > el.clientWidth + 1 && style.overflow !== "visible") overflow += 1;
    }
    const cells = [...root.querySelectorAll("[data-measure='cell']")].map((cell) => {
      const style = getComputedStyle(cell);
      return round(parseFloat(style.paddingLeft));
    });
    return {kind: "html", renderedWidth: round(root.getBoundingClientRect().width), items, gaps: items.map((i) => i.lineHeight), overflow, paddings: cells};
  };

  const summarize = (label, m) => {
    const sizes = m.items.map((i) => i.px);
    const contrasts = m.items.map((i) => i.contrast);
    const minOf = (xs) => (xs.length ? Math.min(...xs) : null);
    return {
      figure: label,
      kind: m.kind,
      renderedWidth: m.renderedWidth,
      textCount: m.items.length,
      minPx: minOf(sizes),
      under13px: sizes.filter((s) => s < 13).length,
      under14px: sizes.filter((s) => s < 14).length,
      minLineHeightRatio: minOf(m.gaps),
      minContrast: minOf(contrasts),
      overflow: m.overflow,
      minPaddingPx: minOf(m.paddings),
      smallest: m.items.sort((a, b) => a.px - b.px).slice(0, 3).map((i) => `${i.px}px ${i.text}`)
    };
  };

  const figures = [...document.querySelectorAll("figure")];
  return JSON.stringify(
    figures.map((figure, index) => {
      const label = figure.getAttribute("aria-label") || `figure ${index + 1}`;
      const svg = figure.querySelector(":scope > svg");
      return summarize(label, svg ? measureSvg(svg) : measureHtml(figure));
    }),
    null,
    1
  );
})();
