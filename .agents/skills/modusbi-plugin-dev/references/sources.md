# Происхождение и границы адаптации

Исходник: [modus-bi/custom-chart/.claude](https://github.com/modus-bi/custom-chart/tree/fb5efa5ba9e8794b2265f100091cddb19911e9b6/.claude),
commit `fb5efa5ba9e8794b2265f100091cddb19911e9b6`, получен 2026-09-07.
Учтены все 16 скиллов, четыре роли агентов, settings.json, оба hook-скрипта,
корневые CLAUDE.md/MIGRATION.md, код и конфигурации этой ревизии.
Лицензионный документ исходного репозитория сохранён без изменения:
[UPSTREAM-LICENSE.docx](../assets/UPSTREAM-LICENSE.docx). Новая лицензия на исходные материалы
не назначается. SHA-256 использованных файлов — в `source-manifest.json` рядом с этим файлом.

## Соответствие

Каждый `.claude/skills/<имя>/SKILL.md` получил одноимённый `references/<имя>.md`:
chart-lifecycle, chart-shell, custom-axes-module, custom-chart-module,
custom-reducers-module, data-query-contract, echarts-engine, migrate-to-typescript,
new-setting, number-formatting, package-plugin, portal-integration-testing,
sync-contract, tdd, typescript-coding-standards, uc-testing.

| Дополнительный источник | Куда перенесён |
| --- | --- |
| CLAUDE.md: карта/соглашения/вопросы/зацикливание | SKILL.md, project-context, тематические справочники |
| test-writer и implementer | tdd: последовательные фазы и необязательные роли |
| contract-reviewer | sync-contract + custom-axes-module |
| settings-flow-reviewer | new-setting + custom-reducers-module |
| guard-paths.sh | Ограничение prebuild в SKILL.md, без обещания автоматической блокировки |
| typecheck.sh | Явный typecheck, промежуточный RED/перенос деклараций, финальная проверка |
| settings.json / Claude permissions | Не переносятся: разрешения задаёт среда Codex |
| MIGRATION.md и конфиги | migrate-to-typescript + assets/template-configs |
| create-plugin.js / manifest.example.json | package-plugin + verify-package + образец манифеста |

## Решения и исправления

При установке комплекта в сам репозиторий добавлен явный `tsconfigRootDir` в корневой
и шаблонный ESLint-конфиги: ESLint 10 обнаруживает оба конфига, и автоматический выбор
корня TypeScript становится неоднозначным. Шаблоны в assets исключены из карты модулей
Jest, чтобы их package.json не конфликтовал с пакетом приложения. Концы строк шаблонов
нормализованы проектным Prettier. Хеши source-manifest.json описывают исходную ревизию,
а не эти изменения интеграции.

Пользователь выбрал один скилл со справочниками, установку в личный Codex и переносимый
процесс без обязательных сабагентов/хуков. Инструкции не зависят от Claude Skill/Task/Bash,
ToolSearch, slash-команд или CLAUDE_PROJECT_DIR. Справочники не вызываются как отдельные скиллы.

- Уточнения ограничены отсутствующими решениями; ранее согласованные не спрашиваются повторно.
- Убраны blanket checkout/stash, автоматические коммиты, удаление старых папок при миграции
  и исправление соседнего кода вне объёма задачи.
- Роли ревью сохранены, отдельные агенты не обязательны и не получают фиктивных ACL.
- Мок SettingsToggle согласован с toggled/onToggle. Приведение значения закреплено за UI,
  устранено противоречие new-setting с custom-reducers.
- isDisabledAxe — активность пилюли, не разрешение drop. Учитываются ненулевые индексы ёмкости.
- Неполный getQueryObjects заменён требованиями и тестируемыми инвариантами; добавлены
  отсутствовавшие у примера hideResult/ёмкость/HAVING/countd и необходимость проверки типов.
- Lifecycle учитывает идентичность DOM и поколение инстанса, cleanup конкретного владельца.
  Убрано необоснованное уничтожение чужого инстанса и запрет всех классовых владельцев.
- Отделена чистота buildSpec от независимости его формата от движка.
- Противоречие «MCP необязателен»/«без Playwright прогон запрещён» разрешено разделением
  автоматического и документированного ручного режимов, без подмены одного другим.
- Повторный UC определяется риском/diff; необходимая широкая регрессия не запрещена.
- Архив сверяется с текущей сборкой и манифестом; размер бандла не доказывает включение React.
- Контракт сравнивается без жёсткого удаления 11 строк; ContractCheck не назван проверкой
  отсутствия лишних экспортов. Непроверенные runtime-наблюдения не выдаются за локальные тесты.

## Официальные материалы

Формат SKILL.md, optional agents/openai.yaml и явный/автоматический вызов сверены с
[официальной документацией навыков Codex](https://learn.chatgpt.com/docs/build-skills).
Документация перечисляет `.agents/skills` для repository/user discovery; в среде этой
адаптации личные скиллы фактически загружаются также из `C:/Users/пк/.codex/skills`.
Место конкретной установки описывается в документации комплекта, не зашито в рабочий скилл.

Уточнение ECharts init сверено с
[исходником ECharts 5.6.0](https://github.com/apache/echarts/blob/5.6.0/src/core/echarts.ts):
при найденном существующем инстансе init возвращает его, а не обязательно создаёт второй.
Ограничения error boundary сверены с
[документацией React 16](https://legacy.reactjs.org/docs/error-boundaries.html):
асинхронные callback и обработчики событий требуют отдельной обработки.

Поставка prebuild и живой портал при адаптации не предоставлялись. Версии/инжекты/CSS/структуры
данных ModusBI в тематических справочниках — знания указанного исходника, подлежащие сверке
на целевом ядре. Автоматические проверки комплекта не заменяют такой проверки.
