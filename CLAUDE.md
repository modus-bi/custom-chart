# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Что это

Шаблон плагина для BI-платформы **ModusBI**. Собирается webpack'ом в единый UMD-бандл `build/custom_chart_0.js` (library `CustomChart0`), который загружается ядром платформы. В `externals` только `react` и `react-dom` — их предоставляет ядро. Библиотеку отрисовки шаблон не выбирает: `CustomChart` рендерит пустой контейнер вместо диаграммы (подробности — в разделе «Поток данных», предупреждение про выбор библиотеки — в «Соглашениях»). Панель настроек и редьюсер команд — тоже заглушки: своих настроек у шаблона нет.

## Источник истины по контракту с ядром

**`prebuild/api/chartPlugin.d.ts`** — формальный контракт: обязательные экспорты, сигнатуры методов, что ядро фактически передаёт в каждый. Рядом `README.md` (пояснения) и `version.json` (сейчас `contractVersion 1.0.0`, `coreVersion 3.16.3`). Файл едет вместе со сборкой ядра, поэтому появляется только после распаковки ядра в `prebuild/` (папка в `.gitignore`); свежая версия — по адресу `<адрес портала>/api/chartPlugin.d.ts`. **Перед любой правкой контрактных экспортов читать этот файл, а не догадываться.**

Контракт намеренно не раскрывает внутренние структуры (`config`, `field`, `axe`, `spec`, `data`, состояние редактора) — в ядре они на нетипизированном JS, все объявлены как `any`-псевдонимы. Их фактическую форму смотреть по коду плагина и по [defaultConfig.json](src/modules/CustomChart/defaultConfig.json).

Копия контракта лежит в [src/types/chartPlugin.d.ts](src/types/chartPlugin.d.ts) — импортируется как `import type { ... } from '../types/chartPlugin'` (в бандл типы не попадают). Файл — снимок конкретной версии контракта на момент копирования; при обновлении ядра сверять с актуальным `prebuild/api/chartPlugin.d.ts` и переносить изменения вручную. Проверка расхождения — скилл [`sync-contract`](.claude/skills/sync-contract/SKILL.md).

[docs/api](docs/api) в корне репозитория — более старый неформальный конспект. Он всё ещё полезен тем, чего в `.d.ts` нет: перечнем props и инжектов, которые ядро передаёт `CustomChart` (`datas`, `loadDatas`, `drillDown`, `changeMultipleGlobalFilterValueAndApply`, `hsTheme`, `commonWidgets`…), и списками конкретных имён секций/виджетов. При расхождении верить `.d.ts`.

## Команды

```bash
npm start
```

Dev-сервер (webpack-dev-server 6) на порту 7000 по умолчанию (переменная окружения `PORT` меняет порт — см. [webpack.config.js](webpack.config.js)). Требует распакованное **ядро ModusBI** в `prebuild/` — `devServer.static` раздаёт `prebuild/` статикой, а сам webpack-dev-server собирает и отдаёт `/plugins/custom_chart_0.js` на лету с HMR. Без `prebuild/` запуск бесполезен (и `prebuild/api/` тоже недоступен).

```bash
npm run build
```

Продакшен-сборка (`webpack --mode production`). `npm run build:dev` — несжатая сборка в режиме разработки.

```bash
npm run build:plugin
```

Создаёт дистрибутив `<manifest.name>.tar.gz`: копирует `build/custom_chart_0.js` → `plugin.js`, заменяет в первых 1000 символах `CustomChart0` на плейсхолдер `CustomChartNNN`, архивирует вместе с манифестом. Подстановку реального имени класса выполняет ядро по правилу `ReplacementInTheBody` из манифеста. Перед запуском положить `build/manifest.json` — шаблон в [manifest.example.json](manifest.example.json).

```bash
npm test
npm run test:watch
npx jest -t "имя теста"
npm run typecheck   # tsc --noEmit
```

