# Миграция

Шаблон плагина ModusBI переписан на TypeScript в версии `1.0.0`. Прежний вариант на JavaScript
остался под тегом `0.1.0`. Документ отвечает на два вопроса: как продолжать работать на старом
шаблоне и как перевести на TypeScript плагин, который уже написан на нём.

Что именно изменилось между версиями — в [CHANGELOG.md](CHANGELOG.md).

---

## Остаться на прежнем шаблоне

Ничего делать не нужно: уже созданный плагин продолжает собираться и работать. Контракт с ядром
не менялся — переписан только шаблон, а не то, что ядро ждёт от плагина.

Чистая копия прежнего шаблона:

```bash
git clone --branch 0.1.0 git@github.com:modus-bi/custom-chart.git my-plugin
cd my-plugin
git switch -c my-plugin 0.1.0
```

Второй командой стоит не пренебрегать: тег — не ветка, без неё репозиторий останется в состоянии
detached HEAD и первый же коммит окажется вне веток.

Там же, на JavaScript, остались готовые примеры и разбор — они отведены от `0.1.0` и на
TypeScript не переводились:

| Ветка                         | Что внутри                                      |
| ----------------------------- | ----------------------------------------------- |
| `reference-universal`         | универсальный плагин, полный набор возможностей |
| `reference-echarts-waterfall` | диаграмма Waterfall на ECharts                  |
| `reference-d3-sunburst`       | диаграмма Sunburst на D3                        |
| `tutorial-progress`           | пошаговый разбор: индикатор прогресса           |

Что нужно понимать, оставаясь на `0.1.0`:

- Обновлений не будет: исправления и новые возможности шаблона выходят только в `main`.
- Инструментарий там старый — webpack 4, Babel 7, express-сервер разработки (`npm run start:dev`
  через `nodemon bin/server`), Prettier 1, `ts-loader`. Часть пакетов давно не обновляется.
- Контракт с ядром живёт своей жизнью: при обновлении ядра сверяйте
  `prebuild/api/chartPlugin.d.ts` независимо от версии шаблона.

---

## Перевести существующий плагин на TypeScript

Плагин переводится **постепенно**: конфигурация принимает `.js` и `.ts` одновременно, поэтому
файлы можно переводить по одному, сохраняя рабочую сборку после каждого шага. Переписывать всё
разом не нужно и не стоит.

Порядок ниже — от инструментов к коду. До седьмого шага плагин остаётся полностью на JavaScript
и продолжает собираться; собственно перевод файлов начинается только там.

Образец каждого файла конфигурации — одноимённый файл в `main`. Если что-то в рецепте
разошлось с репозиторием, верить репозиторию.

### Шаг 1. Зависимости

Прежний шаблон собирался Babel + webpack 4 и компилировал TypeScript через `ts-loader`.
Новый — SWC + webpack 5: SWC режет типы без проверки типов, а проверку берёт на себя отдельный
`tsc --noEmit`. Это быстрее и убирает `babel.config.js` вовсе.

Удалить (Babel, старый webpack, express-обвязка dev-сервера):

```bash
npm uninstall @babel/cli @babel/core @babel/plugin-proposal-class-properties \
  @babel/plugin-transform-regenerator @babel/polyfill @babel/preset-env @babel/preset-react \
  babel-loader babel-preset-minify ts-loader prettier-webpack-plugin url-loader \
  webpack webpack-cli webpack-dev-middleware webpack-hot-middleware \
  compression connect-history-api-fallback express debug nodemon rimraf
```

Поставить:

```bash
npm install -D webpack@^5 webpack-cli@^7 webpack-dev-server@^6 \
  @swc/core swc-loader \
  typescript @types/react \
  jest @swc/jest @types/jest jest-environment-jsdom @testing-library/react@^12 \
  eslint @eslint/js typescript-eslint eslint-config-prettier globals prettier
```

`@testing-library/react` — именно 12: следующие мажоры требуют React 18, а ядро отдаёт React 16.

Затем удалить из репозитория `babel.config.js` и заменить скрипты в `package.json`:

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "build:dev": "webpack --mode development",
    "start": "webpack serve --mode development",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "build:plugin": "node create-plugin.js",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --max-warnings=0"]
  }
}
```

Блок `"husky": { "hooks": ... }` из `package.json` удаляется — в husky 9 хук лежит файлом
`.husky/pre-commit`, содержимое которого сводится к одной строке `npx lint-staged`.

Заодно поднимите `engines` — webpack-dev-server 6 и Jest 30 требуют современного Node:

```json
{ "engines": { "node": ">=22.15.0", "npm": ">=10" } }
```

### Шаг 2. tsconfig.json

Ключевое здесь — `allowJs: true` и `checkJs: false`: TypeScript видит `.js`-файлы плагина как
модули (импорты из них резолвятся), но не проверяет их типы. Это и делает миграцию постепенной.

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2018", "DOM"],
    "jsx": "react",
    "types": ["jest"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "build"]
}
```

