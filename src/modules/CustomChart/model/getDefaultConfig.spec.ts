import type { AxeType } from './plugin.types';

import { getDefaultConfig } from './getDefaultConfig';

const axeOfType = (type: AxeType) => getDefaultConfig().axes.find((axe) => axe.type === type);

describe('getDefaultConfig', () => {
  it('объявляет пять полок в нужном порядке', () => {
    const types = getDefaultConfig().axes.map((axe) => axe.type);
    expect(types).toEqual(['values', 'categories', 'series', 'details', 'filters']);
  });

  it('полки категорий, серий и детализации работают с одной пилюлей', () => {
    (['categories', 'series', 'details'] as AxeType[]).forEach((type) => {
      expect(axeOfType(type)?.selectedFieldIndex).toBe(0);
    });
  });

  it('полки значений и фильтров принимают несколько пилюль', () => {
    (['values', 'filters'] as AxeType[]).forEach((type) => {
      expect(axeOfType(type)?.selectedFieldIndex).toBe(-2);
    });
  });

  it('отдаёт копию: правка результата не портит следующий вызов', () => {
    const first = getDefaultConfig();
    first.axes[0].fields.push({ id: 'x', name: 'x' });
    const second = getDefaultConfig();
    expect(second.axes[0].fields).toEqual([]);
  });
});