Jest (v30, на `@swc/jest`, `testEnvironment: node`) подхватывает `*.spec.{js,jsx,ts,tsx}`. Спеки лежат рядом с кодом, не в `__tests__/`. Сейчас в репозитории только спеки каркаса: модель конфига (`getDefaultConfig`), `changeCustomChartReducer`, `DataAdaptor`, `ConfigEditor`, `CustomAxes`, `CustomChart`, `useChartSize`. Число спеков не фиксируем — оно растёт вместе с настройками нового плагина. Скрипт `test` запускается с `--passWithNoTests`: прогон не падает, когда спеков нет вовсе.

Разработка идёт через TDD двумя сабагентами с непересекающимися правами — см. скилл `/tdd` в [.claude/skills/tdd](.claude/skills/tdd/SKILL.md).

Компонентные тесты возможны — стоят `@testing-library/react@12` (версия под React 16) и `jest-environment-jsdom`. Глобальное окружение остаётся `node`, поэтому спек с рендером открывается docblock'ом `/** @jest-environment jsdom */`; правки `jest.config.js` это не требует. UI-примитивы ядра приходят через проп `pluginImports` и в тестах заменяются заглушками.

Типы jest подключены через `types: ["jest"]` в [tsconfig.json](tsconfig.json). Поле задано явно: без него `tsc` не подхватывает `@types/*` автоматически и падает на `describe` с `TS2593`. Указание `types` отключает автоподключение остальных глобальных типов — при добавлении пакета с глобальными объявлениями его надо вписать в этот массив.

```bash
npm run lint
```

ESLint 10, flat config ([eslint.config.js](eslint.config.js)): `@eslint/js` + `typescript-eslint` recommended и `eslint-config-prettier` последним звеном, чтобы не конфликтовать с форматированием. `lint-staged` + husky (`.husky/pre-commit`) гоняют `prettier --write` и `eslint --max-warnings=0` на стейджинге. Prettier настроен ([.prettierrc](.prettierrc): 120 колонок, одинарные кавычки в т.ч. в JSX, trailing commas).

## Архитектура

### Семь экспортов — весь API плагина

[src/index.ts](src/index.ts) отдаёт ровно семь именованных экспортов; ядро импортирует каждый **статически**, поэтому отсутствующий экспорт ломает не первое обращение к нему, а соответствующую часть редактора целиком. Соответствие контракту `ChartPluginModule` проверяет тип `ContractCheck` в том же файле — расхождение роняет `npm run typecheck`, а не рантайм. Проверяется сам список экспортов (`import type * as Self from './index'`, самоссылка на модуль), поэтому удалённая строка `export` тоже даёт `TS2344`.

| Экспорт          | Как ядро его использует                                                                                   | Реализация                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `CustomChart`    | React-компонент + статический `getDefaultConfig()`, вызываемый при создании компонента до первого рендера | [CustomChart.tsx](src/modules/CustomChart/CustomChart.tsx)                            |
| `CustomReducers` | `(state, action, { autoApplySettings }) => state` под ключом `CHANGE_CUSTOM_CHART_N`                      | [changeCustomChartReducer.ts](src/modules/CustomReducers/changeCustomChartReducer.ts) |
| `CustomSettings` | компонент правой панели редактора                                                                         | [Settings.tsx](src/modules/CustomSettings/Settings.tsx)                               |
| `CustomAxes`     | объект с методами настройки панели осей                                                                   | [CustomAxes/index.tsx](src/modules/CustomAxes/index.tsx)                              |
| `DataAdaptor`    | `new DataAdaptor(data, config, spec, cacheId)` на каждый пересчёт данных                                  | [dataAdaptor.ts](src/modules/CustomChart/dataAdaptor.ts)                              |
| `SpecGenerator`  | `new SpecGenerator(type)` на каждый запрос                                                                | [specGenerator.ts](src/modules/CustomChart/specGenerator.ts)                          |
| `ConfigEditor`   | `new ConfigEditor()` без аргументов                                                                       | [configEditor.ts](src/modules/CustomChart/configEditor.ts)                            |

Тип компонента — строка `CustomChart0`…`CustomChart40` (плюс `CustomChartGraph`), подключается алиасом `custom-chart-N`. Бандл собирается один раз как `CustomChart0`; имя на реальный тип компонента меняется в два шага двумя разными сторонами: `create-plugin.js` при сборке дистрибутива подменяет `CustomChart0` → `CustomChartNNN` (плейсхолдер) в первых 1000 символах бандла, а ядро при установке плагина на портал заменяет `CustomChartNNN` на реальное имя класса по правилу `ReplacementInTheBody` из манифеста.

