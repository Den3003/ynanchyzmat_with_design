/**
 * Пути к файлам секции.
 *
 * Все ресурсы (границы, карта высот, иконки, модели) адресуются относительно
 * CONFIG.assetsBase. Если на вашем сайте они лежат не в корне, достаточно
 * поменять одну строку в конфиге — трогать данные не нужно.
 */
export function resolveAsset(base, path) {
  if (!path) {
    return path;
  }
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) {
    return path;
  }
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${path.replace(/^\/+/, '')}`;
}
