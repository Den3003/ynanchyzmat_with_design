// src/js/modules/page-transition.js

export function initPageTransition(loader) {
  if (!loader) return;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest('a[href]');
    if (!link) return;

    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    if (link.dataset.noTransition !== undefined) return;
    if (!/^https?:$/.test(link.protocol)) return; // mailto:, tel:
    if (link.origin !== location.origin) return; // внешний домен

    const url = new URL(link.href);
    // якорь на текущей странице — перезагрузки не будет
    if (url.pathname === location.pathname && url.search === location.search) return;

    // статичный кадр: 3-секундную секвенцию на выходе играть бессмысленно
    // loader.show({ animate: false });

    // только фон: секвенция отыграет уже на новой странице
    loader.show({ blank: true });
  });
}