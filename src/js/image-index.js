/**
 * Индекс изображений.
 *
 * Заменяет манифест: список реально существующих файлов Vite отдаёт сам
 * через import.meta.glob. Никакого генератора не нужно — что лежит в папке,
 * то и попадает в индекс.
 *
 * ⚠️ ПОЧЕМУ НЕЛЬЗЯ ПРОСТО СОБРАТЬ СТРОКУ:
 *   const url = `/src/assets/images/${key}-panelLg-2x.avif`;  // ❌
 * Vite не анализирует шаблонные строки. Файл не попадёт в граф модулей,
 * не получит хэш, и в dist/ его просто не будет. В dev-режиме это «работает»
 * (dev-сервер отдаёт из исходников) — баг вылезет только на проде.
 *
 * import.meta.glob со СТАТИЧЕСКИМ литералом — единственный надёжный способ.
 */
import { fileName, USED_PRESETS, ALL_FORMATS, DPRS, expectedFiles } from '../config/images.config.mjs';

const modules = import.meta.glob(
  '../assets/images/**/*.{avif,webp,jpg,jpeg,png}',
  { eager: true, query: '?url', import: 'default' },
);

/** 'welayats/balkan-panelSm-2x.avif' -> '/assets/balkan-panelSm-2x-a3f19b.avif' */
const URLS = new Map();
for (const [modulePath, url] of Object.entries(modules)) {
  URLS.set(modulePath.replace(/^.*?assets\/images\//, ''), url);
}

/** Все базовые имена, для которых есть хоть один файл: 'welayats/balkan'. */
const NAMES = new Set();
for (const rel of URLS.keys()) {
  // отрезаем -<preset>-<dpr>x.<ext> по соглашению из конфига
  for (const preset of USED_PRESETS) {
    for (const dpr of DPRS) {
      for (const { ext } of ALL_FORMATS) {
        const suffix = fileName({ name: '', preset, dpr, ext });
        if (rel.endsWith(suffix)) {NAMES.add(rel.slice(0, -suffix.length));}
      }
    }
  }
}

/** URL конкретного варианта или null, если файла нет. */
export function lookup({ name, preset, dpr, ext }) {
  return URLS.get(fileName({ name, preset, dpr, ext })) ?? null;
}

/** Есть ли хоть один файл для этого имени. */
export function hasImage(name) {
  return NAMES.has(name);
}

/** Все доступные имена — удобно для прогрева. */
export function listImages() {
  return [...NAMES].sort();
}

/** Сырая мапа путь → URL (на случай нестандартных сценариев). */
export function allUrls() {
  return new Map(URLS);
}

/**
 * Проверка комплектности в браузере. Вызывай только в dev.
 * Печатает, каких вариантов не хватает и какого размера их экспортировать.
 */
export function auditImages() {
  const problems = [];

  for (const name of listImages()) {
    const missing = expectedFiles(name).filter((f) => !URLS.has(f.file));
    if (missing.length) {problems.push({ name, missing });}
  }

  if (!problems.length) {
    console.info('[images] комплект полный:', NAMES.size, 'изображений');
    return true;
  }

  console.group(`[images] неполный комплект: ${problems.length} изображений`);
  for (const { name, missing } of problems) {
    console.group(name);
    for (const m of missing) {console.warn(`нет ${m.file} — экспортировать ${m.width}×${m.height}`);}
    console.groupEnd();
  }
  console.groupEnd();
  return false;
}
