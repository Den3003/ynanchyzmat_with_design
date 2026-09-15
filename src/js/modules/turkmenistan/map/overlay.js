import { Vector3 } from 'three';

/**
 * Подписи и иконки живут в DOM, а не в WebGL: текст остаётся чётким на любом
 * экране, иконку можно заменить одним файлом, а стили — обычным SCSS.
 * Каждый кадр мы проецируем мировую точку в пиксели и двигаем элемент трансформом.
 */
export function createOverlay({ root }) {
  const items = [];
  const projected = new Vector3();

  function register({ element, position, welayat, scaleWithDepth = true }) {
    root.appendChild(element);
    const item = { element, position: position.clone(), welayat, scaleWithDepth, visible: true };
    items.push(item);
    return item;
  }

  function update({ camera, size, getLift }) {
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;
    const referenceDistance = camera.position.length();

    for (const item of items) {
      projected.copy(item.position);
      projected.y += getLift(item.welayat);

      const distance = camera.position.distanceTo(projected);
      projected.project(camera);

      const behind = projected.z > 1;
      if (behind !== !item.visible) {
        item.visible = !behind;
        item.element.classList.toggle('is-hidden', behind);
      }
      if (behind) continue;

      const x = projected.x * halfWidth + halfWidth;
      const y = -projected.y * halfHeight + halfHeight;
      const scale = item.scaleWithDepth ? Math.min(Math.max(referenceDistance / distance, 0.78), 1.3) : 1;

      item.element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    }
  }

  function setActive(welayatId) {
    for (const item of items) {
      item.element.classList.toggle('is-active', Boolean(welayatId) && item.welayat === welayatId);
      item.element.classList.toggle('is-dimmed', Boolean(welayatId) && item.welayat !== welayatId);
    }
  }

  function dispose() {
    items.forEach((item) => item.element.remove());
    items.length = 0;
  }

  return { register, update, setActive, dispose };
}

/* --- Фабрики элементов ----------------------------------------------------- */

export function createLabelElement({ text, modifier = '' }) {
  const element = document.createElement('div');
  element.className = `tm-marker tm-marker--label ${modifier}`.trim();

  const span = document.createElement('span');
  span.className = 'tm-marker__text';
  span.textContent = text;

  element.appendChild(span);
  return element;
}

/**
 * Круг проекта. Всё, что можно переопределить в data/facilities.js
 * (диаметр, цвет, свечение, размер и цвет текста), приезжает сюда
 * CSS-переменными, поэтому правка данных сразу меняет вид без стилей.
 */
export function createProjectElement({ project, definition }) {
  const element = document.createElement('div');
  element.className = `tm-marker tm-marker--project tm-marker--${project.size || 'sm'}`;

  const style = element.style;
  style.setProperty('--tm-project-color', project.color ?? definition.color);
  if (project.diameter) style.setProperty('--tm-dot-size', `${project.diameter}px`);
  if (project.fontSize) style.setProperty('--tm-dot-font', `${project.fontSize}px`);
  if (project.textColor) style.setProperty('--tm-dot-text', project.textColor);
  if (project.glow !== undefined) style.setProperty('--tm-dot-glow', String(project.glow));

  const dot = document.createElement('span');
  dot.className = 'tm-marker__dot';
  element.appendChild(dot);

  if (project.title) {
    const caption = document.createElement('span');
    caption.className = 'tm-marker__caption';
    caption.textContent = project.title;
    element.appendChild(caption);
  }

  return element;
}
