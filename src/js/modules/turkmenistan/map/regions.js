import { projectRing, simplifyRing, ringArea, pointInRing, boundsOf, distanceToPolyline } from '../lib/geo.js';

/**
 * Приводит произвольный GeoJSON велаятов к тому, что нужно сцене.
 *
 * Что здесь решается:
 *  - Polygon и MultiPolygon, дырки и отдельные острова в одной фиче;
 *  - упрощение контуров (реальные границы — тысячи точек на велаят);
 *  - выделение государственной границы: спад высоты должен работать только по
 *    внешнему контуру страны, а на стыках велаятов рельеф обязан быть сплошным.
 *
 * Внутренними считаются отрезки, рядом с которыми (в пределах borderProbe)
 * лежит территория другого велаята. Файл границ для этого размечать не нужно.
 */
export function parseRegions({ geojson, project, options }) {
  const { simplifyTolerance, minIslandArea, minHoleArea, borderProbe } = options;

  const raw = [];

  for (const feature of geojson.features ?? []) {
    const id = feature.properties?.id ?? feature.id;
    if (!id) continue;

    const geometry = feature.geometry;
    const polygons =
      geometry?.type === 'MultiPolygon'
        ? geometry.coordinates
        : geometry?.type === 'Polygon'
          ? [geometry.coordinates]
          : [];

    const shapes = [];

    for (const polygon of polygons) {
      const rings = polygon.map((ring) => projectRing(ring, project));
      const outer = rings[0];
      if (!outer) continue;

      const extra = rings.slice(1);
      const holes = [];

      for (const ring of extra) {
        // Кольцо внутри внешнего контура — дырка (анклав), иначе — отдельный остров.
        const inside = pointInRing(ring[0], outer);
        const area = Math.abs(ringArea(ring));
        if (inside) {
          if (area >= minHoleArea) holes.push(ring);
        } else if (area >= minIslandArea) {
          shapes.push({ outer: ring, holes: [] });
        }
      }

      shapes.push({ outer, holes });
    }

    const kept = shapes.filter((shape) => Math.abs(ringArea(shape.outer)) >= minIslandArea);
    if (!kept.length) continue;

    raw.push({
      id,
      name: feature.properties?.name ?? id,
      shapes: kept.map((shape) => ({
        outer: simplifyRing(shape.outer, simplifyTolerance),
        holes: shape.holes.map((hole) => simplifyRing(hole, simplifyTolerance)),
      })),
    });
  }

  // Быстрая проверка «точка внутри какого-то другого велаята».
  const lookup = raw.map((region) => ({
    id: region.id,
    parts: region.shapes.map((shape) => ({ outer: shape.outer, bounds: boundsOf([shape.outer]) })),
  }));

  const insideOther = (x, y, excludeId) => {
    for (const region of lookup) {
      if (region.id === excludeId) continue;
      for (const part of region.parts) {
        const b = part.bounds;
        if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) continue;
        if (pointInRing([x, y], part.outer)) return true;
      }
    }
    return false;
  };

  const nationalSegments = [];

  for (const region of raw) {
    for (const shape of region.shapes) {
      for (let i = 0; i < shape.outer.length - 1; i += 1) {
        const [ax, ay] = shape.outer[i];
        const [bx, by] = shape.outer[i + 1];
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;

        const dx = bx - ax;
        const dy = by - ay;
        const length = Math.hypot(dx, dy) || 1;
        const nx = (-dy / length) * borderProbe;
        const ny = (dx / length) * borderProbe;

        const shared =
          insideOther(mx + nx, my + ny, region.id) || insideOther(mx - nx, my - ny, region.id);

        if (!shared) nationalSegments.push([ax, ay, bx, by]);
      }
    }
  }

  const allRings = raw.flatMap((region) => region.shapes.map((shape) => shape.outer));

  return { regions: raw, nationalSegments, allRings };
}

/**
 * «Полюс недоступности» — самая удалённая от границы точка внутри контура.
 * Туда ставится подпись, если в content.js не задан labelAt или он попал
 * мимо велаята (частая история после подмены файла границ).
 */
export function regionAnchor(rings, samples = 40) {
  const { minX, maxX, minY, maxY } = boundsOf(rings);
  let best = [(minX + maxX) / 2, (minY + maxY) / 2];
  let bestDistance = -1;

  for (let i = 0; i <= samples; i += 1) {
    for (let j = 0; j <= samples; j += 1) {
      const x = minX + ((maxX - minX) * i) / samples;
      const y = minY + ((maxY - minY) * j) / samples;
      if (!rings.some((ring) => pointInRing([x, y], ring))) continue;

      let distance = Infinity;
      for (const ring of rings) {
        const d = distanceToPolyline(x, y, ring);
        if (d < distance) distance = d;
      }

      if (distance > bestDistance) {
        bestDistance = distance;
        best = [x, y];
      }
    }
  }

  return best;
}
