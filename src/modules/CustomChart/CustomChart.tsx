import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { ChartConfig } from './model/plugin.types';

import ComponentTypeManager from '../../managers/ComponentTypeManager';
import DataAdaptor from './dataAdaptor';
import { getDefaultConfig } from './model/getDefaultConfig';
import { useChartSize } from './hooks/useChartSize';

/** Ответ ядра на запрос данных: пока `fetching`, поля `data` ещё нет. */
interface CoreData {
  fetching?: boolean;
  data?: unknown;
}

/**
 * Инжект ядра: запрос данных для компонента.
 *
 * Пятью аргументами её зовёт штатный хост плагинных типов (см. `getChartData` в
 * `prebuild/app.*.js`: `loadDatas(datasetId, null, config.filters, queryObjects,
 * { editor, componentId })`). Второй аргумент ядро всегда передаёт как `null`.
 *
 * Шестой параметр ядра — `cacheId`, он перекрывает расчёт ключа кэша (`cacheId || getCacheId(...)`).
 * Здесь он не объявлен, потому что шаблон его не передаёт: `getQueryObjects` — заглушка, гонять
 * нечего. Реализуя запрос, объяви параметр и передавай `props.cacheId`: ядро считает ключ по
 * своим `queryObjects`, и без этого ответ ляжет в ячейку с другим ключом, а `props.data` не
 * появится никогда. Порядок работ — скилл `data-query-contract`, раздел «Ловушка cacheId».
 */
type LoadDatas = (
  datasetId: string,
  reserved: null,
  filters: unknown,
  queryObjects: unknown,
  options: { editor?: boolean; componentId?: string },
) => void;

/**
 * Определяет датасет отчёта по конфигу компонента.
 *
 * Перенесено из удалённой копии кода ядра без lodash — исходная реализация была
 * `(_.uniq(_.map(_.flatMap(axes, 'fields'), 'datasetId')) || {})[0]`. У пилюли
 * каждой полки есть `datasetId`; ядро само не допускает конфиг с полками из разных датасетов,
 * поэтому здесь достаточно найти первую пилюлю с непустым `datasetId`, а не строить список
 * уникальных значений. Живёт в файле компонента, а не в отдельном модуле — используется только
 * здесь, и выносить её ради одного вызова незачем (см. правило «второй потребитель» в
 * `typescript-coding-standards`).
 */
export const getDatasetId = (config: ChartConfig | undefined): string | undefined => {
  const axes = config?.axes || [];
  for (const axe of axes) {
    for (const field of axe.fields || []) {
      if (field?.datasetId) return field.datasetId;
    }
  }
  return undefined;
};

/**
 * Props, которые ядро передаёт компоненту. Форма ядром не типизирована — здесь перечислено
 * только то, что читает шаблон; полный список коннектора шире (`report`, `datasets`,
 * `globalFilters`, `pluginImports`…).
 *
 * Готового адаптора данных среди props **нет**: ядро отдаёт сырой ответ бэкенда в `data`,
 * а адаптор каждый компонент строит сам и держит в своём состоянии.
 */
interface CustomChartProps {
  /** Тип компонента (`CustomChart0`…). Ядро читает его из props в своём хосте плагинных типов. */
  type?: string;

  /** Запись компонента в отчёте; `component.type` — тот же тип компонента. */
  component?: { type?: string };

  config: ChartConfig;

  /** Спека компонента. В запросе данных ядро на её месте передаёт `null`. */
  spec?: unknown;

  /** Сырой ответ бэкенда, а не `plotData`. `undefined` — данных ещё не запрашивали. */
  data?: CoreData | null;

  cacheId: string;
  componentId?: string;
  editorActive?: boolean;
  loadDatas: LoadDatas;
}

/**
 * Компонент визуализации.
 *
 * Работа с данными повторяет механику ядра — метод `getChartData` хоста плагинных типов
 * (`prebuild/app.*.js`): по конфигу определяется `datasetId`, из конфига собираются
 * `queryObjects`, и пока ответа нет, компонент зовёт инжект `loadDatas`; как только ответ пришёл
 * и `fetching` снят, компонент **сам** строит адаптор через `ComponentTypeManager` и кладёт его
 * в своё состояние. Готового адаптора и готового `plotData` в props нет — только сырой ответ
 * бэкенда в `data`.
 *
 * Контейнер ниже — пустой намеренно: шаблон не выбирает библиотеку отрисовки. `plotData` уже
 * готов и лежит в состоянии адаптора (`adaptor.plotData`) — именно сюда новый плагин подключает
 * свою отрисовку, используя тот же `containerRef` и размер из `useChartSize` (библиотеке
 * обычно нужен для `resize()`). Атрибуты `data-size`/`data-rows` на контейнере — не
 * визуализация, а след для DevTools: без них состояние адаптора до подключения отрисовки
 * снаружи не проверить.
 */
function CustomChart({
  type,
  component,
  config,
  spec,
  data,
  cacheId,
  componentId,
  editorActive,
  loadDatas,
}: CustomChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useChartSize(containerRef);

  const componentType = type || component?.type || '';
  const manager = useMemo(() => new ComponentTypeManager(componentType), [componentType]);

  const [adaptor, setAdaptor] = useState<DataAdaptor | null>(null);

  useEffect(() => {
    const datasetId = getDatasetId(config);
    if (!datasetId || !config.axes) return;

    // Данных ещё нет — просим ядро их загрузить. Повторный рендер с теми же props сюда
    // не попадает: зависимости эффекта сравниваются по ссылке, а ядро отдаёт тот же `data`.
    if (!data && cacheId) {
      loadDatas(datasetId, null, config.filters, DataAdaptor.getQueryObjects(config), {
        editor: editorActive,
        componentId,
      });
      return;
    }

    // Конструктор `DataAdaptor` сам зовёт `refresh` → `remapData`, поэтому `plotData`
    // готов сразу после `new` (сейчас — как пустой массив: оба метода пока заглушки).
    if (data && !data.fetching) {
      setAdaptor(manager.getDataAdaptor(data.data, config, spec, cacheId));
    }
  }, [manager, config, spec, data, cacheId, componentId, editorActive, loadDatas]);

  const rowsCount = useMemo(() => (adaptor?.plotData || []).length, [adaptor]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      data-size={`${width}x${height}`}
      data-rows={rowsCount}
    />
  );
}

CustomChart.displayName = 'CustomChart';
CustomChart.getDefaultConfig = getDefaultConfig;

export default CustomChart;
