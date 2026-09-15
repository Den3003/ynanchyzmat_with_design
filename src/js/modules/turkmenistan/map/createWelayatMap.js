import * as THREE from 'three';

import { createScene } from './scene.js';
import { createRelief, buildWelayatMesh, estimateMaxRelief, shapeMeters } from './terrain.js';
import { createOverlay, createLabelElement, createProjectElement } from './overlay.js';
import { createModelFactory, createDotFactory } from './models.js';
import { parseRegions, regionAnchor } from './regions.js';
import { loadHeightmap } from './heightmap.js';
import { resolveAsset } from '../lib/assets.js';
import { createProjector, createSegmentDistanceField, pointInRing, ringCentroid } from '../lib/geo.js';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

// Сколько карт живёт на странице одновременно. Больше одной — почти всегда
// признак повторной инициализации: сцены складываются и всё тормозит.
let liveInstances = 0;
export const instanceCount = () => liveInstances;

/** Раз в две секунды печатает, во что упирается сцена. */
function startPerformanceLog(stage, { regions, facilities, projects }) {
  let frames = 0;
  let elapsed = 0;

  stage.onFrame((delta) => {
    frames += 1;
    elapsed += delta;
    if (elapsed < 2) return;
    const info = stage.getInfo();
    console.info(
      `[turkmenistan] кадров/с ${(frames / elapsed).toFixed(0)} · буфер ${info.buffer} (${info.pixels}) · ` +
        `dPR ${info.devicePixelRatio} → ${info.pixelRatio.toFixed(2)} · ` +
        `в сцене мешей ${info.meshes} / треугольников ${info.sceneTriangles} · ` +
        `за кадр треугольников ${info.triangles}, вызовов ${info.calls} · ` +
        `копий секции на странице ${instanceCount()}\n` +
        `  по назначению — ${info.kinds}\n` +
        `  по типу геометрии — ${info.geometries}\n` +
        `  данные: велаятов ${regions.length}, объектов ${facilities.list.length}, отметок ${projects.list.length}`,
    );
    frames = 0;
    elapsed = 0;
  });
}

/** Насколько два цвета различаются. У THREE.Color нет метода расстояния. */
const colorDistance = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);

/** Уступает поток браузеру между тяжёлыми шагами сборки. */
const nextFrame = () =>
  new Promise((resolve) => {
    // requestAnimationFrame не срабатывает в фоновой вкладке — подстраховываемся таймером.
    const timer = setTimeout(resolve, 32);
    requestAnimationFrame(() => {
      clearTimeout(timer);
      resolve();
    });
  });

/** Все кольца из FeatureCollection — нужны, чтобы вписать страну в кадр. */
function collectRings(geojson) {
  const rings = [];
  for (const feature of geojson.features ?? []) {
    const geometry = feature.geometry;
    if (geometry?.type === 'Polygon') rings.push(...geometry.coordinates);
    else if (geometry?.type === 'MultiPolygon') geometry.coordinates.forEach((polygon) => rings.push(...polygon));
  }
  return rings;
}

/**
 * Собирает интерактивную карту из GeoJSON и данных маркеров.
 * Возвращает управляемый объект: start / stop / setSelected / destroy.
 */
