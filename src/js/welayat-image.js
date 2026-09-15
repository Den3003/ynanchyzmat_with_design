/**
 * Готовая замена твоего сниппета с imgWelayat.
 *
 * Поддерживает оба варианта данных:
 *   imgKey: 'welayats/balkan'                ← новый, предпочтительный
 *   imgWelayat: 'img/welayats/balkan.jpg'    ← старый, чтобы не переписывать всё сразу
 */
import { createPictureSafe } from './picture.js';
import { hasImage } from './image-index.js';

/**
 * 'img/welayats/balkan.jpg' -> 'welayats/balkan'
 * 'welayats/balkan'         -> 'welayats/balkan'
 */
export function toImageName(value) {
  if (!value) {return null;}
  return String(value)
    .replace(/^\/+/, '') // ведущие слэши
    .replace(/^img\//, '') // легаси-префикс из старых путей
    .replace(/\.[^./]+$/, ''); // расширение
}

/** Достаёт имя изображения из объекта велаята. */
export function welayatImageName(welayat) {
  return welayat?.imgKey ?? toImageName(welayat?.imgWelayat);
}

/**
 * Строит <div class="tm-panel__wrapper-image"> с <picture> внутри.
 * @param {object} welayat — объект велаята из данных
 * @returns {HTMLDivElement|null} null, если картинки нет — панель отрендерится без неё
 */
export function createWelayatImage(welayat) {
  const name = welayatImageName(welayat);
  if (!name) {return null;}

  if (!hasImage(name)) {
    console.warn(`[panel] нет файлов для "${name}" в src/assets/images/`);
    return null;
  }

  const picture = createPictureSafe({
    name,
    alt: welayat.imgAlt || `${welayat.name} welayat, Turkmenistan`,
    priority: true, // пользователь кликнул по региону — картинка нужна сразу
    className: 'tm-panel__image',
  });
  if (!picture) {return null;}

  const wrapper = document.createElement('div');
  wrapper.className = 'tm-panel__wrapper-image';
  wrapper.appendChild(picture);
  return wrapper;
}

/** Все имена изображений из объекта данных — для прогрева. */
export function collectImageNames(welayats) {
  return Object.values(welayats)
    .map(welayatImageName)
    .filter((n) => n && hasImage(n));
}
