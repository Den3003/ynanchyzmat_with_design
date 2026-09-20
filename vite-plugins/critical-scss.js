// vite-plugins/critical-scss.js
import { compileAsync } from 'sass-embedded';
import { dirname, sep } from 'node:path';

export default function criticalScss({
  entry,
  placeholder = '<!--@critical-css-->',
}) {
  let isDev = false;
  let cache = null;

  // нормализуем слэши: на Windows chokidar и path.resolve дают разное
  const norm = (p) => p.split(sep).join('/').toLowerCase();
  const watchDir = norm(dirname(entry));

  const render = async () => {
    const { css } = await compileAsync(entry, {
      style: isDev ? 'expanded' : 'compressed',
      sourceMap: false,
    });
    return css;
  };

  return {
    name: 'critical-scss',

    configResolved(config) {
      isDev = config.command === 'serve';
    },

    async buildStart() {
      cache = await render();
    },

    configureServer(server) {
      server.watcher.add(entry);

      server.watcher.on('change', (file) => {
        // реагируем ТОЛЬКО на файлы внутри src/scss/critical/
        if (!norm(file).startsWith(watchDir)) return;

        cache = null;
        (server.hot ?? server.ws).send({ type: 'full-reload' });
      });
    },

    transformIndexHtml: {
      order: 'post',
      async handler(html) {
        if (isDev || !cache) cache = await render();
        return html.replace(placeholder, `<style>${cache}</style>`);
      },
    },
  };
}