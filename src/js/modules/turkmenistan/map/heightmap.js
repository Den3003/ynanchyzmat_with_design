import * as THREE from 'three';

/**
 * Реальный рельеф Туркменистана.
 *
 * Данные — SRTM30_PLUS (30 угловых секунд, ~900 м на пиксель), упакованные
 * в PNG: старшие 8 бит высоты в канале R, младшие 4 — в старших битах G.
 * Итого 12 бит на точку, шаг 0.78 м. Такая упаковка жмётся вдвое лучше
 * честных 16 бит, а точности хватает с запасом.
 *
 * Модуль отдаёт три вещи:
 *   sample        — высота в метрах в любой точке (билинейно, полное разрешение);
 *   sampleCoarse  — то же по загрубённой сетке: ею смещаются вершины меша,
 *                   иначе треугольник в 12 км ловил бы случайные пики;
 *   createNormalTexture — карта нормалей из ВЫСОКИХ частот рельефа. Мелкие
 *                   гряды и промоины геометрией не вытянуть, зато они прекрасно
 *                   читаются через освещение.
 */
export async function loadHeightmap({ url, bbox, maxMeters, coarseStep, detailRadius, normalStrength, exaggeration }) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`heightmap ${response.status}`);

  const bitmap = await createImageBitmap(await response.blob());
  const { width, height } = bitmap;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0);
  const { data } = context.getImageData(0, 0, width, height);
  bitmap.close?.();

  const meters = new Float32Array(width * height);
  const scale = maxMeters / 4095;
  for (let i = 0; i < meters.length; i += 1) {
    meters[i] = (((data[i * 4] << 4) | (data[i * 4 + 1] >> 4)) * scale);
  }

  const [lonMin, latMin, lonMax, latMax] = bbox;
  const lonSpan = lonMax - lonMin;
  const latSpan = latMax - latMin;

  const bilinear = (grid, gw, gh, u, v) => {
    const x = Math.min(Math.max(u * gw - 0.5, 0), gw - 1.001);
    const y = Math.min(Math.max(v * gh - 0.5, 0), gh - 1.001);
    const x0 = x | 0;
    const y0 = y | 0;
    const fx = x - x0;
    const fy = y - y0;
    const row0 = y0 * gw;
    const row1 = row0 + gw;
    const a = grid[row0 + x0];
    const b = grid[row0 + x0 + 1];
    const c = grid[row1 + x0];
    const d = grid[row1 + x0 + 1];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };

  /** Загрублённая сетка: усреднение блоками coarseStep × coarseStep. */
  const cw = Math.max(2, Math.ceil(width / coarseStep));
  const ch = Math.max(2, Math.ceil(height / coarseStep));
  const coarse = new Float32Array(cw * ch);
  for (let cy = 0; cy < ch; cy += 1) {
    for (let cx = 0; cx < cw; cx += 1) {
      let sum = 0;
      let count = 0;
      for (let y = cy * coarseStep; y < Math.min((cy + 1) * coarseStep, height); y += 1) {
        for (let x = cx * coarseStep; x < Math.min((cx + 1) * coarseStep, width); x += 1) {
          sum += meters[y * width + x];
          count += 1;
        }
      }
      coarse[cy * cw + cx] = count ? sum / count : 0;
    }
  }

  const toUV = (lon, lat) => [(lon - lonMin) / lonSpan, (latMax - lat) / latSpan];

  return {
    width,
    height,
    bbox,

    /** Высота в метрах, полное разрешение. */
    sample(lon, lat) {
      const [u, v] = toUV(lon, lat);
      return bilinear(meters, width, height, u, v);
    },

    /** Высота в метрах по загрублённой сетке — для геометрии. */
    sampleCoarse(lon, lat) {
      const [u, v] = toUV(lon, lat);
      return bilinear(coarse, cw, ch, u, v);
    },

    /**
     * Карта нормалей мелкого рельефа. Из высот вычитается их же размытая копия
     * радиусом с треугольник меша: остаётся ровно то, чего в геометрии нет.
     */
    createNormalTexture() {
      const detail = highPass(meters, width, height, detailRadius);

      // Размер пикселя в метрах: по долготе с поправкой на широту.
      const midLat = ((latMin + latMax) / 2) * (Math.PI / 180);
      const mx = (lonSpan / width) * 111320 * Math.cos(midLat);
      const my = (latSpan / height) * 110570;
      const gain = exaggeration * normalStrength;

      const pixels = new Uint8Array(width * height * 4);

      for (let y = 0; y < height; y += 1) {
        const up = Math.max(y - 1, 0) * width;
        const down = Math.min(y + 1, height - 1) * width;
        const row = y * width;

        for (let x = 0; x < width; x += 1) {
          const left = Math.max(x - 1, 0);
          const right = Math.min(x + 1, width - 1);

          const dEast = ((detail[row + right] - detail[row + left]) / (2 * mx)) * gain;
          // Строки идут с севера на юг, поэтому знак производной меняем.
          const dNorth = (-(detail[down + x] - detail[up + x]) / (2 * my)) * gain;

          const inverse = 1 / Math.sqrt(dEast * dEast + dNorth * dNorth + 1);
          // Пишем снизу вверх: тогда не нужен flipY, который для DataTexture
          // ведёт себя по-разному в разных браузерах.
          const i = ((height - 1 - y) * width + x) * 4;
          pixels[i] = (-dEast * inverse * 0.5 + 0.5) * 255;
          pixels[i + 1] = (-dNorth * inverse * 0.5 + 0.5) * 255;
          pixels[i + 2] = (inverse * 0.5 + 0.5) * 255;
          pixels[i + 3] = 255;
        }
      }

      const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = 4;
      texture.flipY = false;
      texture.needsUpdate = true;
      return texture;
    },
  };
}

/** Высокие частоты = исходник минус блочное размытие (два прохода, разделимое). */
function highPass(source, width, height, radius) {
  const blurred = boxBlur(source, width, height, radius);
  const result = new Float32Array(source.length);
  for (let i = 0; i < source.length; i += 1) result[i] = source[i] - blurred[i];
  return result;
}

function boxBlur(source, width, height, radius) {
  const temp = new Float32Array(source.length);
  const output = new Float32Array(source.length);
  const window = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    let sum = 0;
    for (let x = -radius; x <= radius; x += 1) sum += source[row + Math.min(Math.max(x, 0), width - 1)];
    for (let x = 0; x < width; x += 1) {
      temp[row + x] = sum / window;
      const out = Math.min(Math.max(x - radius, 0), width - 1);
      const add = Math.min(Math.max(x + radius + 1, 0), width - 1);
      sum += source[row + add] - source[row + out];
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let y = -radius; y <= radius; y += 1) sum += temp[Math.min(Math.max(y, 0), height - 1) * width + x];
    for (let y = 0; y < height; y += 1) {
      output[y * width + x] = sum / window;
      const out = Math.min(Math.max(y - radius, 0), height - 1) * width + x;
      const add = Math.min(Math.max(y + radius + 1, 0), height - 1) * width + x;
      sum += temp[add] - temp[out];
    }
  }

  return output;
}