Три поля стоит пояснить, потому что их легко счесть необязательными:

- `"noEmit": true` — компилятор здесь только проверяет типы, файлы собирает SWC.
- `"isolatedModules": true` — SWC компилирует каждый файл отдельно, без знания о соседних.
  Флаг заставляет `tsc` ругаться на конструкции, которые при таком режиме ломаются молча
  (реэкспорт типа без `export type`, например).
- `"jsx": "react"` — classic runtime, `React.createElement`. Automatic runtime подтянул бы
  `react/jsx-runtime`, которого нет в `externals`: ядро отдаёт плагину только глобальный `React`.

Если в старом `tsconfig.json` были `paths`/`baseUrl` — уберите их вместе с `resolve.alias`
в webpack: в шаблоне все импорты относительные, и два места, которые надо держать
синхронными, — лишний источник расхождений.

### Шаг 3. swc.config.js

Один пресет на сборку и тесты, чтобы правила JSX не разошлись между ними:

```js
const createSwcOptions = ({ syntax, target }) => ({
  jsc: {
    parser: syntax === 'typescript' ? { syntax: 'typescript', tsx: true } : { syntax: 'ecmascript', jsx: true },
    transform: { react: { runtime: 'classic', development: false, refresh: false } },
    target,
  },
});

module.exports = { createSwcOptions };
```

### Шаг 4. webpack.config.js

Правки против старого конфига, по пунктам:

- Экспортировать функцию `(env, argv) => ({ ... })` вместо объекта: режим приходит из
  `--mode`, а не из `process.env.NODE_ENV`.
- `output.library` в webpack 5 — объект: `{ name: 'CustomChart0', type: 'umd' }` вместо пары
  `library` + `libraryTarget`. Плюс `globalObject: 'this'`.
- **Два правила загрузчика вместо одного.** Это и есть механика постепенной миграции: `.js`/`.jsx`
  идут через SWC с парсером `ecmascript`, `.ts`/`.tsx` — с парсером `typescript`. Пока оба
  правила на месте, файлы обоих видов собираются в один бандл.

  ```js
  { test: /\.m?jsx?$/, exclude: /node_modules/, use: { loader: 'swc-loader', options: swcJs } },
  { test: /\.tsx?$/,   exclude: /node_modules/, use: { loader: 'swc-loader', options: swcTs } },
  ```

- `entry: './src/index'` без расширения — тогда переименование `src/index.js` → `src/index.ts`
  не потребует правки конфига. `resolve.extensions` должен перечислять `.ts`, `.tsx` **раньше**
  `.js`, `.jsx`.
- Блок `devServer` вместо express-сервера: `static.directory` указывает на `prebuild/`,
  webpack-dev-server сам отдаёт собранный бандл по `output.publicPath` (`/plugins/`). Каталоги
  `bin/`, `server/`, `config/` после этого удаляются целиком.
- `url-loader` заменяется встроенными Asset Modules webpack 5 (`type: 'asset/inline'`), если
  плагин действительно грузит картинки или шрифты. Чаще всего правило просто удаляется.

Оверлей ошибок стоит настроить сразу — полноэкранный оверлей рантайм-ошибок закрывает портал
целиком, а плагин отлаживают внутри портала:

```js
client: { overlay: { errors: true, warnings: false, runtimeErrors: false } },
```

### Шаг 5. Линт и формат

Настроенного ESLint в прежнем шаблоне не было: `lint-staged` вызывал `eslint --max-warnings=0`,
а файла конфигурации в репозитории не лежало. Заводится он сразу в актуальном формате — flat
config `eslint.config.js`, без `.eslintrc`. Минимальный набор — `@eslint/js` + `typescript-eslint`

- `eslint-config-prettier` последним элементом, чтобы правила форматирования не конфликтовали с
  Prettier. Готовый файл — [eslint.config.js](eslint.config.js) в `main`; из него стоит перенести и
  два узких блока: `argsIgnorePattern: '^_'` для параметров контрактных методов и отключение
  `no-require-imports` для корневых CommonJS-конфигов.

