# Шаблон плагина ModusBI

Шаблон плагина визуализации для аналитической платформы **ModusBI**. Рабочая сборка: все семь
контрактных экспортов на месте (`src/index.ts`), typecheck проверяет их форму против контракта
ядра. Все контрактные модули — пустые заглушки: `CustomChart` рендерит пустой контейнер, адаптор
данных ничего не запрашивает и не приводит (`getQueryObjects`, `remapData` — заглушки), панель
настроек и редьюсер команд ничего не делают. Это стартовая точка для нового плагина, а не рабочий
пример — знание о том, как каждая часть устроена, оставлено комментариями рядом с заглушками.

Архитектура, соглашения проекта и текущее состояние подробно описаны в [CLAUDE.md](CLAUDE.md).

---

## Технологии

- [React](https://github.com/facebook/react) ^16.14.0
- [Webpack](https://github.com/webpack/webpack) 5
- [TypeScript](https://www.typescriptlang.org/)
- [SWC](https://swc.rs/)
- [Jest](https://jestjs.io/) 30

Библиотека отрисовки в шаблон не включена — выбор и подключение остаются за новым плагином.

---

## Требования

- **Node.js** 22.15+
- **npm** 10+
- Распакованное **ядро ModusBI** в `prebuild/` — без него недоступны dev-сервер и файл контракта
  `prebuild/api/chartPlugin.d.ts`.

---

## Быстрый старт

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Скачайте **ядро ModusBI** (инструкция [здесь](https://kb.modusbi.ru/web/docs_product/content-view/-/kb_asset_publisher/contentView/content/id/599400)) и распакуйте содержимое архива в папку `prebuild/` в корне проекта.
3. Запустите dev-сервер:
   ```bash
   npm start
   ```
   Сервер поднимется на порту `7001` (переменная окружения `PORT` меняет порт).

---

## Команды

| Команда                | Что делает                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `npm start`            | Dev-сервер с HMR на порту 7001, требует `prebuild/`                                                |
| `npm run build`        | Продакшен-сборка (`webpack --mode production`)                                                     |
| `npm run build:dev`    | Несжатая сборка в режиме разработки                                                                |
| `npm run build:plugin` | Собирает дистрибутив `<manifest.name>.tar.gz` из `build/custom_chart_0.js` и `build/manifest.json` |
| `npm test`             | Запускает тесты Jest                                                                               |
| `npm run typecheck`    | `tsc --noEmit`, в том числе проверка семи экспортов против контракта                               |
| `npm run lint`         | ESLint                                                                                             |

Перед `npm run build:plugin` положите `build/manifest.json` — шаблон в
[manifest.example.json](manifest.example.json).

---

## Чек-лист нового плагина

Что переименовать и наполнить своим содержимым, отталкиваясь от шаблона:

| Файл                                                     | Что менять                                      |
| -------------------------------------------------------- | ----------------------------------------------- |
| `package.json`                                           | `name`, `description`                           |
| `manifest.example.json` → `build/manifest.json`          | `name`, `description`                           |
| `src/modules/CustomChart/defaultConfig.json`             | `title`, `chartType`, состав полок              |
| `src/modules/CustomChart/plugin.types.ts`                | поля `ChartConfig` под свои настройки           |
| `src/modules/CustomChart/dataAdaptor.ts`                 | реализовать `getQueryObjects` и `remapData`     |
| `src/modules/CustomSettings/`                            | свои секции в `sections/` (см. `Settings.tsx`)  |
| `src/modules/CustomReducers/changeCustomChartReducer.ts` | таблица `COMMANDS` (шаблон в комментарии файла) |

Имя UMD-библиотеки `CustomChart0` и плейсхолдер `CustomChartNNN` не трогать — подстановку
реального имени класса при сборке дистрибутива делает ядро по правилу `ReplacementInTheBody`.

---

## Поток данных без загрузки

Форма цепочки на месте, а сама загрузка — нет. Готового `plotData` в props нет — ядро отдаёт
сырой ответ бэкенда в `data`, компонент зовёт инжект `loadDatas` (пять аргументов, как в ядре)
и строит `DataAdaptor` через `ComponentTypeManager`, повторяя механику штатного хоста плагинных
типов. Эта часть в [`CustomChart.tsx`](src/modules/CustomChart/CustomChart.tsx) рабочая, но два
метода адаптора — заглушки: `DataAdaptor.getQueryObjects` возвращает пустой массив (запрос к
бэкенду уйдёт ни за чем), `remapData` возвращает пустой `plotData`. Их обязан реализовать новый
плагин — подробности и на что обратить внимание (скобки в ключах ответа бэкенда) в комментариях
[`dataAdaptor.ts`](src/modules/CustomChart/dataAdaptor.ts). Пока они не реализованы, компонент
рендерит пустой `div`, а число строк `plotData` (всегда `0`) видно в его атрибуте `data-rows`
(в DevTools).

Тот же компонент показывает, куда встраивать свою отрисовку: сохранить нужно контейнер с `ref`,
размер из `useChartSize` (библиотеке отрисовки он обычно нужен для `resize()`) и эффект работы
с данными.

Заводя первую настройку панели редактора — со скилла [`new-setting`](.claude/skills/new-setting/SKILL.md):
он объясняет, как завести первую секцию `CustomSettings` и первую запись в таблице команд
`changeCustomChartReducer.ts`.

---

## Документация

- [Общее описание плагинов ModusBI](https://kb.modusbi.ru/web/docs_product/plaginy)
- [Руководство по Plugins API](https://kb.modusbi.ru/web/docs_product/opisaniye-pluginsapi-v0.1-yadra-platformy-modus-bi)
- [`prebuild/api/chartPlugin.d.ts`](prebuild/api/chartPlugin.d.ts) — источник истины по контракту
  с ядром; появляется после распаковки ядра в `prebuild/`.
