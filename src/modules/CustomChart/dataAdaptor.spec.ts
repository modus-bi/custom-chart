import type { ChartConfig, ChartField } from './plugin.types';

import DataAdaptor from './dataAdaptor';

/**
 * Спек фиксирует контракт, который ядро ждёт от адаптора: конструктор с четырьмя аргументами,
 * инициализированные поля экземпляра, статический `getQueryObjects` и `remapData`,
 * возвращающий массив строк. Тесты на форму самих строк появляются вместе с реализацией
 * загрузки данных.
 */
const field = (name: string, extra: Partial<ChartField> = {}): ChartField =>
  ({ id: `${name}_1`, name, alias: name, title: name, ...extra }) as ChartField;

const config: ChartConfig = {
  title: 'Отчёт',
  subtitle: '',
  chartType: 'templatePlugin',
  showtitle: true,
  noexport: false,
  nocopy: false,
  filterMode: false,
  bgColor: null,
  precision: 2,
  suffix: '',
  margin: { l: 0, r: 0, t: 0, b: 0, pad: 0 },
  outline: { color: '#000', enabled: false, width: 1 },
  axes: [
    {
      name: 'Значения',
      title: 'Значения',
      type: 'values',
      selectedFieldIndex: -2,
      fields: [field('Цена', { agg: 'sum' })],
    },
  ],
};

describe('DataAdaptor', () => {
  it('конструируется четырьмя аргументами и инициализирует поля', () => {
    const adaptor = new DataAdaptor([[{ values: 100 }]], config, {}, 'cache-1');

    expect(adaptor.cacheId).toBe('cache-1');
    expect(adaptor.source).toEqual([]);
    expect(adaptor.aggregated).toEqual([]);
    expect(adaptor.plotData).toEqual([]);
  });

  it('конструируется без данных без ошибок', () => {
    const adaptor = new DataAdaptor(null, config, {}, 'cache-2');

    expect(adaptor.plotData).toEqual([]);
  });

  it('getQueryObjects — статический метод, возвращает массив', () => {
    expect(typeof DataAdaptor.getQueryObjects).toBe('function');
    expect(DataAdaptor.getQueryObjects(config)).toEqual([]);
  });

  it('refresh не бросает и не меняет plotData', () => {
    const adaptor = new DataAdaptor(null, config, {}, 'cache-3');

    expect(() => adaptor.refresh([[{ values: 100 }]], config, {}, 'cache-3')).not.toThrow();
    expect(adaptor.plotData).toEqual([]);
  });

  it('remapData возвращает адаптор с пустым plotData', () => {
    const adaptor = new DataAdaptor(null, config, {}, 'cache-4');

    const result = adaptor.remapData(config);

    expect(result).toBe(adaptor);
    expect(adaptor.plotData).toEqual([]);
  });
});
