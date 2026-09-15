/**
 * Детерминированный value-noise + fBm.
 * Без зависимостей и без Math.random: одна и та же карта на всех устройствах.
 */
// Целочисленный хеш вместо Math.sin: тот же детерминизм, но в разы быстрее —
// функция рельефа вызывается сотни тысяч раз при сборке геометрии.
const hash2 = (x, y) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = (t) => t * t * (3 - 2 * t);

/** Значение в диапазоне 0..1. */
export function valueNoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);

  const u = smooth(xf);
  const v = smooth(yf);

  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** Фрактальный шум, 0..1. */
export function fbm(x, y, { octaves = 5, lacunarity = 2.03, gain = 0.5 } = {}) {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i += 1) {
    sum += amplitude * valueNoise(x * frequency, y * frequency);
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return sum / norm;
}