### Поток данных

```
config (полки, поля) → getQueryObjects → loadDatas (ядро) → props.data → DataAdaptor.remapData → plotData → CustomChart
```

Цепочку крутит сам компонент, а не ядро: **готового адаптора и готового `plotData` в props нет**. Ядро отдаёт сырой ответ бэкенда в `data` (`{ fetching, data }`), а адаптор каждый компонент строит сам и держит в своём состоянии — так устроен и штатный хост плагинных типов в ядре (метод `getChartData` в `prebuild/app.*.js`). [CustomChart.tsx](src/modules/CustomChart/CustomChart.tsx) повторяет эту механику: определяет `datasetId` (`getDatasetId`), собирает `queryObjects` (`DataAdaptor.getQueryObjects`), пока `data` нет — зовёт инжект `loadDatas(datasetId, null, config.filters, queryObjects, { editor, componentId })` (пять аргументов, второй всегда `null`), а после ответа строит адаптор через [ComponentTypeManager](src/managers/ComponentTypeManager.ts), как ядро (`new Manager(type).getDataAdaptor(data, config, spec, cacheId)`). Конструктор `DataAdaptor` сам зовёт `refresh` → `remapData`, поэтому `plotData` готов сразу после `new`; пересборка идёт только при смене данных или конфига, а не на каждый рендер.

`getQueryObjects` и `remapData` в [dataAdaptor.ts](src/modules/CustomChart/dataAdaptor.ts) — заглушки: форма цепочки загрузки собрана, содержания в ней нет. Это **обязательный пункт** доработки нового плагина:

- `getQueryObjects(config)` должен собрать из полок конфига описание запроса к бэкенду — какие поля идут в `select`, что в `group by`, какие фильтры и агрегации применить. Пока метод возвращает пустой массив, `loadDatas` уходит с пустым запросом и данных не будет.
- `remapData(config)` должен привести `this.aggregated` (массив трейсов, по одному на пилюлю полки «Значения») к строкам `plotData`, которые понимает отрисовка. Первое, обо что спотыкаются: ключи ответа бэкенда приходят алиасами вида `[categories]`, `[details]`, `[categories][0]` — скобки ядро снимает только у части из них (`categories`, `series`, `identity`, `linkage`, `node`), остальные остаются с квадратными скобками в имени ключа.

Полученный `plotData` лежит в состоянии адаптора компонента, но на экран сейчас не выводится — `CustomChart` рендерит пустой `div` с отладочными атрибутами `data-size` (размер из `useChartSize`) и `data-rows` (число строк `plotData`, пока всегда `0` — `remapData` заглушка), это не визуализация, а след для DevTools. Подключая свою библиотеку отрисовки вместо пустого контейнера, сохрани три вещи, на которые уже завязан компонент: контейнер с `ref`, размер из [useChartSize](src/modules/CustomChart/useChartSize.ts) (библиотеке отрисовки он обычно нужен для `resize()`) и работу с данными в эффекте — запрос через `loadDatas` и сборку адаптора из `props.data`.

### Конфигурация компонента

[defaultConfig.json](src/modules/CustomChart/defaultConfig.json) — форма `config`, которую ядро хранит в отчёте и отдаёт обратно: плоский объект с параметрами компонента (`title`, `chartType`, `precision`, `margin`, `outline`…) плюс массив `axes` — пять полок, каждая со своим `type`: `values`, `categories`, `series`, `details`, `filters`. Ёмкость полки задаёт её `selectedFieldIndex`: `-2` — несколько пилюль, `0` — ровно одна, `-1` — полка отключена. Изменения дефолтов надо согласовывать с `CustomAxes` — там же читаются те же поля осей.

Типизированное зеркало этой формы — `ChartConfig` в [plugin.types.ts](src/modules/CustomChart/plugin.types.ts). Два поля объявлены в типе, но в JSON их нет: `filters` (значения фильтров компонента — их наполняет редактор, а ядро кладёт третьим аргументом в `loadDatas`) и `rowsLimit`. Дефолты отдаёт [getDefaultConfig.ts](src/modules/CustomChart/getDefaultConfig.ts) — свежей копией через `structuredClone` на каждый вызов: ядро вправе править полученный объект.

