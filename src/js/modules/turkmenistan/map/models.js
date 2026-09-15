import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { resolveAsset } from '../lib/assets.js';

/**
 * Фабрика 3D-иконок.
 *
 * Каждый тип объекта собирается один раз: детали из data/models.js сливаются
 * в одну геометрию с вершинными цветами, поэтому объект на карте — это один меш
 * и один вызов отрисовки, а не десяток.
 *
 * Если у типа задан `model: '/models/что-то.glb'`, вместо примитивов грузится
 * готовая модель. GLTFLoader подключается динамически и только при
 * необходимости, чтобы не тащить лишний код в бандл.
 */
export async function createModelFactory({ types, models, config }) {
  const shared = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.52,
    metalness: 0.18,
  });

  const prototypes = new Map();
  const urls = Object.entries(types).filter(([, definition]) => definition.model);

  if (urls.length) {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();

    await Promise.all(
      urls.map(async ([type, definition]) => {
        try {
          const gltf = await loader.loadAsync(resolveAsset(config.assetsBase, definition.model));
          normalize(gltf.scene, config.markers.normalizeModels);
          prototypes.set(type, flatten(gltf.scene, type, config.markers.mergeModels !== false));
        } catch (error) {
          console.warn(`[turkmenistan] не удалось загрузить модель ${definition.model}`, error);
        }
      }),
    );
  }

  for (const [type, definition] of Object.entries(models)) {
    if (prototypes.has(type)) continue;
    const geometry = buildGeometry(definition.parts);
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, shared);
    mesh.scale.setScalar(definition.scale ?? 1);
    prototypes.set(type, mesh);
  }

  return {
    /** Готовый объект для сцены. Возвращает null, если модели для типа нет. */
    create(type) {
      const prototype = prototypes.get(type);
      if (!prototype) return null;

      const object = prototype.clone(true);
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return object;
    },
    dispose() {
      prototypes.forEach((object) => {
        object.traverse((child) => {
          if (child.isMesh && child.geometry) child.geometry.dispose();
        });
      });
      prototypes.clear();
      shared.dispose();
    },
  };
}

/**
 * Схлопывает загруженную модель в минимум мешей.
 *
 * Экспортёры режут модель на десятки кусков: каждая труба, площадка и болт —
 * отдельный меш. На карте такая модель стоит 38 раз, и сотня кусков превращается
 * в тысячи вызовов отрисовки. Геометрия склеивается по материалам: было 143
 * меша на модель — станет столько, сколько в ней материалов.
 */
export function flatten(source, type, enabled) {
  const wrapper = new THREE.Group();

  if (!enabled) {
    wrapper.add(source);
    return wrapper;
  }

  source.updateMatrixWorld(true);

  const groups = new Map();
  let originalMeshes = 0;

  source.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    originalMeshes += 1;

    // Скелетная анимация склейку не переживёт — такие меши оставляем как есть.
    if (child.isSkinnedMesh || child.morphTargetInfluences?.length) {
      wrapper.add(child.clone());
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const material = materials[0];
    if (!material) return;

    const geometry = prepareForMerge(child.geometry);
    geometry.applyMatrix4(child.matrixWorld);

    const list = groups.get(material) ?? [];
    list.push(geometry);
    groups.set(material, list);
  });

  for (const [material, geometries] of groups) {
    const merged = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
    if (!merged) continue;
    wrapper.add(new THREE.Mesh(merged, material));
  }

  if (originalMeshes > groups.size) {
    console.info(`[turkmenistan] модель «${type}»: ${originalMeshes} мешей склеены в ${groups.size}`);
  }

  return wrapper;
}

/** Приводит геометрию к единому набору атрибутов, иначе склейка невозможна. */
function prepareForMerge(source) {
  const geometry = (source.index ? source.toNonIndexed() : source.clone());

  for (const name of Object.keys(geometry.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') geometry.deleteAttribute(name);
  }

  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  if (!geometry.attributes.uv) {
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
  }

  geometry.morphAttributes = {};
  return geometry;
}

/* --- Примитивы -------------------------------------------------------------- */

function buildGeometry(parts = []) {
  const geometries = [];
  const color = new THREE.Color();

  for (const part of parts) {
    const geometry = createPart(part);
    if (!geometry) continue;

    color.set(part.color ?? '#ffffff');
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const [rx = 0, ry = 0, rz = 0] = part.rot ?? [];
    if (rx || ry || rz) {
      geometry.rotateX(THREE.MathUtils.degToRad(rx));
      geometry.rotateY(THREE.MathUtils.degToRad(ry));
      geometry.rotateZ(THREE.MathUtils.degToRad(rz));
    }

    const [x = 0, y = 0, z = 0] = part.at ?? [];
    geometry.translate(x, y, z);

    geometries.push(geometry);
  }

  if (!geometries.length) return null;
  return geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
}

function createPart(part) {
  switch (part.shape) {
    case 'box': {
      const [w = 0.2, h = 0.2, d = 0.2] = part.size ?? [];
      return new THREE.BoxGeometry(w, h, d);
    }
    case 'cylinder': {
      const r = part.r ?? 0.1;
      return new THREE.CylinderGeometry(part.r2 ?? r, r, part.h ?? 0.3, part.sides ?? 16, 1);
    }
    case 'cone':
      return new THREE.ConeGeometry(part.r ?? 0.1, part.h ?? 0.3, part.sides ?? 16);
    case 'sphere':
      return new THREE.SphereGeometry(part.r ?? 0.1, part.sides ?? 20, (part.sides ?? 20) / 2);
    default:
      console.warn(`[turkmenistan] неизвестная форма детали: ${part.shape}`);
      return null;
  }
}

/** Вписывает загруженную модель в единичную высоту и ставит на землю. */
function normalize(object, enabled = true) {
  if (!enabled) return;
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const height = size.y || 1;
  const scale = 1 / height;

  object.scale.setScalar(scale);
  object.position.set(
    -((box.min.x + box.max.x) / 2) * scale,
    -box.min.y * scale,
    -((box.min.z + box.max.z) / 2) * scale,
  );
}

/* --- Цветные кружки категорий работ ------------------------------------------ */

/**
 * Ряд плоских цветных фишек рядом с объектом — какие работы там выполнялись.
 * Материалы кешируются по цвету: категорий пять, мешей — десятки.
 */
export function createDotFactory({ projectTypes, config }) {
  const { enabled = true, radius, height, gap, offset, emissive } = config.markers.dots;
  if (!enabled) return { create: () => null, dispose() {} };

  const geometry = new THREE.CylinderGeometry(radius, radius, height, 20);
  const materials = new Map();

  const materialFor = (color) => {
    let material = materials.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: emissive,
        roughness: 0.35,
        metalness: 0,
      });
      materials.set(color, material);
    }
    return material;
  };

  return {
    /** @param {string[]} keys ключи из PROJECT_TYPES */
    create(keys = []) {
      const list = keys.filter((key) => projectTypes[key]);
      if (!list.length) return null;

      const group = new THREE.Group();
      const total = (list.length - 1) * gap;

      list.forEach((key, index) => {
        const mesh = new THREE.Mesh(geometry, materialFor(projectTypes[key].color));
        mesh.position.set(offset[0] + index * gap - total / 2, offset[1], offset[2]);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        group.add(mesh);
      });

      return group;
    },
    dispose() {
      geometry.dispose();
      materials.forEach((material) => material.dispose());
      materials.clear();
    },
  };
}
