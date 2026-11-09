# Карта проекта и исходные условия

База адаптации: `modus-bi/custom-chart`, коммит
`fb5efa5ba9e8794b2265f100091cddb19911e9b6`. Это версия шаблона, а не версия ядра пользователя.
В его снимке контракта указаны `contractVersion: 1.0.0`, `coreVersion: 3.16.3`.
Наблюдения о runtime в справочниках унаследованы из исходной документации; сверяй их с
целевой сборкой, если поведение расходится. Формальные сигнатуры определяет актуальный `.d.ts`,
неформализованные структуры — наблюдаемый ответ и код соответствующего ядра.

## Сборка

- `package.json`: Node >=22.15.0, npm >=10; React/ReactDOM 16.14, webpack 5, SWC,
  TypeScript strict, Jest 30, Testing Library React 12, ESLint flat config и Prettier.
- `npm run build` → `build/custom_chart_0.js`, UMD `CustomChart0`.
- `npm run build:dev` — диагностическая сборка; `npm start` — dev-сервер, порт 7000
  или переменная `PORT`, `/plugins/custom_chart_0.js` с HMR поверх статики `prebuild/`.
- `npm run build:plugin` → `<manifest.name>.tar.gz`. Сборщик читает `build/manifest.json`.
- Внешние runtime-модули шаблона: только `react: React`, `react-dom: ReactDOM`.
  SCSS/CSS включаются через `style-loader` в JS: отдельный CSS портал не подключает.
- SWC собирает JSX classic; настройки общие для webpack и Jest в `swc.config.js`.
- Jest по умолчанию работает в `node`, спеки `*.spec.[jt]s?(x)` рядом с кодом.
  Компонентные спеки включают `/** @jest-environment jsdom */`.

## Семь экспортов

| Экспорт | Назначение |
| --- | --- |
| CustomChart | React-компонент со статическим getDefaultConfig(), доступным до рендера |
| CustomReducers | `(state, action, { autoApplySettings }) => state` |
| CustomSettings | Правая панель редактора |
| CustomAxes | Настройка полок и пилюль |
| DataAdaptor | `new DataAdaptor(data, config, spec, cacheId)` |
| SpecGenerator | `new SpecGenerator(type)` |
| ConfigEditor | `new ConfigEditor()` |

Контроль фактических экспортов, включая удаление строки `export`:

```ts
import type { ChartPluginModule } from './types/chartPlugin';
import type * as Self from './index';
type AssertAssignable<T, U extends T> = U;
export type ContractCheck = AssertAssignable<ChartPluginModule, typeof Self>;
```

Эта проверка доказывает наличие и совместимость обязательных членов, **не запрещает лишние
экспорты**. Набор runtime-экспортов сверяй отдельно. Тип `ContractCheck` в runtime не существует.

## Заглушки нового шаблона

1. `ConfigEditor.addField/addAllFields/updateField` возвращают конфиг без изменений:
   поле не сохраняется на полке, `getDatasetId` не находит датасет, запрос не вызывается.
2. `CustomAxes.sortAxes` возвращает `[]`: панель полок пуста.
3. `DataAdaptor.getQueryObjects`, `refresh`, `aggregateBypass`, `remapData` не реализуют
   полный путь данных; `plotData` пуст.
4. `CustomSettings` возвращает `null`, редьюсер — исходное состояние.
5. `CustomChart` рисует контейнер с `data-size`/`data-rows`, без визуализации и оболочки.

В новом плагине устраняй заглушки по необходимому пути поведения. При ревью самого шаблона
называй их заготовками, а не внезапными регрессиями. Не заменяй рабочие реализации другого
плагина шаблонными заглушками.

`defaultConfig.json` хранит параметры и пять полок `values/categories/series/details/filters`.
`ChartConfig` в `model/plugin.types.ts` описывает читаемые поля; `filters` и `rowsLimit`
в типе есть, в JSON исходника отсутствуют. `getDefaultConfig` возвращает независимую копию
данных, поскольку ядро может её менять. Не клонируй вместе с конфигом функции, React-элементы
или инстансы движка через `structuredClone`.

## Источники при диагностике

Читайте локальные `prebuild/api/chartPlugin.d.ts`, `version.json`, снимок `src/types/`,
соответствующий `src/` и `docs/api`. Последний — исторический неформальный конспект, полезный
для props и инжектов. Поиск в минифицированных бандлах ограничивай выражением/контекстом:
`rg -o 'splitTraces=.{0,700}' prebuild -g '*.js'`; не выводи весь однострочный бандл.
Не печатай целиком конфиг портала или пользовательскую выборку: для фикстуры нужны только
обезличенные относящиеся к сценарию поля, без токенов и персональных данных.