### CustomAxes: «необязательно» ≠ «по умолчанию»

Все 11 методов модуля контрактно необязательны, но отсутствующий метод возвращает `undefined`, что для большинства означает **«пусто»** — полка без имени, скрытая пилюля, пустая панель осей. Ядро не падает, в dev-сборке пишет предупреждение в консоль, а редактор выглядит сломанным. Шаблон реализует десять методов из одиннадцати ([CustomAxes/index.tsx](src/modules/CustomAxes/index.tsx)).

Единственное исключение — `getPillTypeOptions`: по контракту его отсутствие корректно означает «использовать штатный список ядра», поэтому шаблон намеренно его не реализует. Плагину, сужающему список типов пилюль, метод нужно добавить — пример вида в комментарии над `CustomAxes` в том же файле.

`isVisibleAxe` — единственный метод осей, которому ядро не передаёт `componentType`. `isVisibleAxeDragItemMenuOption` вызывается порядка 28 раз за один рендер меню пилюли — держать её дешёвой.

### Настройки → редьюсер

У шаблона пока нет ни одной своей настройки: [Settings.tsx](src/modules/CustomSettings/Settings.tsx) рендерит `null`, а [changeCustomChartReducer.ts](src/modules/CustomReducers/changeCustomChartReducer.ts) возвращает состояние без изменений. Оба файла несут комментарий с рабочей версией — по нему восстанавливается механика.

Механика (когда настройка появится): компоненты в `src/modules/CustomSettings/` не мутируют config сами — они вызывают `changeChart('<command>', { value })`, а редьюсер обрабатывает строковую команду через таблицу «команда → путь в конфиге» (`COMMANDS`, без веток `if`), правя копию `component.configDraft`.

**Результат обязан пройти через `options.autoApplySettings(state)`** — это функция ядра, а не флаг: без неё правка осядет в `configDraft` и не доедет до компонента. Она же учитывает режим ручного применения (`manualApplySettings`), помечая черновик как dirty вместо немедленного применения.

Заводя первую настройку: пункт `SettingsItem` в новой секции `src/modules/CustomSettings/sections/<Секция>.tsx`, подключение секции в `Settings.tsx`, запись `command → путь в конфиге` в таблице `COMMANDS` внутри `changeCustomChartReducer.ts`, поле в `ChartConfig` ([plugin.types.ts](src/modules/CustomChart/plugin.types.ts)) и при необходимости дефолт в `defaultConfig.json`. Пошаговый порядок и шаблоны кода — в скилле [`new-setting`](.claude/skills/new-setting/SKILL.md).

UI-примитивы и готовые блоки настроек не импортируются — они приходят из ядра через проп `pluginImports`, у которого три раздела:

- `pluginImports.sections` — готовые секции ядра (`DataOptionsContent`, `FilterModeOptionsContent`, `DrillOutOptionsContent`, `DescriptionOptionsContent`, `OutlineOptionsContent`, `titleTextFieldContent`, `precisionSliderContent`…);
- `pluginImports.components` — UI-компоненты (`SettingsSection`, `SettingsItem`, `SettingsToggle`, `SettingsSlider`, `SettingsColorPicker`, `SettingsMultiselect`…);
- `pluginImports.services` — сервисы ядра, в частности сервис модальных окон. В шаблоне пока не используется.

Ядро передаёт `CustomSettings` также `component` (с `type`, `config`, `spec`, `configDraft`), `data`, `reportOptions` и `reportlist`.

## Соглашения

