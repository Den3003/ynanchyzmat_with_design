import * as THREE from 'three';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { fbm } from '../lib/noise.js';
import { distanceToPolyline, smoothstep, boundsOf } from '../lib/geo.js';

/**
 * Функция рельефа: по координатам сцены (x, y — плоскость фигуры) возвращает
 * высоту над верхней гранью плиты.
 *
 * Складывается из трёх частей:
 *   1) фрактальный шум — барханы Каракумов;
 *   2) хребты и речные долины из CONFIG.terrain.features;
 *   3) спад к государственной границе, чтобы края выглядели размытыми.
 */
export function createRelief({ edgeDistance, features, options, project, heightmap, unproject, dem }) {
  // Есть реальные высоты — процедурная генерация не нужна вовсе.
  if (heightmap) {
    const unitsPerMeter = dem.verticalScale / 1000;
    const curve = dem.curve ?? 1;
    return {
      height(x, y) {
        const edge = smoothstep(0, options.edgeFalloff, edgeDistance(x, y));
        if (edge === 0) return 0;
        const [lon, lat] = unproject(x, y);
        return shapeMeters(heightmap.sampleCoarse(lon, lat), dem.maxMeters, curve) * unitsPerMeter * edge;
      },
    };
  }

  const { noise, edgeFalloff, baseHeight, detail, ridged } = options;

  const lines = features.map((item) => ({
    ...item,
    points: item.points.map(([lon, lat]) => project(lon, lat)),
    widthSq: item.width * item.width,
  }));

  const height = (x, y) => {
    const edge = smoothstep(0, edgeFalloff, edgeDistance(x, y));
    if (edge === 0) return 0;

    const base = fbm(x * noise.frequency + 11.3, y * noise.frequency - 7.7, noise);
    let h = baseHeight + (base - 0.42) * noise.amplitude * 2;

    if (ridged) {
      const raw = fbm(x * ridged.frequency + 7.1, y * ridged.frequency - 3.3, { octaves: ridged.octaves ?? 4 });
      const crest = 1 - Math.abs(raw * 2 - 1);
      h += (crest ** ridged.sharpness - 0.45) * ridged.amplitude;
    }

    if (detail) {
      h += (fbm(x * detail.frequency + 41.7, y * detail.frequency + 17.3, { octaves: 3 }) - 0.5) * detail.amplitude;
    }

    // Доменный варп: хребты «виляют», иначе они выглядят выдавленной стенкой.
    const wx = x + (fbm(x * 0.8 + 3.1, y * 0.8 - 2.4, { octaves: 3 }) - 0.5) * 1.4;
    const wy = y + (fbm(x * 0.8 - 5.7, y * 0.8 + 9.2, { octaves: 3 }) - 0.5) * 1.4;

    for (const line of lines) {
      const d = distanceToPolyline(wx, wy, line.points);
      const falloff = Math.exp((-d * d) / line.widthSq);
      if (falloff < 0.004) continue;
      // Хребты «шумят», долины ровные.
      const modulation = line.amplitude > 0 ? 0.45 + 0.95 * fbm(x * 1.35, y * 1.35, { octaves: 4 }) : 1;
      h += line.amplitude * falloff * modulation;
    }

    return Math.max(-0.12, h) * edge;
  };

  return { height };
}

/**
 * Оценивает фактическую максимальную высоту, чтобы высотная палитра
 * использовалась целиком независимо от того, как настроены хребты.
 */
export function estimateMaxRelief(relief, rings, samples = 72) {
  const { minX, maxX, minY, maxY } = boundsOf(rings);

  const stepX = (maxX - minX) / samples;
  const stepY = (maxY - minY) / samples;
  let max = 0;

  for (let i = 0; i <= samples; i += 1) {
    for (let j = 0; j <= samples; j += 1) {
      const h = relief.height(minX + i * stepX, minY + j * stepY);
      if (h > max) max = h;
    }
  }

  return max || 1;
}

/**
 * Сжимающая кривая высот. Показатель < 1 поднимает равнину и придавливает горы:
 * в пустыне становится видно эрозию, а Копетдаг не превращается в частокол
 * тонких пиков, которые сетка такого шага всё равно не вытянет.
 */
