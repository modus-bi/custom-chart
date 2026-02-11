# Plugins API

## 1. Версии

- **Версия Plugins API:** `0.3`
- **Версия ядра:** `3.9.1`
- **Node.js:** `12.12`
- **React:** `16.13.1`
- **ECharts:** `5.6-custom (bar + treemap)`

---

## 2. Экспорт

```js
{
  CustomChart,      // модуль диаграммы
  CustomReducers,   // модуль редьюсеров
  CustomSettings,   // модуль настроек
  CustomAxes,       // модуль панели осей
  DataAdaptor,      // адаптер данных
  SpecGenerator,    // генератор спецификации
  ConfigEditor     // редактор конфига
}
```

---

## 3. Импорт

### 3.1 CustomChart

```js
{
  id,
  componentId,
  type,
  config,
  cacheId,
  data,
  datasets,
  reportOptions,
  editorActive,
  mainMenuActive,
  drillDownActive,
  datas,
  inEditor,
  skipRender,
  getCacheId,
  globals,
  hsTheme,
  locale,

  loadDatas,
  reloadDatas,
  drillDown,
  setCursorHovered,
  setCursorClicked,
  changeFilterCategories,
  changeMultipleGlobalFilterValueAndApply,

  pluginImports: {
    components: {
      LoadProgress,        // компонент лоадера
      CommonDataAdaptor   // базовый класс дата-адаптера
    },
    helpers: {
      getCacheId          // функция вычисления cacheId
    },
    sections: {
      // секции интерфейса без изменений
    }
  }
}
```

---

### 3.2 CustomReducers

```js
{
  changeCustomChart(command, settings) // универсальный экшен
}
```

---

### 3.3 CustomSettings

```js
{
  component,
  reportlist,
  hsTheme,
  locale,

  changeChart,

  pluginImports: {
    sections: {
      autoApplyToggleContent,
      showTitleToggleContent,
      titleTextFieldContent,
      containerMarginSettingsContent,
      precisionSliderContent,
      suffixSelectContent,
      DataOptionsContent,
      FilterModeOptionsContent,
      DrillOptionsContent,
      DrillOutOptionsContent,
      DescriptionOptionsContent,
      OutlineOptionsContent,
    },
    components: {
      SettingsToggle,
      SettingsSection,
      SettingsItem,
      SettingsTextField,
      SettingsMultiselect,
      SettingsSlider,
      SettingsCheckbox,
      SettingsColorPicker,
      SettingsSubheader,
      LoadProgress,
      NoTranslationFlag,
      ProgressBar,
      ReactSuperSelect,
      Relect,
    }
  }
}
```

---

### 3.4 CustomAxes

```js
{
  isVisibleAxeDragItemMenuOption(config, field, componentType, optionName),
  isVisibleAxeDragItemElement(componentType, config, field, elementName),
  sortAxes(config, component, axisNames),
  isVisibleAxe(axe, config),
  isDisabledAxe(axe, field, fieldIndex, config, componentType),
  getAxeName(axe, config, componentType, axisNames),
  getAxeIconColor(axe, field, config, componentType),
  renderAxeIcon(
    axe,
    field,
    config,
    componentType,
    axisNames,
    HsMuiFontIcon,
    HsMuiSvgIcon
  ),
  renderAxeToggle(
    axe,
    field,
    config,
    componentType,
    valuesToggle,
    seriesToggle
  ),
  isVisibleField(axe, field, config, componentType),
}
```

---

#### 3.4.1 optionNameType
*Типы опций выпадающего меню «пилюли»*

```ts
type optionNameType =
  | 'renderAddToTableToggle'
  | 'renderAddToTooltipToggle'
  | 'renderAggregationForSortBy'
  | 'renderAggregationMenuItem'
  | 'renderCalcHideResult'
  | 'renderCalcLevel'
  | 'renderColorBySelector'
  | 'renderColorFromDataToggle'
  | 'renderControllingFilterMenuItem'
  | 'renderDerivedFieldToggle'
  | 'renderDerivedFilterFieldSelector'
  | 'renderDoShowTitleCheckbox'
  | 'renderDrillLevelOnly'
  | 'renderEditCalcMenuItem'
  | 'renderFilterLevel'
  | 'renderFilterSqlType'
  | 'renderListFieldSelector'
  | 'renderMdxLevelSelector'
  | 'renderNameBy'
  | 'renderOrderIndexSelector'
  | 'renderPillType'
  | 'renderSheetSelector'
  | 'renderSortBySelector'
  | 'renderSortMenuItem'
  | 'renderSubAllAggregationMenuItem'
  | 'renderTitleInput'
  | 'renderTooltipBy'
```

---

#### 3.4.2 elementNameType
*Типы элементов тела «пилюли»*

```ts
type elementNameType =
  | 'renderSortSelector'
  | 'renderAggregationSelector'
```

---

## 4. Externals

```js
{
  React,             // react v16.13.1
  ReactDOM,          // react-dom v16.13.1
  ReactDOMServer,    // react-dom/server v16.13.1
  ReactTestUtils,    // react-dom/test-utils v16.13.1
  echarts: 'echarts' // echarts v5.6-custom (bar + treemap)
}
```
