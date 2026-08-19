/**
 * Публичный контракт плагина: ядро импортирует каждый из семи экспортов статически,
 * поэтому отсутствующий экспорт ломает не первое обращение к нему, а соответствующую
 * часть редактора целиком.
 */
import type { ChartPluginModule } from './types/chartPlugin';

/** Самоссылка: `Self` — тип этого же модуля, то есть фактический набор экспортов ниже. */
import type * as Self from './index';

export { default as CustomChart } from './modules/CustomChart/CustomChart';
export { default as CustomReducers } from './modules/CustomReducers/changeCustomChartReducer';
export { default as CustomSettings } from './modules/CustomSettings/Settings';
export { default as CustomAxes } from './modules/CustomAxes';
export { default as DataAdaptor } from './modules/CustomChart/dataAdaptor';
export { default as SpecGenerator } from './modules/CustomChart/specGenerator';
export { default as ConfigEditor } from './modules/CustomChart/configEditor';

/**
 * Проверка соответствия контракту на этапе компиляции. Рантайм-кода не порождает.
 *
 * Проверяется сам список экспортов модуля (`typeof Self`): удалённая строка `export` роняет
 * `npm run typecheck` с `TS2344: Property '…' is missing`, экспорт неподходящего типа — с
 * `TS2344` о несовместимости.
 *
 * Проверку выполняет ограничение параметра типа (`U extends T`) — компилятор сверяет его при
 * каждом инстанцировании `AssertAssignable`, поэтому расхождение видно на объявлении
 * `ContractCheck` ниже.
 */
type AssertAssignable<T, U extends T> = U;

export type ContractCheck = AssertAssignable<ChartPluginModule, typeof Self>;
