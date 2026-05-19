const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join('assets', 'psd-meta.json'), 'utf8'));
const { width, height } = data.meta;
const layers = data.layers.filter((layer) => layer.visible && layer.asset);

function pct(value, total) {
  return `${((value / total) * 100).toFixed(6)}%`;
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const layerMarkup = layers
  .map((layer, index) => {
    const style = [
      `--x:${pct(layer.left, width)}`,
      `--y:${pct(layer.top, height)}`,
      `--w:${pct(layer.width, width)}`,
      `--h:${pct(layer.height, height)}`,
      `--z:${index + 1}`,
      layer.opacity < 1 ? `--o:${layer.opacity}` : '',
    ]
      .filter(Boolean)
      .join(';');
    const alt = layer.text || layer.name;
    return `      <img class="psd-layer" src="assets/${esc(layer.asset)}" alt="${esc(alt)}" style="${style}">`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rose Brand</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="page-shell" aria-label="Rose Brand website mockup">
    <section class="psd-artboard" style="--design-width:${width};--design-height:${height};">
${layerMarkup}
    </section>
  </main>
</body>
</html>
`;

const css = `* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
}

body {
  background: #fffaf3;
  color: #26312d;
  font-family: Arial, Helvetica, sans-serif;
}

.page-shell {
  width: 100%;
  overflow-x: hidden;
}

.psd-artboard {
  position: relative;
  width: min(100vw, calc(var(--design-width) * 1px));
  aspect-ratio: var(--design-width) / var(--design-height);
  margin: 0 auto;
  background: #fffaf3;
  overflow: hidden;
}

.psd-layer {
  position: absolute;
  left: var(--x);
  top: var(--y);
  z-index: var(--z);
  width: var(--w);
  height: var(--h);
  object-fit: fill;
  opacity: var(--o, 1);
  display: block;
  pointer-events: none;
  user-select: none;
}
`;

fs.writeFileSync('index.html', html);
fs.writeFileSync('styles.css', css);
console.log(`Generated index.html with ${layers.length} sliced layers`);
