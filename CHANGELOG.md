# История изменений

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии по
[семантическому версионированию](https://semver.org/lang/ru/).

## [1.0.0] — 2026-08-19

Шаблон переписан на TypeScript и пересобран инструментально. Контракт с ядром не менялся:
плагины, написанные на `0.1.0`, продолжают работать. Как перевести такой плагин на TypeScript —
в [MIGRATION.md](MIGRATION.md).

### Добавлено

- TypeScript со `strict: true` во всех модулях `src/`; `npm run typecheck` (`tsc --noEmit`).
- Копия контракта ядра `src/types/chartPlugin.d.ts` и проверка семи экспортов на этапе
  компиляции — тип `ContractCheck` в `src/index.ts`: удалённый или неверно типизированный
  экспорт роняет typecheck, а не редактор на портале.
- Типизированное зеркало конфига — `ChartConfig` в `src/modules/CustomChart/plugin.types.ts`
  и `getDefaultConfig.ts` (свежая копия через `structuredClone` на каждый вызов).
- Тесты: Jest 30 на `@swc/jest`, спеки рядом с кодом. Покрыт каркас — модель конфига,
  редьюсер, `DataAdaptor`, `ConfigEditor`, `CustomAxes`, `CustomChart`, `useChartSize`.
- ESLint 10 во flat config, `lint-staged` + husky 9 на коммите.
- Загрузка данных в `CustomChart.tsx`: `getDatasetId`, сборка `queryObjects`, вызов инжекта
  `loadDatas` и построение адаптора через `ComponentTypeManager` — механика штатного хоста
  плагинных типов в ядре. Оба метода `DataAdaptor` (`getQueryObjects`, `remapData`) остаются
  заглушками: их реализует новый плагин.
- Хук `useChartSize` — размер контейнера для библиотеки отрисовки.
- Конфигурация ИИ-агентов в `.claude/`: скиллы, сабагенты, хуки. Описана в `CLAUDE.md`.
- Документация: `CLAUDE.md` (архитектура и соглашения), `MIGRATION.md`, `CHANGELOG.md`.

### Изменено

- Сборка: webpack 5 + `swc-loader` вместо webpack 4 + Babel; `ts-loader` больше не нужен —
  типы режет SWC, проверяет отдельный `tsc`.
- Dev-сервер: `webpack-dev-server` 6 (`npm start`, порт 7000) вместо express-обвязки
  `bin/server` + `nodemon`. Каталоги `bin/`, `server/`, `config/` удалены.
- `defaultConfig.json` очищен от данных конкретного отчёта — убраны `datasetId` и пилюли
  с полями демо-датасета.
- Prettier 1 → 3, husky 8 → 9 (хук `.husky/pre-commit` — одна строка `npx lint-staged`).
- `create-plugin.js` подменяет `CustomChart0` на плейсхолдер `CustomChartNNN`; реальное имя
  класса подставляет ядро при установке плагина по правилу `ReplacementInTheBody` манифеста.
- Все контрактные модули приведены к состоянию осмысленных заглушек с комментариями о том,
  как устроена рабочая версия: `CustomChart` рендерит пустой контейнер, `CustomSettings`
  возвращает `null`, редьюсер возвращает состояние без изменений.

### Удалено

- Babel (`babel.config.js` и семь пакетов `@babel/*`), `ts-loader`, `url-loader`,
  `prettier-webpack-plugin`.
- `multiply-plugin.js` — размножал бандл на 41 слот `CustomChart0…CustomChart40`; устарел
  с появлением `ReplacementInTheBody`.
- Неиспользуемые рантайм-пакеты (`lodash`, `moment`, `classnames`, `i18next`, `tinycolor2`
  и другие). Рантайм-зависимостей у шаблона больше нет вовсе: `react` и `react-dom` —
  в `peerDependencies` и `externals`, их отдаёт ядро.
- `react-addons-update` — заброшен; правки конфига делаются спредом и `structuredClone`.

## [0.1.0] — 2026-02-11

Шаблон плагина на JavaScript в том виде, в каком он существовал до перехода на TypeScript:
webpack 4, Babel 7, express-сервер разработки, Prettier 1, `ts-loader` для отдельных файлов.

Тег зафиксирован как точка возврата — плагины на его основе продолжают собираться и работать,
но обновлений шаблона в этой версии не будет. На нём же остались ветки примеров
(`reference-universal`, `reference-echarts-waterfall`, `reference-d3-sunburst`) и пошаговый
разбор `tutorial-progress`.

[1.0.0]: https://github.com/modus-bi/custom-chart/releases/tag/1.0.0
[0.1.0]: https://github.com/modus-bi/custom-chart/releases/tag/0.1.0
