import type { CustomSettingsProps } from '../../types/chartPlugin';

/**
 * Правая панель редактора. Заглушка: у шаблона пока нет ни одной своей настройки, поэтому
 * панель не рендерит ничего.
 *
 * Ядро передаёт компоненту `component` (с `type`, `config`, `spec`, `configDraft`), `changeChart`,
 * `data`, `reportOptions`, `reportlist` и `pluginImports` — три раздела:
 * - `pluginImports.sections` — готовые секции ядра (`DataOptionsContent`, `FilterModeOptionsContent`,
 *   `DrillOutOptionsContent`, `DescriptionOptionsContent`, `OutlineOptionsContent`…), их достаточно
 *   отрисовать как есть;
 * - `pluginImports.components` — UI-примитивы (`SettingsSection`, `SettingsItem`, `SettingsToggle`,
 *   `SettingsSlider`, `SettingsColorPicker`, `SettingsMultiselect`…), из них строятся собственные
 *   секции плагина;
 * - `pluginImports.services` — сервисы ядра, в частности сервис модальных окон.
 *
 * Заводя первую настройку, собери панель из этих частей: свои секции — в `src/modules/CustomSettings/sections/`,
 * получают `component`, `changeChart` и `components` пропом; готовые секции ядра — из `sections`
 * рядом с ними. Пример структуры:
 *
 * ```tsx
 * const { sections = {}, components = {} } = pluginImports || {};
 * return (
 *   <>
 *     {sections.DataOptionsContent}
 *     <FirstSection component={component} changeChart={changeChart} components={components} />
 *     {sections.DescriptionOptionsContent}
 *   </>
 * );
 * ```
 *
 * Пошаговый шаблон первой секции и первой записи в таблице команд редьюсера — в скилле `new-setting`.
 */
export default function Settings(_props: CustomSettingsProps) {
  return null;
}

// Имя функции переживает минификацию только в `displayName`: в бандле оно однобуквенное,
// и без этой строки компонент виден в React DevTools как `t` или `e`.
Settings.displayName = 'Settings';