- `src/modules/**`, `src/managers/` и `src/index.ts` — на TypeScript (`strict: true`, сборка через `swc-loader`, JSX — classic runtime).
- Опции SWC лежат в одном месте — [swc.config.js](swc.config.js); `webpack.config.js` и `jest.config.js` берут пресет оттуда и задают только свой `target` (`es2018` для браузерного бандла, `es2022` для тестов в node). Правило «JSX только classic» живёт там же: automatic runtime подтянул бы `react/jsx-runtime`, которого нет в `externals`.
- Стилей в шаблоне нет, но пайплайн собран: `.scss`/`.css` проходят `sass-loader` → `css-loader` → `style-loader`, то есть инлайнятся в бандл — ядро подключает плагин одним JS-файлом, отдельный CSS подключать некому. Side-effect импорты объявлены в [src/types/styles.d.ts](src/types/styles.d.ts), в тестах глушатся через `moduleNameMapper` → `test/styleMock.js`.
- Библиотеки отрисовки в шаблоне нет — `CustomChart` рендерит пустой контейнер (см. «Поток данных»). Выбирая ECharts для нового плагина, учти: ядро отдаёт версию 5.6.0 через `window.echarts`, поэтому подключать её нужно модульным импортом `echarts/core` с точечным `use([...])`, а не пакетом целиком и не через `window.echarts` — модульный импорт в `window` не пишет, и версии сосуществуют без конфликта. Тот же принцип действует для любой другой библиотеки отрисовки, которую ядро тоже раздаёт глобально.
- Общие типы панели настроек (`ChangeChart`, тип props секции) заводятся в `src/modules/CustomSettings/types.ts` — файла пока нет (нет ни одной секции, которой он нужен), заводится вместе с первой секцией, а не по копии в каждом компоненте.
- Алиасов и нестандартных правил резолва модулей в проекте нет — все импорты относительные.
- Тексты интерфейса — русские строковые литералы прямо в JSX.

### Запрещённые библиотеки

**`react-addons-update` не использовать.** Пакет заброшен, официально заменён на `immutability-helper` и тянет за собой legacy-обвязку React. В проекте его нет ни в зависимостях, ни в коде — так и оставить. Встретишь в коде, скопированном из ядра, — убирай: неглубокие правки конфига делаются обычным спредом, глубокие — клонированием (см. ниже).

**`_.cloneDeep` в новом коде не использовать** — предпочитать нативный `structuredClone`. Лишняя обёртка над тем, что есть в платформе, а `lodash` в бандле оплачивается размером. Рантайм-зависимостей у шаблона нет вовсе: `lodash` придётся добавить осознанно, если он понадобится, — образец записи по пути в комментарии `changeCustomChartReducer.ts` обходится без него.

В `changeCustomChartReducer.ts` рабочая версия (см. комментарий в файле) клонирует `configDraft` через `structuredClone` — то же правило: `_.cloneDeep` можно там, где подходит структура, `structuredClone` предпочтительнее.

Подходит не всякая: `structuredClone` ведёт себя иначе, чем `_.cloneDeep`, и разница молчаливой не бывает.

| Что клонируем                  | `_.cloneDeep`      | `structuredClone`                         |
| ------------------------------ | ------------------ | ----------------------------------------- |
| Функции в объекте              | копирует по ссылке | бросает `DOMException` (`DataCloneError`) |
| Экземпляр класса               | сохраняет прототип | отдаёт обычный `Object`                   |
| `Date`, `Map`, `Set`, `RegExp` | копирует           | копирует                                  |
| Ключи со значением `undefined` | сохраняет          | сохраняет                                 |
| React-элементы, DOM-узлы       | копирует по ссылке | бросает                                   |

Отсюда практическое правило: `structuredClone` — для данных (`config`, `configDraft`, `plotData`, ответы ядра), `_.cloneDeep` остаётся там, где в структуре могут оказаться функции, React-элементы или экземпляры классов — например состояние, которое ядро передаёт компоненту вперемешку с колбэками.

**Ловушка в тестах:** в jsdom-окружении `structuredClone` отсутствует (проверено на jsdom 26.1.0) — спек с docblock'ом `/** @jest-environment jsdom */` упадёт на `structuredClone is not defined`. В окружении `node`, которое стоит по умолчанию, функция есть. Тестируешь код с `structuredClone` в компонентном спеке — добавляй полифилл в этот файл или проверяй логику отдельным тестом в `node`-окружении.

Типы в порядке: `structuredClone` объявлен в `lib.dom`, который уже подключён в [tsconfig.json](tsconfig.json).
