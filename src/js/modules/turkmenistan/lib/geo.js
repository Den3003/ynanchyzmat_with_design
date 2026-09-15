/**
 * Гео-утилиты: перевод градусов в координаты сцены и базовая вычислительная
 * геометрия (принадлежность точки полигону, расстояние до ломаной).
 *
 * Проекция — равнопромежуточная цилиндрическая с поправкой на широту центра.
 * Для страны размером с Туркменистан искажения незаметны, зато нет зависимостей.
 */

/**
 * Создаёт проектор, вписывающий все переданные кольца в заданную ширину сцены.
 * @param {number[][][]} rings кольца в градусах: [[[lon, lat], ...], ...]
 * @param {number} worldWidth ширина по X в единицах сцены
 */
export function createProjector(rings, worldWidth) {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  const lon0 = (minLon + maxLon) / 2;
  const lat0 = (minLat + maxLat) / 2;
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const scale = worldWidth / ((maxLon - minLon) * kx);

  // Смещение по вертикали, чтобы фигура была отцентрована.
  const midY = ((minLat + maxLat) / 2 - lat0) * scale;

  /** [lon, lat] -> [x, y] в плоскости фигуры (y смотрит на север). */
  const project = (lon, lat) => [(lon - lon0) * kx * scale, (lat - lat0) * scale - midY];

  /** Обратное преобразование: [x, y] сцены -> [lon, lat]. */
  const unproject = (x, y) => [lon0 + x / (kx * scale), lat0 + (y + midY) / scale];

  return { project, unproject, scale, bounds: { minLon, maxLon, minLat, maxLat } };
}

/** Проецирует кольцо целиком. */
export const projectRing = (ring, project) => ring.map(([lon, lat]) => project(lon, lat));

/** Ray casting. point и ring — в одной системе координат. */
export function pointInRing([px, py], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Квадрат расстояния от точки до отрезка. */
function distanceSqToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSq = abx * abx + aby * aby;
  let t = lengthSq === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / lengthSq;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = px - (ax + abx * t);
  const dy = py - (ay + aby * t);
  return dx * dx + dy * dy;
}

/** Минимальное расстояние от точки до ломаной (или кольца). */
export function distanceToPolyline(px, py, points) {
  let min = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    const d = distanceSqToSegment(px, py, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    if (d < min) min = d;
  }
  return Math.sqrt(min);
}

/** Центроид кольца (по площади). Возвращает [x, y]. */
export function ringCentroid(ring) {
  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  area *= 0.5;
  if (Math.abs(area) < 1e-9) return [ring[0][0], ring[0][1]];
  return [cx / (6 * area), cy / (6 * area)];
}

export const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);

export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Знаковая площадь кольца. Знак = направление обхода: <0 по часовой. */
export function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return sum / 2;
}

/** Прямоугольник, охватывающий набор колец. */
export function boundsOf(rings) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Упрощение Рамера — Дугласа — Пекера.
 * Реальные административные границы содержат тысячи точек; для 3D-плиты
 * достаточно сотен, а лишние вершины стоят и памяти, и времени триангуляции.
 */
export function simplifyRing(ring, tolerance) {
  if (tolerance <= 0 || ring.length < 5) return ring;

  const closed = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const points = closed ? ring.slice(0, -1) : ring.slice();
  const toleranceSq = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack = [[0, points.length - 1]];

  while (stack.length) {
    const [first, last] = stack.pop();
    let index = -1;
    let maxDistanceSq = toleranceSq;

    for (let i = first + 1; i < last; i += 1) {
      const d = pointToSegmentSq(points[i], points[first], points[last]);
      if (d > maxDistanceSq) {
        maxDistanceSq = d;
        index = i;
      }
    }

    if (index !== -1) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  const result = [];
  for (let i = 0; i < points.length; i += 1) if (keep[i]) result.push(points[i]);
  if (result.length < 4) return ring;
  result.push([...result[0]]);
  return result;
}

function pointToSegmentSq([px, py], [ax, ay], [bx, by]) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSq = abx * abx + aby * aby;
  let t = lengthSq === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / lengthSq;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = px - (ax + abx * t);
  const dy = py - (ay + aby * t);
  return dx * dx + dy * dy;
}

/**
 * Поле расстояний до набора отрезков с равномерной сеткой.
 * Нас интересуют только расстояния меньше maxDistance (зона спада рельефа),
 * поэтому размер ячейки берём равным ему: хватает просмотра 3×3 ячеек.
 */
export function createSegmentDistanceField(segments, maxDistance) {
  const cell = Math.max(maxDistance, 1e-3);
  const buckets = new Map();
  const key = (ix, iy) => `${ix}|${iy}`;

  const put = (ix, iy, segment) => {
    const id = key(ix, iy);
    const list = buckets.get(id);
    if (list) list.push(segment);
    else buckets.set(id, [segment]);
  };

  for (const segment of segments) {
    const [ax, ay, bx, by] = segment;
    const minIx = Math.floor(Math.min(ax, bx) / cell);
    const maxIx = Math.floor(Math.max(ax, bx) / cell);
    const minIy = Math.floor(Math.min(ay, by) / cell);
    const maxIy = Math.floor(Math.max(ay, by) / cell);
    for (let ix = minIx; ix <= maxIx; ix += 1) {
      for (let iy = minIy; iy <= maxIy; iy += 1) put(ix, iy, segment);
    }
  }

  return (px, py) => {
    const ix = Math.floor(px / cell);
    const iy = Math.floor(py / cell);
    let min = maxDistance * maxDistance;

    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const list = buckets.get(key(ix + dx, iy + dy));
        if (!list) continue;
        for (const [ax, ay, bx, by] of list) {
          const d = pointToSegmentSq([px, py], [ax, ay], [bx, by]);
          if (d < min) min = d;
        }
      }
    }

    return Math.sqrt(min);
  };
}
