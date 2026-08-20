import type { CustomReducersOptions, PluginAction, PluginState } from '../../types/chartPlugin';

/**
 * Обработчик действия `CHANGE_CUSTOM_CHART_N`. Заглушка: у шаблона пока нет ни одной настройки,
 * поэтому редьюсер возвращает состояние без изменений.
 *
 * Рабочая версия строится вокруг таблицы «команда → путь в конфиге» — веток
 * `if (action.command === ...)` в редьюсере быть не должно, новая настройка добавляется
 * строкой в эту таблицу и пунктом в секции панели настроек:
 *
 * ```ts
 * // Вложенные поля конфига пишутся через точку: `'outline.width'`.
 * export const COMMANDS: Record<string, string> = {
 *   TOGGLE_LEGEND: 'legend.visible',
 * };
 *
 * const setByPath = (target: Record<string, unknown>, path: string, value: unknown): void => {
 *   const keys = path.split('.');
 *   const last = keys.pop() as string;
 *   const parent = keys.reduce<Record<string, unknown>>((node, key) => {
 *     if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
 *     return node[key] as Record<string, unknown>;
 *   }, target);
 *   parent[last] = value;
 * };
 *
 * export default function changeCustomChartReducer(
 *   state: PluginState,
 *   action: PluginAction,
 *   options: CustomReducersOptions,
 * ): PluginState {
 *   const path = COMMANDS[action?.command];
 *   if (!path) return state;
 *
 *   const configDraft = structuredClone(state.component.configDraft);
 *   setByPath(configDraft, path, action?.settings?.value);
 *
 *   const nextState = {
 *     ...state,
 *     component: { ...state.component, configDraft },
 *   };
 *
 *   // Обязательно: без autoApplySettings правка осядет в configDraft и не доедет до компонента.
 *   // Это функция ядра, а не флаг — она же учитывает режим ручного применения (manualApplySettings),
 *   // помечая черновик как dirty вместо немедленного применения.
 *   return options.autoApplySettings(nextState);
 * }
 * ```
 */
export default function changeCustomChartReducer(
  state: PluginState,
  _action: PluginAction,
  _options: CustomReducersOptions,
): PluginState {
  return state;
}
