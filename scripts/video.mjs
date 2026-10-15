/**
 * Подготовка фоновых видео для первого слайда.
 *
 * Не требует системного ffmpeg — берёт бинарник из пакета ffmpeg-static.
 *
 *   npm i -D ffmpeg-static
 *   npm run video
 *
 * Исходники:  raw/hero-night.mp4  raw/hero-day.mp4   (.mov тоже подойдёт)
 * Результат:  public/video/hero-{night,day}.{mp4,webm}
 */

import { spawn } from 'node:child_process';
import { mkdir, access, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// 6–8 секунд — оптимум. Короче заметна склейка петли, длиннее растёт
// вес без пользы: фон никто не разглядывает.
const DURATION = 8;

// 1920 для чёткости на больших экранах. Не влезаете в бюджет —
// ставьте 1280: видео под тёмной подложкой, мягкость незаметна,
// а вес падает примерно вдвое.
const WIDTH = 1920;

const THEMES = ['night', 'day'];
const EXTS = ['mp4', 'mov', 'MP4', 'MOV', 'm4v'];

function run(args) {
  return new Promise((ok, fail) => {
    const p = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => code === 0 ? ok() : fail(new Error(err.slice(-800))));
  });
}

async function findSource(theme) {
  for (const ext of EXTS) {
    const p = resolve(root, 'raw', `hero-${theme}.${ext}`);
    try { await access(p); return p; } catch { /* дальше */ }
  }
  return null;
}

async function size(path) {
  const { size: b } = await stat(path);
  return (b / 1024 / 1024).toFixed(2) + ' МБ';
}

const outDir = resolve(root, 'public/video');
await mkdir(outDir, { recursive: true });

console.log(`ffmpeg: ${ffmpegPath}\n`);

for (const theme of THEMES) {
  const src = await findSource(theme);
  if (!src) {
    console.warn(`пропуск: нет raw/hero-${theme}.{mp4,mov}`);
    continue;
  }

  console.log(`=== ${theme} ===`);

  const common = [
    '-y', '-i', src,
    '-t', String(DURATION),
    '-an',                                    // убрать звук: экономит вес
                                              // и снимает вопросы с автоплеем
    '-vf', `scale=${WIDTH}:-2,fps=25`,
    '-pix_fmt', 'yuv420p',                    // совместимость с Safari
  ];

  const mp4 = resolve(outDir, `hero-${theme}.mp4`);
  await run([
    ...common,
    '-c:v', 'libx264',
    '-profile:v', 'main', '-level', '4.0',    // совместимость со старыми
    '-crf', '28', '-preset', 'slow',
    '-movflags', '+faststart',                // КРИТИЧНО: moov в начало файла,
                                              // иначе видео начнёт играть
                                              // только после полной загрузки
    mp4,
  ]);
  console.log(`  hero-${theme}.mp4   ${await size(mp4)}`);

  const webm = resolve(outDir, `hero-${theme}.webm`);
  await run([
    ...common,
    '-c:v', 'libvpx-vp9',
    '-crf', '38', '-b:v', '0', '-row-mt', '1',
    webm,
  ]);
  console.log(`  hero-${theme}.webm  ${await size(webm)}`);
}

console.log('\nБюджет: до 2 МБ на файл.');
console.log('Больше — поднимите CRF (28→32 для mp4, 38→42 для webm) или WIDTH до 1280.');
