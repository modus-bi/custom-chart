/** @jest-environment jsdom */
import React from 'react';
import { render } from '@testing-library/react';

import type { ChartConfig, ChartField } from './model/plugin.types';

import ComponentTypeManager from '../../managers/ComponentTypeManager';
import CustomChart, { getDatasetId } from './CustomChart';

// В jsdom нет ни structuredClone (нужен getDefaultConfig), ни ResizeObserver (нужен useChartSize).
// Полифилл ставится немедленно (не в beforeAll): код верхнего уровня этого файла вызывает
// getDefaultConfig() ещё до того, как Jest успеет прогнать хуки.
(() => {
  if (!('structuredClone' in globalThis)) {
    (globalThis as unknown as { structuredClone: unknown }).structuredClone = (value: unknown) =>
      JSON.parse(JSON.stringify(value));
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
})();

/**
 * Фикстуры повторяют **фактический** контракт ядра: готового адаптора в props нет, ядро отдаёт
 * сырой ответ бэкенда в `data` (`{ fetching, data }`). `DataAdaptor.remapData` — заглушка
 * (см. `dataAdaptor.ts` и `dataAdaptor.spec.ts`), поэтому `plotData` всегда пустой независимо
 * от формы ответа: эти тесты проверяют не форму строк, а то, что компонент запрашивает данные
 * и строит адаптор через `ComponentTypeManager` в правильные моменты.
 */
const field = (name: string, extra: Partial<ChartField> = {}): ChartField =>
  ({ id: `${name}_1`, name, alias: name, title: name, datasetId: 'ds-1', ...extra }) as ChartField;

const config: ChartConfig = {
  ...CustomChart.getDefaultConfig(),
  title: 'Отчёт',
  axes: [
    {
      name: 'Значения',
      title: 'Значения',
      type: 'values',
      selectedFieldIndex: -2,
      fields: [field('Цена', { agg: 'sum', type: 'number' })],
    },
    { name: 'Категории', title: 'Категории', type: 'categories', selectedFieldIndex: 0, fields: [field('Товар')] },
    { name: 'Серии', title: 'Серии', type: 'series', selectedFieldIndex: 0, fields: [] },
    { name: 'Детализация', title: 'Детализация', type: 'details', selectedFieldIndex: 0, fields: [] },
    { name: 'filters', title: 'Фильтры', type: 'filters', selectedFieldIndex: -2, fields: [] },
  ],
};

const serverRow = (values: unknown, categories: string) => ({ values, categories });

/** Ответ ядра: массив трейсов (по одному на пилюлю полки «Значения»). */
const loadedData = {
  fetching: false,
  data: [[serverRow(100, 'Хлеб'), serverRow(200, 'Молоко')]],
};

const emptyData = { fetching: false, data: [[]] };

const commonProps = {
  type: 'CustomChart0',
  config,
  spec: {},
  cacheId: 'cache-1',
  componentId: 'component-1',
  editorActive: true,
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CustomChart', () => {
  it('несёт статический getDefaultConfig', () => {
    expect(typeof CustomChart.getDefaultConfig).toBe('function');
    expect(CustomChart.getDefaultConfig().chartType).toBe('templatePlugin');
  });

  it('строит адаптор сам и кладёт число строк plotData в data-rows контейнера (заглушка remapData — всегда 0)', () => {
    const { container } = render(
      <CustomChart
        {...commonProps}
        data={loadedData}
        loadDatas={jest.fn()}
      />,
    );

    expect(container.firstElementChild?.getAttribute('data-rows')).toBe('0');
  });

  it('строит адаптор через ComponentTypeManager', () => {
    const getDataAdaptor = jest.spyOn(ComponentTypeManager.prototype, 'getDataAdaptor');

    render(
      <CustomChart
        {...commonProps}
        data={loadedData}
        loadDatas={jest.fn()}
      />,
    );

    expect(getDataAdaptor).toHaveBeenCalledTimes(1);
    expect(getDataAdaptor).toHaveBeenCalledWith(loadedData.data, config, commonProps.spec, 'cache-1');
  });

  it('запрашивает данные пятью аргументами, когда их ещё нет', () => {
    const loadDatas = jest.fn();
    render(
      <CustomChart
        {...commonProps}
        loadDatas={loadDatas}
      />,
    );

    expect(loadDatas).toHaveBeenCalledTimes(1);
    const [datasetId, reserved, filters, queryObjects, options] = loadDatas.mock.calls[0];
    expect(datasetId).toBe('ds-1');
    expect(reserved).toBeNull();
    expect(filters).toBe(config.filters);
    expect(queryObjects).toBeTruthy();
    expect(options).toEqual({ editor: true, componentId: 'component-1' });
  });

  it('не запрашивает данные повторно, когда они уже пришли', () => {
    const loadDatas = jest.fn();
    render(
      <CustomChart
        {...commonProps}
        data={loadedData}
        loadDatas={loadDatas}
      />,
    );

    expect(loadDatas).not.toHaveBeenCalled();
  });

  it('повторный рендер с теми же props не шлёт повторный запрос и не пересобирает адаптор', () => {
    const getDataAdaptor = jest.spyOn(ComponentTypeManager.prototype, 'getDataAdaptor');
    const loadDatas = jest.fn();

    const { rerender } = render(
      <CustomChart
        {...commonProps}
        loadDatas={loadDatas}
      />,
    );
    expect(loadDatas).toHaveBeenCalledTimes(1);

    rerender(
      <CustomChart
        {...commonProps}
        loadDatas={loadDatas}
      />,
    );
    expect(loadDatas).toHaveBeenCalledTimes(1);

    rerender(
      <CustomChart
        {...commonProps}
        data={loadedData}
        loadDatas={loadDatas}
      />,
    );
    expect(getDataAdaptor).toHaveBeenCalledTimes(1);

    rerender(
      <CustomChart
        {...commonProps}
        data={loadedData}
        loadDatas={loadDatas}
      />,
    );
    expect(getDataAdaptor).toHaveBeenCalledTimes(1);
    expect(loadDatas).toHaveBeenCalledTimes(1);
  });

  it('пока запрос в полёте, адаптор не строится', () => {
    const getDataAdaptor = jest.spyOn(ComponentTypeManager.prototype, 'getDataAdaptor');
    const loadDatas = jest.fn();

    const { container } = render(
      <CustomChart
        {...commonProps}
        data={{ fetching: true }}
        loadDatas={loadDatas}
      />,
    );

    expect(getDataAdaptor).not.toHaveBeenCalled();
    expect(loadDatas).not.toHaveBeenCalled();
    expect(container.firstElementChild?.getAttribute('data-rows')).toBe('0');
  });

  it('на пустых данных data-rows остаётся нулевым', () => {
    const { container } = render(
      <CustomChart
        {...commonProps}
        data={emptyData}
        loadDatas={jest.fn()}
      />,
    );

    expect(container.firstElementChild?.getAttribute('data-rows')).toBe('0');
  });
});

describe('getDatasetId', () => {
  it('берёт datasetId первой пилюли, встреченной среди полок', () => {
    expect(getDatasetId(config)).toBe('ds-1');
  });

  it('не падает на конфиге без axes', () => {
    expect(getDatasetId({ ...config, axes: [] })).toBeUndefined();
  });

  it('не падает на undefined config', () => {
    expect(getDatasetId(undefined)).toBeUndefined();
  });

  it('пропускает полки без datasetId у пилюль и берёт первый найденный', () => {
    const noDatasetField = field('Товар', { datasetId: undefined });
    const withDataset = field('Цена', { datasetId: 'ds-2' });
    const localConfig: ChartConfig = {
      ...config,
      axes: [
        { name: 'a', title: 'a', type: 'categories', selectedFieldIndex: 0, fields: [noDatasetField] },
        { name: 'b', title: 'b', type: 'values', selectedFieldIndex: -2, fields: [withDataset] },
      ],
    };

    expect(getDatasetId(localConfig)).toBe('ds-2');
  });
});
