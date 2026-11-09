# Миграция JavaScript-плагина

Работай в репозитории **плагина пользователя**. Шаблон — образец инструментов, не замена
его логики/defaultConfig/зависимостей. Выясни состояние: старый Babel/webpack 4; новая сборка
с JS; частично переведённый проект. Прочитай package.json, lock, конфиги, импорты и тесты.
Объём полного/частичного перевода берётся из задачи; не спрашивай повторно уже выбранное.
Массовое форматирование, перенос папок и смена поведения не подразумеваются миграцией типов.

## Инструменты раньше кода

Исторический рецепт: custom-chart/MIGRATION.md, коммит указан в [источниках](sources.md).
Проверенные файлы-образцы этой версии включены в [template-configs](../assets/template-configs/package.json).
Это согласованный комплект для сверки, а **не команда скопировать поверх чужого проекта**:

- [tsconfig](../assets/template-configs/tsconfig.json): strict/noEmit/isolatedModules,
  classic JSX, types:[jest], временно allowJs:true/checkJs:false.
- [swc.config](../assets/template-configs/swc.config.js): общий пресет JSX classic для
  webpack и Jest; browser target es2018, test target es2022 в конфигурациях потребителей.
- [webpack](../assets/template-configs/webpack.config.js): webpack 5, UMD CustomChart0,
  externals react/react-dom, extensionless src/index, TS/TSX раньше JS/JSX; два swc-loader
  для JS и TS, static prebuild, /plugins/, встроенный dev-server, стили внутри JS.
- [Jest](../assets/template-configs/jest.config.js) и [styleMock](../assets/template-configs/test/styleMock.js):
  @swc/jest, node, спеки рядом, jsdom по docblock, стили замаплены.
- [ESLint](../assets/template-configs/eslint.config.js): flat config, узкие исключения для
  CommonJS и неиспользуемых контрактных аргументов; Prettier последним.
- [Prettier](../assets/template-configs/.prettierrc): формат проекта, применять к своим правкам.

Сначала согласуй/проверь совместимость движка Node и зависимостей с целевым окружением.
Для React 16 пример использует Testing Library 12 и подходящие @types/react, не latest вслепую.
Удаляй старые Babel/express/loader-пакеты только после проверки их потребителей: в плагине
может быть собственный сервер или другой сборочный процесс. Не удаляй целиком bin/server/config
по рецепту чужого шаблона. Сохраняй используемые aliases/assets и runtime-зависимости.

Контрольная точка: новая цепочка собирает ещё **JS-код**, затем начинай перенос типов.
Снимок контракта получай от целевого ядра по [sync-contract](sync-contract.md), а не выдавай
копию версии шаблона за актуальный API. Стилевые декларации добавь для реально используемых
CSS/SCSS. Если проект оставляет JS-копии ядра в duplicates, это осознанное исключение.

## Перевод снизу вверх

Хелперы/константы → типы своего config/getDefaultConfig → DataAdaptor/SpecGenerator/
ConfigEditor/ComponentTypeManager → CustomAxes → CustomSettings/CustomChart → редьюсер →
src/index и ContractCheck. Переводи небольшой законченный файл/связанный шаг за раз,
сохраняя сборку; не заменяй вычисления заглушками из шаблона.

Используй git mv при подходящем состоянии файла (обычное переименование также распознаётся
Git по содержимому). После шага typecheck/build и относящиеся тесты. Типы неизвестных данных
подтверждай, не гаси any/as/ts-expect-error. Обоснованная assertion при доказанной форме
возможна; неизвестная форма — вопрос/исследование, не «пользователь потом проверит догадку».

Удаляй allowJs/checkJs и JS-loader только когда это соответствует фактически оставшемуся
коду, включая разрешённые duplicates. Не обещай, что это запрещает любые JS-импорты вообще:
поведение зависит также от сборки/резолва. Корневые CommonJS-конфиги не обязаны стать TS.
Повторная миграция уже переведённых файлов не нужна.

Отчёт: изменённые инструменты/файлы, оставшийся JS с причиной, typecheck/tests/lint/build,
подтверждение неизменности поведения и непроверенные интеграционные сценарии. При цикле ошибок
сохрани diff и диагностируй источник; не выполняй blanket checkout/reset пользовательских файлов.
