const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { initializeCanvas, readPsd } = require('ag-psd');

const psdPath = process.argv[2] || 'Website Merah.psd';
const outDir = process.argv[3] || 'assets';

initializeCanvas(
  () => {
    throw new Error('Canvas output is not supported by this extractor');
  },
  (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) })
);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(value, fallback) {
  const text = String(value || fallback || 'layer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return text || fallback || 'layer';
}

function writePng(filePath, imageData) {
  if (!imageData || !imageData.data || !imageData.width || !imageData.height) return false;

  const png = new PNG({ width: imageData.width, height: imageData.height });
  const src = imageData.data;
  if (src.length === png.data.length) {
    png.data.set(src);
  } else {
    throw new Error(`Unexpected pixel data length for ${filePath}: ${src.length}`);
  }

  fs.writeFileSync(filePath, PNG.sync.write(png));
  return true;
}

function walkLayers(children, parentNames = [], rows = []) {
  if (!children) return rows;
  children.forEach((layer, index) => {
    const name = layer.name || `Layer ${index + 1}`;
    const group = parentNames.concat(name);
    const layerInfo = {
      name,
      path: group.join(' / '),
      left: layer.left || 0,
      top: layer.top || 0,
      right: layer.right || 0,
      bottom: layer.bottom || 0,
      width: Math.max(0, (layer.right || 0) - (layer.left || 0)),
      height: Math.max(0, (layer.bottom || 0) - (layer.top || 0)),
      visible: layer.hidden !== true,
      opacity: layer.opacity == null ? 255 : layer.opacity,
      blendMode: layer.blendMode || 'normal',
      hasImage: Boolean(layer.imageData),
      text: layer.text && layer.text.text ? layer.text.text : undefined,
      asset: undefined,
    };
    rows.push(layerInfo);
    walkLayers(layer.children, group, rows);
  });
  return rows;
}

ensureDir(outDir);
const buffer = fs.readFileSync(psdPath);
const psd = readPsd(buffer, {
  useImageData: true,
  skipThumbnail: true,
  skipLinkedFilesData: true,
  logMissingFeatures: true,
});

const meta = {
  width: psd.width,
  height: psd.height,
  children: psd.children ? psd.children.length : 0,
};

writePng(path.join(outDir, 'website-merah-composite.png'), psd.imageData);

const layersDir = path.join(outDir, 'layers');
ensureDir(layersDir);
const layers = walkLayers(psd.children);
const usedAssetNames = new Map();

function attachLayerAssets(children, parentNames = []) {
  if (!children) return;
  children.forEach((layer, index) => {
    const name = layer.name || `Layer ${index + 1}`;
    const group = parentNames.concat(name);
    if (layer.imageData && layer.hidden !== true) {
      const base = slug(group.join(' / '), 'layer');
      const count = (usedAssetNames.get(base) || 0) + 1;
      usedAssetNames.set(base, count);
      const file = `${base}${count > 1 ? `-${count}` : ''}.png`;
      const relative = path.join('layers', file).replace(/\\/g, '/');
      writePng(path.join(layersDir, file), layer.imageData);
      const row = layers.find((item) => item.path === group.join(' / ') && !item.asset);
      if (row) row.asset = relative;
    }
    attachLayerAssets(layer.children, group);
  });
}

attachLayerAssets(psd.children);

fs.writeFileSync(path.join(outDir, 'psd-meta.json'), JSON.stringify({ meta, layers }, null, 2));
console.log(`Extracted ${psd.width}x${psd.height} PSD`);
console.log(`Wrote composite and ${layers.filter((layer) => layer.asset).length} layer assets to ${outDir}`);