export function shapeMeters(meters, maxMeters, curve) {
  if (curve === 1) return meters;
  const value = Math.max(meters, 0) / maxMeters;
  return maxMeters * value ** curve;
}

function createPalette(stops) {
  const parsed = stops.map(([position, hex]) => ({ position, color: new THREE.Color(hex) }));
  const result = new THREE.Color();

  return (t) => {
    const value = t < 0 ? 0 : t > 1 ? 1 : t;
    for (let i = 1; i < parsed.length; i += 1) {
      if (value <= parsed[i].position || i === parsed.length - 1) {
        const a = parsed[i - 1];
        const b = parsed[i];
        const span = b.position - a.position || 1;
        return result.copy(a.color).lerp(b.color, (value - a.position) / span);
      }
    }
    return result.copy(parsed[0].color);
  };
}

/**
 * Строит меш одного велаята.
 * Геометрия создаётся в плоскости XY и разворачивается в XZ, поэтому «север»
 * оказывается в отрицательном Z, а высота — по Y.
 */
export function buildWelayatMesh({ shapes, relief, options, thickness, maxRelief, borderDistance, uvBounds }) {
  let geometry = new THREE.ExtrudeGeometry(shapes.map(toShape), {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 1,
  });

  geometry = new TessellateModifier(options.maxEdgeLength, options.tessellationIterations).modify(geometry);

  const position = geometry.attributes.position;
  const top = thickness - 1e-4;
  // ExtrudeGeometry не индексирована: одна и та же вершина встречается по 6 раз,
  // поэтому высоту считаем один раз на уникальную точку.
  const cache = new Map();

  for (let i = 0; i < position.count; i += 1) {
    if (position.getZ(i) < top) continue;
    const x = position.getX(i);
    const y = position.getY(i);
    const key = Math.round(x * 8192) * 4194304 + Math.round(y * 8192);
    let h = cache.get(key);
    if (h === undefined) {
      h = relief.height(x, y);
      cache.set(key, h);
    }
    position.setZ(i, thickness + h);
  }

  position.needsUpdate = true;
  geometry.computeBoundingBox();

  // Мягкие нормали с сохранением острого ребра между верхом и боковой стенкой.
  geometry = toCreasedNormals(geometry, THREE.MathUtils.degToRad(52));

  // Вершинные цвета: высотная палитра + лёгкая вариация, чтобы не было полос.
  const colored = geometry.attributes.position;
  const colors = new Float32Array(colored.count * 3);
  const sample = createPalette(options.palette);

  for (let i = 0; i < colored.count; i += 1) {
    const z = colored.getZ(i);
    const normalized = Math.max(0, Math.min(1, (z - thickness) / maxRelief));
    const relative = normalized ** (options.paletteGamma ?? 1);
    const x = colored.getX(i);
    const y = colored.getY(i);
    const grain = (fbm(x * 2.6, y * 2.6, { octaves: 2 }) - 0.5) * 0.08;
    const color = sample(relative + grain);

    // Тёмная кайма вдоль границы велаята: две соседние каймы читаются как линия.
    let shade = 1;
    if (borderDistance && z > thickness - 1e-4) {
      const { width, strength } = options.borderShade;
      shade = 1 - strength * (1 - smoothstep(0, width, borderDistance(x, y)));
    }

    colors[i * 3] = color.r * shade;
    colors[i * 3 + 1] = color.g * shade;
    colors[i * 3 + 2] = color.b * shade;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // UV под карту нормалей: тянем текстуру ровно по прямоугольнику файла высот.
  if (uvBounds) {
    const { minX, maxX, minY, maxY } = uvBounds;
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const uvs = new Float32Array(colored.count * 2);
    for (let i = 0; i < colored.count; i += 1) {
      uvs[i * 2] = (colored.getX(i) - minX) / spanX;
      uvs[i * 2 + 1] = (colored.getY(i) - minY) / spanY;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }

  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingSphere();

  return geometry;
}

/** { outer, holes } в градусах сцены -> THREE.Shape с дырками. */
function toShape({ outer, holes = [] }) {
  const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const hole of holes) {
    shape.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
  }
  return shape;
}
