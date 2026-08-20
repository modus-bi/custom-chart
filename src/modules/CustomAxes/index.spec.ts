import type { ChartAxe } from '../CustomChart/model/plugin.types';

import CustomAxes from './index';
import { getDefaultConfig } from '../CustomChart/model/getDefaultConfig';

const config = getDefaultConfig();
const axe = (type: string): ChartAxe => config.axes.find((item) => item.type === type) as ChartAxe;
const axisNames = {
  values: 'Значения',
  categories: 'Категории',
  series: 'Серии',
  details: 'Детализация',
  filters: 'Фильтры',
};
const componentType = 'CustomChart0';
const field = { id: 'f1', name: 'Цена', type: 'number' };

describe('CustomAxes — набор методов', () => {
  it('реализует десять методов контракта', () => {
    expect(Object.keys(CustomAxes).sort()).toEqual(
      [
        'getAxeIconColor',
        'getAxeName',
        'isDisabledAxe',
        'isVisibleAxe',
        'isVisibleAxeDragItemElement',
        'isVisibleAxeDragItemMenuOption',
        'isVisibleField',
        'renderAxeIcon',
        'renderAxeToggle',
        'sortAxes',
      ].sort(),
    );
  });

  it('getPillTypeOptions не реализован — ядро оставляет свой список типов пилюль', () => {
    expect('getPillTypeOptions' in CustomAxes).toBe(false);
  });
});

describe('CustomAxes — значения методов', () => {
  it('показывает все пять полок', () => {
    config.axes.forEach((item) => {
      expect(CustomAxes.isVisibleAxe?.({ axe: item, config })).toBe(true);
    });
  });

  it('sortAxes отдаёт пустую панель осей — заготовка под заполнение', () => {
    const sorted = CustomAxes.sortAxes?.({ config, component: { type: componentType, config }, axisNames });
    expect(sorted).toEqual([]);
  });

  it('ни одна полка не заблокирована', () => {
    expect(CustomAxes.isDisabledAxe?.({ axe: axe('values'), field, fieldIndex: 0, config, componentType })).toBe(false);
  });

  it('показывает все пилюли', () => {
    expect(CustomAxes.isVisibleField?.({ axe: axe('values'), field, config, componentType })).toBe(true);
  });

  it('подпись полки берётся из карты имён ядра', () => {
    expect(CustomAxes.getAxeName?.({ axe: axe('categories'), config, componentType, axisNames })).toBe('Категории');
  });

  it('подпись отсутствующей в карте полки — пустая строка', () => {
    const unknownAxe = {
      type: 'unknown',
      name: '',
      title: '',
      selectedFieldIndex: 0,
      fields: [],
    } as unknown as ChartAxe;
    expect(CustomAxes.getAxeName?.({ axe: unknownAxe, config, componentType, axisNames })).toBe('');
  });

  it('цвет иконки — белый', () => {
    expect(CustomAxes.getAxeIconColor?.({ axe: axe('values'), field, config, componentType })).toBe('white');
  });

  it('иконка есть у values и categories, для остальных полок — null', () => {
    const HsMuiFontIcon = () => null;
    const HsMuiSvgIcon = () => null;
    expect(
      CustomAxes.renderAxeIcon?.({
        axe: axe('values'),
        field,
        config,
        componentType,
        axisNames,
        HsMuiFontIcon,
        HsMuiSvgIcon,
      }),
    ).not.toBeNull();
    expect(
      CustomAxes.renderAxeIcon?.({
        axe: axe('categories'),
        field,
        config,
        componentType,
        axisNames,
        HsMuiFontIcon,
        HsMuiSvgIcon,
      }),
    ).not.toBeNull();
    expect(
      CustomAxes.renderAxeIcon?.({
        axe: axe('series'),
        field,
        config,
        componentType,
        axisNames,
        HsMuiFontIcon,
        HsMuiSvgIcon,
      }),
    ).toBeNull();
  });

  it('полка значений получает штатный переключатель ядра', () => {
    const toggles = { valuesToggle: 'V', seriesToggle: 'S' };
    expect(CustomAxes.renderAxeToggle?.({ axe: axe('values'), field, config, componentType, ...toggles })).toBe('V');
    expect(CustomAxes.renderAxeToggle?.({ axe: axe('series'), field, config, componentType, ...toggles })).toBe('S');
    expect(CustomAxes.renderAxeToggle?.({ axe: axe('details'), field, config, componentType, ...toggles })).toBeNull();
  });

  it('элементы пилюли и пункты её меню скрыты — стартовое состояние заглушки', () => {
    expect(
      CustomAxes.isVisibleAxeDragItemElement?.({ field, config, componentType, elementName: 'renderSortSelector' }),
    ).toBe(false);
    expect(
      CustomAxes.isVisibleAxeDragItemMenuOption?.({ field, config, componentType, optionName: 'renderSortMenuItem' }),
    ).toBe(false);
  });

  it('ни один реализованный метод не возвращает undefined', () => {
    const context = {
      axe: axe('values'),
      field,
      fieldIndex: 0,
      config,
      componentType,
      axisNames,
      component: { type: componentType, config },
      elementName: 'renderSortSelector',
      optionName: 'renderSortMenuItem',
      valuesToggle: 'V',
      seriesToggle: 'S',
      HsMuiFontIcon: () => null,
      HsMuiSvgIcon: () => null,
    };

    Object.entries(CustomAxes).forEach(([name, method]) => {
      expect([name, (method as (props: unknown) => unknown)(context)]).not.toEqual([name, undefined]);
    });
  });
});
