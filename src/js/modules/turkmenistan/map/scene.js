import * as THREE from 'three';

/**
 * PCF в актуальных версиях three сам фильтрует тень диском Фогеля и учитывает
 * shadow.radius, поэтому отдельный PCFSoftShadowMap стал не нужен и объявлен
 * устаревшим — берём PCF, чтобы не ловить предупреждение в консоли.
 */
const SHADOW_TYPES = {
  basic: THREE.BasicShadowMap,
  pcf: THREE.PCFShadowMap,
  vsm: THREE.VSMShadowMap,
};

/**
 * Обвязка вокруг three.js: рендерер, камера, свет, теневой пол и цикл кадров.
 * Ничего не знает о карте — только про сцену, поэтому легко переиспользуется.
 */
export function createScene({ canvas, container, config }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: config.renderer.antialias,
    alpha: true,
    powerPreference: 'high-performance',
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.renderer.maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  if (config.lights.shadow.enabled) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = SHADOW_TYPES[config.lights.shadow.type] ?? THREE.PCFShadowMap;
    // Карта теней пересчитывается только в кадрах, где что-то двигалось.
    renderer.shadowMap.autoUpdate = false;
  }

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.1, 200);
  camera.position.set(...config.camera.position);

  /** Точка, на которую камера смотрит в исходном виде. */
  const baseTarget = new THREE.Vector3(...config.camera.target);
  /** Живая цель: базовая точка плюс сдвиг от приближения к курсору. */
  const cameraTarget = baseTarget.clone();
  const pan = new THREE.Vector3();
  let zoom = 1;

  camera.lookAt(cameraTarget);

  const cameraBase = camera.position.clone();
  /** Позиция камеры «по умолчанию» с поправкой на пропорции контейнера. */
  const cameraHome = camera.position.clone();
  /** Итоговая позиция с учётом зума и сдвига — от неё считается параллакс. */
  const cameraAnchor = camera.position.clone();

  // Направление взгляда не меняется никогда: камера только подъезжает к цели
  // и скользит параллельно карте. Так карта не «заваливается» при зуме.
  const applyCamera = () => {
    cameraTarget.copy(baseTarget).add(pan);
    cameraAnchor.copy(cameraHome).sub(baseTarget).divideScalar(zoom).add(cameraTarget);
    camera.position.copy(cameraAnchor);
    camera.lookAt(cameraTarget);
    // Матрица нужна свежей для попадания курсором даже в кадрах без отрисовки.
    camera.updateMatrixWorld();
  };
  /** Опорное соотношение сторон, под которое подобрана позиция камеры. */
  const referenceAspect = 1.6;

  /* --- Свет ---------------------------------------------------------------- */
  const key = new THREE.DirectionalLight(0xfff1de, config.lights.keyIntensity);
  key.position.set(...config.lights.keyPosition);

  if (config.lights.shadow.enabled) {
    const { mapSize, radius } = config.lights.shadow;
    key.castShadow = true;
    key.shadow.mapSize.set(mapSize, mapSize);
    key.shadow.radius = radius;
    key.shadow.bias = -0.0012;
    key.shadow.normalBias = 0.02;

    const extent = config.world.width * 0.85;
    Object.assign(key.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 1, far: 60 });
    key.shadow.camera.updateProjectionMatrix();
  }

  const fill = new THREE.DirectionalLight(0x9ec2e0, config.lights.fillIntensity);
  fill.position.set(...config.lights.fillPosition);

  const ambient = new THREE.HemisphereLight(0xdfe9f2, 0x2a3038, config.lights.ambientIntensity);

  scene.add(key, fill, ambient);

  /* --- Пол, который ловит только тень -------------------------------------- */
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(config.world.width * 2.2, config.world.width * 2.2),
    new THREE.ShadowMaterial({ opacity: config.lights.shadow.opacity, transparent: true }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.02;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  /* --- Размер -------------------------------------------------------------- */
  const size = { width: 0, height: 0 };
  let pixelRatio = 0;
  const resizeListeners = new Set();

  // Объявлено до resize(): первый вызов происходит прямо в createScene.
  let needsRender = true;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Ограничиваем не только плотность пикселей, но и общую площадь буфера:
    // секция на всю ширину экрана с ретиной иначе рисует по 15 млн пикселей
    // в кадре, и никакая оптимизация логики этого не перевесит.
    const maxPixels = config.renderer.maxPixels ?? 2_600_000;
    const area = Math.max(rect.width * rect.height, 1);
    let ratio = Math.min(window.devicePixelRatio, config.renderer.maxPixelRatio);
    if (area * ratio * ratio > maxPixels) ratio = Math.sqrt(maxPixels / area);
    ratio = Math.max(ratio, 0.75);
    // Без этой проверки любой «дрожащий» лейаут страницы пересоздавал бы буфер
    // кадра по несколько раз в секунду — самая частая причина тормозов.
    if (rect.width === size.width && rect.height === size.height && ratio === pixelRatio) return;

    pixelRatio = ratio;
    size.width = rect.width;
    size.height = rect.height;
    camera.aspect = rect.width / rect.height;
    // На узких экранах отодвигаем камеру, чтобы страна целиком влезала в кадр.
    const fit = Math.min(Math.max(referenceAspect / camera.aspect, 1), 1.9);
    cameraHome.copy(cameraBase).multiplyScalar(fit);
    applyCamera();
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(ratio);
    renderer.setSize(rect.width, rect.height, false);
    needsRender = true;
    resizeListeners.forEach((fn) => fn());
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  /* --- Цикл ---------------------------------------------------------------- */
  const listeners = new Set();
  let frameId = null;
  let last = performance.now();

  // Сцена почти всегда статична, поэтому кадр рисуется только когда что-то
  // изменилось. На чужой странице это освобождает и процессор, и батарею.
  const tick = (now) => {
    frameId = requestAnimationFrame(tick);
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    listeners.forEach((fn) => fn(delta));

    if (!needsRender) return;
    needsRender = false;
    if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
  };

  return {
    renderer,
    scene,
    camera,
    cameraAnchor,
    cameraTarget,
    baseTarget,
    /**
     * @param {number} nextZoom 1 — исходный вид, больше — ближе
     * @param {THREE.Vector3} nextPan сдвиг цели относительно базовой точки
     */
    setView(nextZoom, nextPan) {
      zoom = nextZoom;
      if (nextPan) pan.copy(nextPan);
      applyCamera();
      needsRender = true;
    },
    size,
    onFrame(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** Попросить перерисовать кадр. */
    requestRender() {
      needsRender = true;
    },
    /** Что реально происходит на сцене — для диагностики производительности. */
    getInfo() {
      const buffer = new THREE.Vector2();
      renderer.getDrawingBufferSize(buffer);

      // Считаем содержимое сцены напрямую: если оно расходится с ожидаемым,
      // значит объекты добавляются повторно.
      let meshes = 0;
      let sceneTriangles = 0;
      const byKind = {};
      const byGeometry = {};

      scene.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        meshes += 1;
        const geometry = object.geometry;
        const triangles = (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3;
        sceneTriangles += triangles;

        const kind = object.userData.kind ?? 'без метки';
        byKind[kind] = (byKind[kind] ?? 0) + 1;
        byGeometry[geometry.type] = (byGeometry[geometry.type] ?? 0) + 1;
      });

      const format = (map) =>
        Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');

      return {
        meshes,
        sceneTriangles: Math.round(sceneTriangles),
        kinds: format(byKind),
        geometries: format(byGeometry),
        css: `${Math.round(size.width)}×${Math.round(size.height)}`,
        buffer: `${buffer.x}×${buffer.y}`,
        pixels: `${(buffer.x * buffer.y / 1e6).toFixed(1)} Мп`,
        pixelRatio,
        devicePixelRatio: window.devicePixelRatio,
        triangles: renderer.info.render.triangles,
        calls: renderer.info.render.calls,
        shadows: renderer.shadowMap.enabled ? config.lights.shadow.mapSize : 'выключены',
      };
    },
    onResize(fn) {
      resizeListeners.add(fn);
      return () => resizeListeners.delete(fn);
    },
    start() {
      if (frameId !== null) return;
      needsRender = true;
      last = performance.now();
      frameId = requestAnimationFrame(tick);
    },
    stop() {
      if (frameId === null) return;
      cancelAnimationFrame(frameId);
      frameId = null;
    },
    dispose() {
      this.stop();
      resizeObserver.disconnect();
      listeners.clear();
      resizeListeners.clear();
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      renderer.dispose();
    },
  };
}
