import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export interface ChartSize {
  width: number;
  height: number;
}

/**
 * Размер контейнера визуализации.
 *
 * Ядро меняет размеры компонента без перерисовки React-дерева (перетаскивание границ плитки,
 * сворачивание панелей), поэтому размер снимается с DOM наблюдателем, а не из props.
 * Библиотеке отрисовки этот размер обычно нужен для `resize()`.
 *
 * **Ограничение:** зависимость эффекта — сам `ref`, а он стабилен между рендерами, поэтому
 * наблюдатель подписывается один раз, на первый непустой `ref.current`. В шаблоне это безопасно:
 * контейнер в `CustomChart` рендерится безусловно и живёт до размонтирования. Если в твоём
 * плагине контейнер монтируется по условию (заглушка «нет данных» вместо `div` с `ref`,
 * ветка загрузки, портал), после появления контейнера хук останется подписан на старый узел
 * или ни на какой. Тогда переведи хук на колбэк-`ref` (`useCallback`, который получает узел
 * и заново создаёт `ResizeObserver`) либо добавь в зависимости признак, меняющийся вместе
 * с монтированием контейнера.
 */
export function useChartSize(ref: RefObject<HTMLElement | null>): ChartSize {
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
