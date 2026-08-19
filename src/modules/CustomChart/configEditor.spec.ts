import type { ChartConfig, ChartField } from './plugin.types';

import ConfigEditor from './configEditor';

/**
 * Спек фиксирует контракт, который ядро ожидает от каждого метода: сигнатуру и то, что конфиг
 * возвращается без изменений. Тесты на реакцию конфига при перетаскивании пилюли появляются
 * вместе с реализацией этой реакции.
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
  axes: [{ name: 'Значения', title: 'Значения', type: 'values', selectedFieldIndex: -2, fields: [] }],
};

const editor = () => new ConfigEditor();

describe('ConfigEditor', () => {
  it('addField возвращает config без изменений', () => {
    const fieldItem = field('Цена', { agg: 'sum', type: 'number' });
    const result = editor().addField(config, 'values', 0, fieldItem, 'number');

    expect(result).toBe(config);
  });

  it('addAllFields возвращает config без изменений', () => {
    const result = editor().addAllFields(config, 'ds-1', {});

    expect(result).toBe(config);
  });

  it('updateField возвращает config без изменений', () => {
    const fieldItem = field('Цена', { agg: 'sum', type: 'number' });
    const result = editor().updateField(config, 'values', 0, fieldItem);

    expect(result).toBe(config);
  });
});