Prettier 1 → 3 меняет умолчания (в частности `trailingComma` и `arrowParens`), поэтому первый
прогон переформатирует почти весь репозиторий. Делайте это **отдельным коммитом**, до перевода
файлов, — иначе содержательные правки утонут в diff'е форматирования.

### Шаг 6. Jest

Тестов в прежнем шаблоне не было вовсе — Jest заводится с нуля, на том же пресете SWC:

```js
const { createSwcOptions } = require('./swc.config');

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  transform: { '^.+\\.[jt]sx?$': ['@swc/jest', createSwcOptions({ syntax: 'typescript', target: 'es2022' })] },
  moduleNameMapper: { '\\.(css|scss|sass)$': '<rootDir>/test/styleMock.js' },
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/prebuild/'],
};
```

Спеки лежат рядом с кодом, а не в `__tests__/`. Компонентные тесты открываются docblock'ом
`/** @jest-environment jsdom */` — глобальное окружение остаётся `node`.

### Шаг 7. Контракт ядра

Скопируйте `prebuild/api/chartPlugin.d.ts` в `src/types/chartPlugin.d.ts` — это снимок контракта
на момент копирования, обновляется вручную при обновлении ядра. Затем добавьте в `src/index.ts`
проверку набора экспортов на этапе компиляции:

```ts
import type { ChartPluginModule } from './types/chartPlugin';
import type * as Self from './index';

// ...семь export'ов...

type AssertAssignable<T, U extends T> = U;
export type ContractCheck = AssertAssignable<ChartPluginModule, typeof Self>;
```

Удалённый или неверно типизированный экспорт после этого роняет `npm run typecheck` с `TS2344`,
а не ломает редактор на портале.

Сюда же — `src/types/styles.d.ts` для side-effect импортов стилей:

```ts
declare module '*.scss';
declare module '*.css';
```

### Порядок перевода файлов

Переводить **снизу вверх, по одному файлу**, прогоняя `npm run typecheck && npm run build` после
каждого. Файл, у которого нет зависимостей внутри плагина, переводится без правки соседей;
файл, от которого зависят другие, потянет за собой их типы.

1. Хелперы и константы без импортов из плагина.
2. `defaultConfig.json` → рядом заводится типизированное зеркало (`ChartConfig` в
   `plugin.types.ts`) и `getDefaultConfig.ts`.
3. `dataAdaptor`, `specGenerator`, `configEditor`, `ComponentTypeManager` — они опираются на
   контракт и типы конфига.
4. `CustomAxes` — методы полок, сигнатуры берутся из `chartPlugin.d.ts`.
5. Компоненты: `CustomSettings/`, затем `CustomChart` (`.jsx` → `.tsx`).
6. `changeCustomChartReducer`.
7. `src/index.js` → `src/index.ts` и `ContractCheck` последним шагом — когда типы всех семи
   экспортов уже настоящие.

Когда `.js`-файлов в `src/` не осталось, уберите `allowJs`/`checkJs` из `tsconfig.json` и правило
`.m?jsx?$` из webpack — тогда случайно добавленный `.js` перестанет собираться молча.

### Типовые грабли

| Симптом                                                 | Причина                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Cannot find module 'react/jsx-runtime'`                | JSX собран в automatic runtime; в `swc.config.js` и `tsconfig.json` должен быть classic          |
| `TS2593: Cannot find name 'describe'`                   | в `tsconfig.json` нет `"types": ["jest"]`; поле задаётся явно и отключает автоподключение прочих |
| `structuredClone is not defined` в спеке                | функции нет в jsdom; проверяйте такую логику в окружении `node` или ставьте полифилл в спеке     |
| Бандл вырос вдвое, в нём оказался React                 | пропал блок `externals` — `react` и `react-dom` даёт ядро                                        |
| `npm run build:plugin` не находит `build/manifest.json` | включён `output.clean` — он затирает положенный вручную манифест                                 |
| Типы контракта разошлись с ядром после его обновления   | `src/types/chartPlugin.d.ts` — копия, обновляется вручную; сверяйте с `prebuild/api/`            |

Отдельно: `react-addons-update` из прежнего шаблона использовать не нужно — пакет заброшен,
неглубокие правки конфига делаются спредом, глубокие — `structuredClone`.

### Если работу ведёт ИИ-агент

В репозитории лежит скилл [`migrate-to-typescript`](.claude/skills/migrate-to-typescript/SKILL.md) —
он проводит агента по этому же порядку и не даёт заглушить расхождение типов через `any`.