export async function createWelayatMap({
  canvas,
  container,
  overlayRoot,
  config,
  content,
  geojson,
  facilities,
  projects,
  onSelect,
  onHover,
}) {
  const reduced = REDUCED_MOTION.matches;

  /* --- 1. Геометрия в координатах сцены ------------------------------------ */
  const sourceRings = collectRings(geojson);
  const { project, unproject } = createProjector(sourceRings, config.world.width);

  const { regions, nationalSegments, allRings } = parseRegions({
    geojson,
    project,
    options: config.geometry,
  });

  if (!regions.length) throw new Error('GeoJSON не содержит полигонов с properties.id');

  // Спад высоты считается только от государственной границы, поэтому на стыках
  // велаятов рельеф остаётся сплошным.
  const edgeDistance = createSegmentDistanceField(nationalSegments, config.terrain.edgeFalloff);

  // Реальные высоты. Не загрузились — молча уходим на процедурный рельеф.
  let heightmap = null;
  if (config.dem?.enabled) {
    try {
      heightmap = await loadHeightmap({
        ...config.dem,
        url: resolveAsset(config.assetsBase, config.dem.url),
        exaggeration: (config.dem.verticalScale / 1000) * ((config.world.width / 20) * 55000),
      });
    } catch (error) {
      console.warn('[turkmenistan] карта высот недоступна, включён процедурный рельеф', error);
    }
  }

  const relief = createRelief({
    edgeDistance,
    features: config.terrain.features,
    options: config.terrain,
    project,
    heightmap,
    unproject,
    dem: config.dem,
  });

  // Прямоугольник файла высот в координатах сцены — по нему кладутся UV.
  const uvBounds = heightmap
    ? (() => {
        const [x0, y0] = project(config.dem.bbox[0], config.dem.bbox[1]);
        const [x1, y1] = project(config.dem.bbox[2], config.dem.bbox[3]);
        return { minX: x0, maxX: x1, minY: y0, maxY: y1 };
      })()
    : null;

  const normalMap = heightmap ? heightmap.createNormalTexture() : null;

  // Верх высотной палитры: на реальных данных — фиксированная высота в метрах,
  // на процедурных — фактический максимум рельефа.
  const maxRelief = heightmap
    ? (shapeMeters(config.dem.paletteMeters, config.dem.maxMeters, config.dem.curve ?? 1) *
        config.dem.verticalScale) /
      1000
    : estimateMaxRelief(relief, allRings);

  /* --- 2. Сцена ------------------------------------------------------------- */
  const stage = createScene({ canvas, container, config });
  const mapGroup = new THREE.Group();
  stage.scene.add(mapGroup);

  const overlay = createOverlay({ root: overlayRoot });

  const provinces = new Map();

  // Геометрия строится по одному велаяту за кадр: длинная синхронная сборка
  // подвесила бы прокрутку страницы, а так браузер успевает отрисовать кадр.
  for (const region of regions) {
    await nextFrame();

    // Расстояние до собственной границы — для тёмной каймы по контуру велаята.
    const ownSegments = [];
    for (const shape of region.shapes) {
      for (const ring of [shape.outer, ...shape.holes]) {
        for (let i = 0; i < ring.length - 1; i += 1) {
          ownSegments.push([ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1]]);
        }
      }
    }

    const geometry = buildWelayatMesh({
      shapes: region.shapes,
      relief,
      options: config.terrain,
      thickness: config.world.thickness,
      maxRelief,
      uvBounds,
      borderDistance: config.terrain.borderShade
        ? createSegmentDistanceField(ownSegments, config.terrain.borderShade.width)
        : null,
    });

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.03,
      emissive: new THREE.Color(0x000000),
      normalMap,
      normalScale: normalMap ? new THREE.Vector2(...config.dem.normalScale) : undefined,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.welayatId = region.id;
    mesh.userData.kind = 'рельеф';

    const group = new THREE.Group();
    group.add(mesh);
    mapGroup.add(group);

    provinces.set(region.id, {
      id: region.id,
      rings: region.shapes.map((shape) => shape.outer),
      group,
      mesh,
      material,
      lift: 0,
      target: 0,
      emissive: new THREE.Color(0x000000),
      emissiveTarget: new THREE.Color(0x000000),
    });

  }

  /* --- 3. Маркеры ----------------------------------------------------------- */
  const welayatAt = ([lon, lat]) => {
    const point = project(lon, lat);
    for (const province of provinces.values()) {
      if (province.rings.some((ring) => pointInRing(point, ring))) return province.id;
    }
    // Точка вне контура (например, офшор) — отдаём ближайшему по центроиду.
    let best = null;
    let bestDistance = Infinity;
    for (const province of provinces.values()) {
      const [cx, cy] = ringCentroid(province.rings[0]);
      const distance = (cx - point[0]) ** 2 + (cy - point[1]) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = province.id;
      }
    }
    return best;
  };

  /** Точка сцены из уже спроецированных координат. */
  const worldFromPoint = ([x, y], offset = 0) =>
    new THREE.Vector3(x, config.world.thickness + relief.height(x, y) + offset, -y);

  const worldAt = ([lon, lat], offset = 0) => worldFromPoint(project(lon, lat), offset);

  /** Подпись велаята: labelAt, если он внутри контура, иначе — полюс недоступности. */
  const labelPoint = (province, labelAt) => {
    if (labelAt) {
      const point = project(labelAt[0], labelAt[1]);
      if (province.rings.some((ring) => pointInRing(point, ring))) return point;
    }
    return regionAnchor(province.rings);
  };

  const modelFactory = await createModelFactory({
    types: facilities.types,
    models: facilities.models,
    config,
  });

  const dotFactory = createDotFactory({ projectTypes: projects.types, config });

  for (const facility of facilities.list) {
    if (!facilities.types[facility.type]) continue;

    const model = modelFactory.create(facility.type);
    if (!model) continue;
    model.traverse((child) => {
      if (child.isMesh) child.userData.kind = 'объект';
    });

    const welayat = facility.welayat ?? welayatAt(facility.at);
    const province = provinces.get(welayat);
    const position = worldAt(facility.at, config.markers.facilityLift);

    const holder = new THREE.Group();
    holder.position.copy(position);
    holder.scale.setScalar(config.markers.facilityScale * (facility.scale ?? 1));
    if (facility.rotation) holder.rotation.y = THREE.MathUtils.degToRad(facility.rotation);
    holder.add(model);

    const dots = dotFactory.create(facility.projects);
    if (dots) {
      dots.traverse((child) => {
        if (child.isMesh) child.userData.kind = 'фишка';
      });
      holder.add(dots);
    }

    // Модель — ребёнок группы велаята, поэтому едет вместе с ним при подъёме.
    (province?.group ?? mapGroup).add(holder);
  }

  for (const item of projects.list) {
    const definition = projects.types[item.type];
    if (!definition) continue;
    overlay.register({
      element: createProjectElement({ project: item, definition }),
      position: worldAt(item.at, 0.04),
      welayat: item.welayat ?? welayatAt(item.at),
    });
  }

  for (const [id, welayat] of Object.entries(content.welayats)) {
    const province = provinces.get(id);
    if (!province) continue;
    overlay.register({
      element: createLabelElement({ text: welayat.name }),
      position: worldFromPoint(labelPoint(province, welayat.labelAt), 0.34),
      welayat: id,
      scaleWithDepth: false,
    });
  }

  if (content.capital) {
    overlay.register({
      element: createLabelElement({ text: content.capital.name, modifier: 'tm-marker--capital' }),
      position: worldAt(content.capital.labelAt, 0.22),
      welayat: content.capital.welayat ?? welayatAt(content.capital.labelAt),
      scaleWithDepth: false,
    });
  }

  /* --- 4. Взаимодействие ----------------------------------------------------- */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const parallax = new THREE.Vector2();
  const parallaxTarget = new THREE.Vector2();
  const cameraGoal = new THREE.Vector3();

  let hovered = null;
  let selected = null;
  const pickedPoint = new THREE.Vector3();
  let hasPickedPoint = false;
  let needsPick = false;
  let pointerInside = false;

  /**
   * getBoundingClientRect заставляет браузер пересчитать раскладку страницы.
   * На каждое движение мыши это стоит единицы миллисекунд на простой странице
   * и десятки — на сложной. Поэтому прямоугольник кешируется и обновляется
   * только когда он мог измениться: скролл, ресайз окна, ресайз секции.
   */
  let canvasRect = null;
  const invalidateRect = () => {
    canvasRect = null;
  };
  const getCanvasRect = () => {
    if (!canvasRect) canvasRect = canvas.getBoundingClientRect();
    return canvasRect;
  };

  window.addEventListener('scroll', invalidateRect, { passive: true, capture: true });
  window.addEventListener('resize', invalidateRect, { passive: true });

  const setPointerFromEvent = (event) => {
    const rect = getCanvasRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    needsPick = true;
  };

  /**
   * Попадание курсором считается пересечением луча с горизонтальной плоскостью
   * и проверкой «точка внутри контура». Перебирать 90 тысяч треугольников на
   * каждое движение мыши незачем: велаят определяется положением в плане.
   */
  const pickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const planeHit = new THREE.Vector3();
  // Значение по умолчанию на случай старого конфига без pickLevel: без него
  // уровень стал бы NaN и курсор перестал бы попадать по карте вообще.
  const baseLevel = config.world.thickness + (config.interaction.pickLevel ?? 0.25);

  const regionAtLevel = (level) => {
    pickPlane.constant = -level;
    if (!raycaster.ray.intersectPlane(pickPlane, planeHit)) return null;
    const point = [planeHit.x, -planeHit.z];
    for (const province of provinces.values()) {
      if (province.rings.some((ring) => pointInRing(point, ring))) return province.id;
    }
    return null;
  };

  const pick = () => {
    if (!pointerInside) return null;
    raycaster.setFromCamera(pointer, stage.camera);

    // Поднятый велаят стоит выше остальных, поэтому сначала пробуем его уровень.
    let maxLift = 0;
    for (const province of provinces.values()) if (province.lift > maxLift) maxLift = province.lift;

    if (maxLift > 0.05) {
      const lifted = regionAtLevel(baseLevel + maxLift);
      if (lifted && provinces.get(lifted).lift > maxLift * 0.5) {
        pickedPoint.copy(planeHit);
        hasPickedPoint = true;
        return lifted;
      }
    }

    const id = regionAtLevel(baseLevel);
    hasPickedPoint = Boolean(id);
    if (id) pickedPoint.copy(planeHit);
    return id;
  };

  /** Печатает координаты точки клика — заготовка строки для data/facilities.js. */
  const reportCoordinates = (welayat) => {
    if (!hasPickedPoint) return;
    const [lon, lat] = unproject(pickedPoint.x, -pickedPoint.z);
    const at = `[${lon.toFixed(2)}, ${lat.toFixed(2)}]`;
    const snippet = `{ type: 'gasField', at: ${at} },`;
    console.info(`%c${at}%c  ${welayat ?? '—'}\n${snippet}`, 'font-weight:700', '');
    navigator.clipboard?.writeText(snippet).catch(() => {});
  };

  const setHovered = (id) => {
    if (hovered === id) return;
    hovered = id;
    onHover?.(id);
  };

  const handlePointerMove = (event) => {
    pointerInside = true;
    setPointerFromEvent(event);
  };

  const handlePointerLeave = () => {
    pointerInside = false;
    needsPick = false;
    setHovered(null);
    parallax.set(0, 0);
  };

  const handleClick = (event) => {
    setPointerFromEvent(event);
    pointerInside = true;
    const id = pick();
    if (config.debug?.pickCoordinates) reportCoordinates(id);
    if (id) {
      onSelect?.(id === selected ? null : id);
    } else if (config.interaction.deselectOnBackdrop) {
      onSelect?.(null);
    }
  };

  const zoomConfig = config.camera.zoom ?? { enabled: false, min: 1, max: 1, step: 0, damping: 1, panLimit: 0 };
  let zoom = zoomConfig.min;
  let zoomTarget = zoomConfig.min;

  const pan = new THREE.Vector3();
  const panTarget = new THREE.Vector3();
  const anchorPoint = new THREE.Vector3();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  /** Точка карты под курсором — по той же горизонтальной плоскости. */
  const pointUnderCursor = () => {
    raycaster.setFromCamera(pointer, stage.camera);
    groundPlane.constant = -baseLevel;
    return raycaster.ray.intersectPlane(groundPlane, anchorPoint);
  };

  const handleWheel = (event) => {
    if (!zoomConfig.enabled) return;

    const direction = event.deltaY < 0 ? 1 : -1;
    const next = Math.min(Math.max(zoomTarget + direction * zoomConfig.step, zoomConfig.min), zoomConfig.max);
    if (next === zoomTarget) return; // упёрлись в предел — отдаём колесо странице

    event.preventDefault();
    setPointerFromEvent(event);
    pointerInside = true;

    // Приближаемся к точке под курсором: цель сдвигается к ней ровно настолько,
    // чтобы эта точка осталась под тем же пикселем экрана.
    const anchor = pointUnderCursor();
    if (anchor) {
      const shift = 1 - zoomTarget / next;
      panTarget.addScaledVector(anchor.clone().sub(stage.baseTarget).sub(panTarget), shift);
    }

    // Предел сдвига растёт вместе с зумом и обнуляется на минимальном —
    // отъехав до конца, карта сама возвращается в исходное положение.
    const limit = zoomConfig.panLimit * (1 - zoomConfig.min / next);
    if (panTarget.length() > limit) panTarget.setLength(limit);

    zoomTarget = next;
  };

  /** Двойной клик возвращает исходный вид. */
  const handleDoubleClick = () => {
    zoomTarget = zoomConfig.min;
    panTarget.set(0, 0, 0);
  };

  canvas.addEventListener('wheel', handleWheel, { passive: false });
  canvas.addEventListener('dblclick', handleDoubleClick);
  canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
  canvas.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  canvas.addEventListener('click', handleClick);

  /* --- 5. Кадр --------------------------------------------------------------- */
  const HOVER_EMISSIVE = new THREE.Color(0x1d1208);
  const ACTIVE_EMISSIVE = new THREE.Color(0x33210f);
  const IDLE_EMISSIVE = new THREE.Color(0x000000);

  const liftOf = (id) => provinces.get(id)?.lift ?? 0;

  // Камера неподвижна, поэтому маркеры пересчитываются только когда что-то
  // действительно поменялось: иначе они бы дрожали на субпиксельных пересчётах.
  let overlayDirty = true;
  stage.onResize(() => {
    overlayDirty = true;
    invalidateRect();
  });

  stage.onFrame((delta) => {
    if (needsPick) {
      setHovered(pick());
      needsPick = false;
    }

    const damping = reduced ? 1 : 1 - (1 - config.interaction.damping) ** (delta * 60);
    let moving = false;

    let animating = false;

    if (zoom !== zoomTarget || !pan.equals(panTarget)) {
      const zoomDamping = reduced ? 1 : 1 - (1 - zoomConfig.damping) ** (delta * 60);
      zoom += (zoomTarget - zoom) * zoomDamping;
      if (Math.abs(zoomTarget - zoom) < 0.0005) zoom = zoomTarget;
      pan.lerp(panTarget, zoomDamping);
      if (pan.distanceTo(panTarget) < 0.0005) pan.copy(panTarget);
      stage.setView(zoom, pan);
      overlayDirty = true;
      animating = true;
    }

    for (const province of provinces.values()) {
      province.target =
        province.id === selected
          ? config.interaction.activeLift
          : province.id === hovered
            ? config.interaction.hoverLift
            : 0;

      if (province.lift !== province.target) {
        province.lift += (province.target - province.lift) * damping;
        if (Math.abs(province.target - province.lift) < 0.0005) province.lift = province.target;
        province.group.position.y = province.lift;
        moving = true;
      }

      province.emissiveTarget =
        province.id === selected ? ACTIVE_EMISSIVE : province.id === hovered ? HOVER_EMISSIVE : IDLE_EMISSIVE;

      const emissive = province.material.emissive;
      if (!emissive.equals(province.emissiveTarget)) {
        emissive.lerp(province.emissiveTarget, damping);
        if (colorDistance(emissive, province.emissiveTarget) < 0.002) {
          emissive.copy(province.emissiveTarget);
        }
        animating = true;
      }
    }

    if (config.camera.parallax && !reduced) {
      const strength = config.camera.parallax;
      parallaxTarget.set(pointerInside ? pointer.x * strength : 0, pointerInside ? pointer.y * strength * 0.5 : 0);
      parallax.lerp(parallaxTarget, 0.06);
      cameraGoal.copy(stage.cameraAnchor);
      cameraGoal.x += parallax.x;
      cameraGoal.y += parallax.y;
      stage.camera.position.copy(cameraGoal);
      stage.camera.lookAt(stage.cameraTarget);
    }

    if (moving || overlayDirty || (config.camera.parallax && !reduced)) {
      overlay.update({ camera: stage.camera, size: stage.size, getLift: liftOf });
      overlayDirty = false;
      animating = true;
    }

    if (moving || animating) stage.requestRender();
  });

  if (config.debug?.logPerformance) startPerformanceLog(stage, { regions, facilities, projects });

  liveInstances += 1;

  return {
    start: () => stage.start(),
    stop: () => stage.stop(),
    setSelected(id) {
      selected = id && provinces.has(id) ? id : null;
      overlay.setActive(selected);
    },
    destroy() {
      liveInstances = Math.max(0, liveInstances - 1);
      window.removeEventListener('scroll', invalidateRect, { capture: true });
      window.removeEventListener('resize', invalidateRect);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('click', handleClick);
      overlay.dispose();
      normalMap?.dispose();
      modelFactory.dispose();
      dotFactory.dispose();
      stage.dispose();
    },
  };
}
