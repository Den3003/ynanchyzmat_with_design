/**
 * Фабрика <picture> с x-дескрипторами (1x / 2x) и art direction.
 *
 * ТРИ ПРАВИЛА ДИНАМИЧЕСКОЙ СБОРКИ, которые нельзя нарушать:
 *
 * 1. Все <source> должны быть в DOM ДО того, как <img> попадёт в документ.
 *    Алгоритм выбора источника срабатывает в момент подключения <img>.
 *    Поэтому здесь дерево собирается off-DOM и возвращается целиком.
 *
 * 2. srcset присваивается РАНЬШЕ src — иначе браузер может стартануть
 *    загрузку src, а потом передумать: две загрузки вместо одной.
 *
 * 3. Смена картинки — через replaceWith() нового узла, а НЕ мутацию
 *    source.srcset у существующего <picture>.
 *
 * Про x-дескрипторы: браузер смотрит ТОЛЬКО на devicePixelRatio и полностью
 * игнорирует реальную ширину элемента и атрибут sizes. Поэтому sizes здесь
 * не проставляется намеренно, а CSS-ширина обязана совпадать с пресетом.
 *
 * Про отсутствующие файлы: <source> генерится ТОЛЬКО для того, что реально
 * лежит в папке. Это принципиально — <picture> откатывается на следующий
 * <source> лишь по НЕПОДДЕРЖКЕ формата, а не по 404. Сгенеришь
 * <source type="image/avif"> для несуществующего файла — пользователь
 * увидит битую картинку, а не WebP.
 */
import {
  PRESETS, DPRS, FORMATS, FALLBACK, BASE_PRESET, ART,
} from '../config/images.config.mjs';
import { lookup } from './image-index.js';

/** Собирает "url 1x, url2 2x" из тех вариантов, что реально существуют. */
function buildSrcset(name, preset, ext) {
  const parts = [];
  for (const dpr of DPRS) {
    const url = lookup({ name, preset, dpr, ext });
    if (url) {parts.push(`${url} ${dpr}x`);}
  }
  return parts.length ? parts.join(', ') : null;
}

function makeSource({ mime, srcset, media, dims }) {
  const source = document.createElement('source');
  if (mime) {source.type = mime;}
  source.srcset = srcset;
  if (media) {source.media = media;}
  if (dims) {
    // width/height на <source> нужны, когда пропорции веток различаются
    source.setAttribute('width', String(dims.w));
    source.setAttribute('height', String(dims.h));
  }
  return source;
}

/**
 * @param {object} o
 * @param {string}  o.name           — базовое имя без суффиксов: 'welayats/balkan'
 * @param {string}  [o.preset]       — базовый пресет (по умолчанию BASE_PRESET)
 * @param {Array}   [o.art]          — [{ media, preset }], от БОЛЬШЕГО min-width к меньшему
 * @param {string}  [o.alt]          — '' для декоративных
 * @param {boolean} [o.priority]     — true для LCP / явно запрошенной картинки
 * @param {string}  [o.className]    — класс на <picture>
 * @param {string}  [o.imgClassName] — класс на <img>
 * @returns {HTMLPictureElement}
 */
export function createPicture({
  name,
  preset = BASE_PRESET,
  art = ART,
  alt = '',
  priority = false,
  className = '',
  imgClassName = '',
} = {}) {
  if (!name) {throw new Error('[images] createPicture: не передан name');}

  const picture = document.createElement('picture');
  if (className) {picture.className = className;}
  // подсказка для dev-проверки ширины слота
  picture.dataset.imgPreset = preset;

  // Ветки: сначала art-direction (с media), потом базовая (без media).
  // Браузер берёт первый подошедший <source> сверху вниз.
  const branches = [...art.map((a) => ({ media: a.media, preset: a.preset })), { media: null, preset }];

  for (const branch of branches) {
    const dims = PRESETS[branch.preset];
    if (!dims) {
      console.warn(`[images] пресет "${branch.preset}" не описан в images.config.mjs`);
      continue;
    }

    // современные форматы
    for (const { ext, mime } of FORMATS) {
      const srcset = buildSrcset(name, branch.preset, ext);
      if (srcset) {picture.appendChild(makeSource({ mime, srcset, media: branch.media, dims }));}
    }

    // fallback-формат для art-ветки нужен отдельным <source>: иначе браузер
    // без AVIF/WebP на широком экране возьмёт мобильный кроп из <img>
    if (branch.media) {
      const srcset = buildSrcset(name, branch.preset, FALLBACK.ext);
      if (srcset) {picture.appendChild(makeSource({ srcset, media: branch.media, dims }));}
    }
  }

  // <img> — не картинка, а носитель alt/width/height и последний fallback
  const baseDims = PRESETS[preset];
  if (!baseDims) {throw new Error(`[images] пресет "${preset}" не описан в images.config.mjs`);}

  const baseSrc =
    lookup({ name, preset, dpr: DPRS[0], ext: FALLBACK.ext }) ??
    lookup({ name, preset, dpr: DPRS[0], ext: FORMATS.at(-1)?.ext });

  if (!baseSrc) {
    throw new Error(
      `[images] нет базового файла для "${name}" (пресет ${preset}, ${FALLBACK.ext}, 1x). ` +
      `Ожидается src/assets/images/${name}-${preset}-1x.${FALLBACK.ext}`,
    );
  }

  const img = document.createElement('img');
  if (imgClassName) {img.className = imgClassName;}

  const fbSrcset = buildSrcset(name, preset, FALLBACK.ext);
  if (fbSrcset) {img.srcset = fbSrcset;} // srcset ДО src
  img.src = baseSrc;

  img.alt = alt; // декоративная → alt='' (пустая строка!)
  img.width = baseDims.w; // резервирует место → CLS = 0
  img.height = baseDims.h;

  // setAttribute, а не img.decoding = ... : IDL-свойства decoding/loading
  // поддержаны не везде одинаково, атрибут надёжнее
  img.setAttribute('decoding', 'async');

  if (priority) {
    img.setAttribute('loading', 'eager');
    img.setAttribute('fetchpriority', 'high');
  } else {
    img.setAttribute('loading', 'lazy');
  }

  picture.appendChild(img);
  return picture; // вставляет в DOM вызывающий код
}

/**
 * Безопасная версия: не роняет рендер, если файлов нет.
 * @returns {HTMLPictureElement|null}
 */
export function createPictureSafe(options) {
  try {
    return createPicture(options);
  } catch (err) {
    console.error('[images]', err.message);
    return null;
  }
}

/**
 * Заменяет существующий <picture> новым. Именно replaceWith, а не мутация
 * source.srcset: каждое присвоение перезапускает выбор источника, и между
 * присвоениями <picture> оказывается в несогласованном состоянии
 * (AVIF уже новый, WebP ещё старый) — отсюда лишние запросы и мигание.
 */
export function replacePicture(oldNode, options) {
  const next = createPicture(options);
  oldNode.replaceWith(next);
  return next;
}
