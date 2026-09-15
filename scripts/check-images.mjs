#!/usr/bin/env node
/**
 * Проверка комплектности изображений. Без зависимостей.
 *
 * node scripts/check-images.mjs          — что отсутствует
 * node scripts/check-images.mjs --plan   — полный список файлов на экспорт
 * node scripts/check-images.mjs --strict — ненулевой exit при пропусках (для CI)
 *
 * Базовое имя определяется по любому файлу, подходящему под соглашение,
 * либо по «голому» оригиналу без суффикса (welayats/balkan.jpg).
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  PRESETS, DPRS, USED_PRESETS, ALL_FORMATS, FALLBACK,
  fileName, expectedFiles,
} from '../src/config/images.config.mjs';

const SRC_DIR = 'src/assets/images/welayats';
const SRC_EXT = /\.(avif|webp|jpe?g|png)$/i;

const C = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

async function listFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { recursive: true, withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && SRC_EXT.test(e.name))
      .map((e) => path.relative(dir, path.join(e.parentPath ?? e.path, e.name)).split(path.sep).join('/'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/** Все суффиксы, которые может дать соглашение об именах. */
function suffixes() {
  const out = [];
  for (const preset of USED_PRESETS) {
    for (const dpr of DPRS) {
      for (const { ext } of ALL_FORMATS) {
        out.push(fileName({ name: '', preset, dpr, ext }));
      }
    }
  }
  return out.sort((a, b) => b.length - a.length);
}

function baseNames(files) {
  const sfx = suffixes();
  const names = new Set();

  for (const file of files) {
    const hit = sfx.find((s) => file.endsWith(s));
    if (hit) {
      names.add(file.slice(0, -hit.length));
    } else {
      // «голый» оригинал: welayats/balkan.jpg
      names.add(file.replace(SRC_EXT, ''));
    }
  }
  return [...names].sort();
}

async function main() {
  const plan = process.argv.includes('--plan');
  const strict = process.argv.includes('--strict');

  const files = await listFiles(SRC_DIR);
  if (files === null) {
    console.error(C.red(`Папки ${SRC_DIR} нет. Создай её и положи туда изображения.`));
    process.exit(1);
  }

  const present = new Set(files);
  const names = baseNames(files);

  if (!names.length) {
    console.error(C.red(`В ${SRC_DIR} нет изображений.`));
    process.exit(1);
  }

  console.log(C.bold('\nПресеты:'));
  for (const p of USED_PRESETS) {
    const { w, h } = PRESETS[p];
    const sizes = DPRS.map((d) => `${d}x → ${w * d}×${h * d}`).join(', ');
    console.log(`  ${p.padEnd(10)} ${C.dim(`${w}×${h} CSS-px`)}  ${sizes}`);
  }

  const perImage = USED_PRESETS.length * DPRS.length * ALL_FORMATS.length;
  console.log(C.dim(`\n${perImage} файлов на изображение · найдено ${names.length} изображений\n`));

  let missingTotal = 0;

  for (const name of names) {
    const expected = expectedFiles(name);
    const missing = expected.filter((f) => !present.has(f.file));
    missingTotal += missing.length;

    if (plan) {
      console.log(C.bold(name));
      for (const f of expected) {
        const mark = present.has(f.file) ? C.green('✓') : C.red('✗');
        console.log(`  ${mark} ${f.file.padEnd(44)} ${C.dim(`${f.width}×${f.height}`)}`);
      }
      console.log('');
      continue;
    }

    if (!missing.length) {
      console.log(`${C.green('✓')} ${name}`);
      continue;
    }

    console.log(`${C.red('✗')} ${C.bold(name)} ${C.dim(`— не хватает ${missing.length} из ${expected.length}`)}`);
    for (const f of missing) {
      console.log(`    ${f.file.padEnd(44)} ${C.yellow(`${f.width}×${f.height}`)}`);
    }
  }

  // критично отдельно: без fallback 1x картинка вообще не отрисуется
  const broken = names.filter((name) =>
    USED_PRESETS.some((preset) => !present.has(fileName({ name, preset, dpr: DPRS[0], ext: FALLBACK.ext }))),
  );

  console.log('');
  if (broken.length) {
    console.log(C.red(`Нет базового ${FALLBACK.ext} 1x — эти изображения не отрисуются:`));
    for (const n of broken) console.log(`  ${n}`);
    console.log('');
  }

  if (!missingTotal) {
    console.log(C.green('Комплект полный.\n'));
  } else {
    console.log(C.yellow(`Всего не хватает ${missingTotal} файлов.`));
    console.log(C.dim('Отсутствующие варианты просто не попадут в <picture> — картинка не сломается,\n' +
      'но браузер получит меньше вариантов для выбора.\n'));
  }

  if (strict && (missingTotal || broken.length)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
