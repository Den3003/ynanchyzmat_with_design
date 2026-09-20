import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import eslintPlugin from 'vite-plugin-eslint2';
import injectHTML from 'vite-plugin-html-inject';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng';
// import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import criticalScss from './vite-plugins/critical-scss';

// 🔍 Авто-поиск всех HTML-файлов в корне проекта
const getRootHtmlInputs = () => {
  const files = fs.readdirSync(__dirname);
  const htmlFiles = files.filter((file) => file.endsWith('.html'));

  return htmlFiles.reduce((acc, file) => {
    // Название ключа без .html (например: 'index', 'about', 'contacts')
    const name = path.parse(file).name;
    acc[name] = path.resolve(__dirname, file);
    return acc;
  }, {});
};

// ⚠️ Напоминание про robots.txt.
// public/robots.txt закрывает сайт от индексации и нужен только демо-версии.
// Плагин печатает предупреждение в конце каждой сборки, чтобы файл не уехал
// на продакшен незамеченным. Перед боевым запуском удалить и файл, и плагин.
const robotsReminder = () => ({
  name: 'robots-reminder',
  apply: 'build',
  closeBundle() {
    if (!fs.existsSync(path.resolve(__dirname, 'public/robots.txt'))) {
      return;
    }

    console.warn(
      '\n\x1b[43m\x1b[30m ВНИМАНИЕ \x1b[0m ' +
      '\x1b[33mpublic/robots.txt закрывает сайт от индексации (Disallow: /).\x1b[0m\n' +
      '           Это нужно только демо-версии. Перед боевым запуском файл удалить.\n'
    );
  },
});

export default defineConfig({
  plugins: [ 
    injectHTML(), // Включаем плагин
    eslintPlugin({
      // Опции: можно указать, включать ли предупреждения, кэш и т.д.
      cache: false,
      include: ['**/*.js'],
      exclude: ['node_modules/**', 'dist/**'],
    }),
    createSvgIconsPlugin({
      iconDirs: ['src/assets/icons'],
      failOnError: true,
      // Оптимизация SVG с помощью SVGO (настройка под ваш стиль)
      svgoOptions: {
        multipass: true, // многопроходная оптимизация
      }
    }),

    // 🖼️ Сжатие растровых картинок при сборке (только build, dev не трогает).
    // Исходники в src/assets сохранены в максимальном качестве — без этого
    // шага в dist уезжают файлы по 1–2 МБ.
    /* ViteImageOptimizer({
      jpg: {
        quality: 72,
        mozjpeg: true,
        progressive: true, // картинка проявляется постепенно, а не сверху вниз
      },
      jpeg: {
        quality: 72,
        mozjpeg: true,
        progressive: true,
      },
      png: {
        quality: 80,
        compressionLevel: 9,
      },
      // SVG-спрайт уже обрабатывает createSvgIconsPlugin выше
      test: /\.(jpe?g|png|gif|tiff|webp|avif)$/i,

      //  ⚠️ turkmenistan-height.png — не картинка, а карта высот: рельеф
      //  упакован в 12 бит по каналам. Любое пережатие с потерями ломает
      //  геометрию 3D-карты, поэтому файл проходит мимо оптимизатора.
      exclude: /turkmenistan-height\.png$/i,
    }), */

    robotsReminder(),

    // 🎬 Критический CSS лоадера: компилируется из SCSS и инлайнится
    // в <head> вместо <!--@critical-css-->.
    // Обязательно ПОСЛЕ injectHTML() — иначе плейсхолдера ещё нет в HTML.
    criticalScss({
      entry: path.resolve(__dirname, 'src/scss/critical/loader.scss'),
    }),
  ],

  //  Локальная отладка формы: `php -S localhost:8000 -t public` рядом с dev-сервером,
  //  тогда запрос из api.js на /api/send.php уходит в PHP, а не в Vite.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  // Настройки продакшн-сборки (Rollup)
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Очищать dist перед каждой сборкой

    //  Растровые картинки никогда не инлайнятся в base64: иначе <picture> с
    //  avif/webp/jpg превращается в огромный HTML, и браузер теряет выбор формата
    assetsInlineLimit: (filePath, content) => {
      if (/\.(avif|webp|jpe?g|png|gif)$/i.test(filePath)) return false;
      return content.length < 4096;
    },

    rollupOptions: {
      // Передаем авто-найденные HTML страницы
      input: getRootHtmlInputs(),

      output: {
        // Красивая и чистая раскладка ассетов по папкам
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg|webp|avif)$/.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(name ?? '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});