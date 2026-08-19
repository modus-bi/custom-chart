import React from 'react';

import type {
  AxeNameContext,
  CustomAxesModule,
  DisabledAxeContext,
  AxeFieldContext,
  PluginAxis,
  RenderAxeIconContext,
  RenderAxeToggleContext,
  SortAxesContext,
  VisibleAxeContext,
  VisibleAxeDragItemElementContext,
  VisibleAxeDragItemMenuOptionContext,
} from '../../types/chartPlugin';
import type { ReactNode } from 'react';

/**
 * Настройка панели осей редактора.
 *
 * Все методы контракта необязательны, но отсутствующий метод возвращает `undefined`, а это
 * для большинства из них означает не «поведение по умолчанию», а «пусто»: полка без имени,
 * скрытая пилюля, пустая панель осей. Поэтому шаблон реализует десять методов из одиннадцати.
 *
 * Одиннадцатый — `getPillTypeOptions` — единственный, чьё отсутствие штатно означает
 * «использовать список ядра», и потому намеренно не реализован. Плагину, сужающему список
 * типов пилюль, метод нужно добавить самому — значения ниже условный пример формы результата,
 * а не готовый список: набор типов пилюль определяет сам плагин.
 *
 * ```ts
 * getPillTypeOptions: ({ axisName }) =>
 *   axisName === 'values'
 *     ? [
 *         { name: 'Значение', value: 'value' },
 *         { name: 'Подсказка', value: 'tooltip' },
 *       ]
 *     : [];
 * ```
 */
const CustomAxes: CustomAxesModule = {
  isVisibleAxe: (_props: VisibleAxeContext): boolean => true,

  // Пустой массив означает пустую панель осей — заполни под свои полки (порядок и состав из
  // `config.axes`), иначе редактор выглядит сломанным.
  sortAxes: (_props: SortAxesContext): PluginAxis[] => [],

  isDisabledAxe: (_props: DisabledAxeContext): boolean => false,

  isVisibleField: (_props: AxeFieldContext): boolean => true,

  /** Имя полки берётся из карты ядра. */
  getAxeName: ({ axe, axisNames }: AxeNameContext): string => axisNames?.[axe?.type] || '',

  /** Иконки ядра по типу полки; для полок вне карты — `null`, а не `undefined` (см. комментарий выше). */
  renderAxeIcon: ({ axe, axisNames, HsMuiFontIcon }: RenderAxeIconContext): ReactNode => {
    const icons: Partial<Record<string, ReactNode>> = {
      categories: (
        <HsMuiFontIcon
          className='fa fa-bars'
          title={axisNames?.categories}
          style={{ transform: 'rotate(90deg)' }}
        />
      ),
      values: (
        <HsMuiFontIcon
          className='fa fa-bars'
          title={axisNames?.values}
        />
      ),
    };
    return icons[axe?.type] ?? null;
  },

  getAxeIconColor: (_props: AxeFieldContext): string => 'white',

  /** Штатные переключатели ядра приходят готовыми — плагин только выбирает, где их показать. */
  renderAxeToggle: ({ axe, valuesToggle, seriesToggle }: RenderAxeToggleContext): ReactNode => {
    switch (axe?.type) {
      case 'values':
        return valuesToggle;
      case 'series':
        return seriesToggle;
      case 'categories':
      case 'details':
      case 'filters':
      default:
        return null;
    }
  },

  /**
   * Видимость элемента внутри пилюли. Ниже перечислены все значения `elementName`, которые
   * присылает ядро: чтобы показать элемент, верни для его ветки `true`.
   */
  isVisibleAxeDragItemElement: ({ elementName }: VisibleAxeDragItemElementContext): boolean => {
    switch (elementName) {
      case 'renderSortSelector':
      case 'renderAggregationSelector':
      default:
        return false;
    }
  },

  /**
   * Видимость пункта меню пилюли. Ниже перечислены все значения `optionName`, которые присылает
   * ядро: чтобы показать пункт, верни для его ветки `true`.
   *
   * Ядро зовёт метод порядка 28 раз за один рендер меню — по разу на пункт, поэтому тело
   * должно оставаться дешёвым: без обхода конфига и без создания объектов.
   */
  isVisibleAxeDragItemMenuOption: ({ optionName }: VisibleAxeDragItemMenuOptionContext): boolean => {
    switch (optionName) {
      case 'renderAddToTableToggle':
      case 'renderAddToTooltipToggle':
      case 'renderAggregationForSortBy':
      case 'renderAggregationMenuItem':
      case 'renderCalcHideResult':
      case 'renderCalcLevel':
      case 'renderColorBySelector':
      case 'renderColorFromDataToggle':
      case 'renderControllingFilterMenuItem':
      case 'renderDerivedFieldToggle':
      case 'renderDerivedFilterFieldSelector':
      case 'renderDoShowTitleCheckbox':
      case 'renderDrillLevelOnly':
      case 'renderEditCalcMenuItem':
      case 'renderFilterLevel':
      case 'renderFilterSqlType':
      case 'renderListFieldSelector':
      case 'renderMdxLevelSelector':
      case 'renderNameBy':
      case 'renderOrderIndexSelector':
      case 'renderPillType':
      case 'renderSheetSelector':
      case 'renderSortBySelector':
      case 'renderSortMenuItem':
      case 'renderSubAllAggregationMenuItem':
      case 'renderTitleInput':
      case 'renderTooltipBy':
      default:
        return false;
    }
  },
};

export default CustomAxes;
