#!/usr/bin/env bash
# PreToolUse-хук: блокирует правки в prebuild/ — распакованном ядре ModusBI.
#
# Каталог лежит в .gitignore и перезаписывается при обновлении ядра: правка выглядит
# рабочей и исчезает бесследно.
#
# Путь к правленому файлу приходит первым аргументом: его подставляет `args`
# в .claude/settings.json. Скрипт не разбирает stdin и не зовёт внешних утилит —
# отсутствие чего-либо в PATH не может тихо превратить проверку в пустышку.
#
# Вывод — JSON с hookSpecificOutput.permissionDecision; пустой вывод = решение по умолчанию.

set -uo pipefail

file=${1:-}

# Пустой аргумент — инструмент без file_path (например NotebookEdit с notebook_path)
# либо неподставленный плейсхолдер. Решения не выносим.
case "$file" in
  '' | '${'*) exit 0 ;;
esac

case "$file" in
  */prebuild/* | prebuild/*)
    # Ответ статичен: собирается без сериализатора, потому что не содержит внешних данных.
    # Меняя текст, не вставляй в него кавычки, обратные слэши и переводы строк.
    cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"prebuild/ — распакованное ядро ModusBI: каталог в .gitignore и перезаписывается при обновлении ядра, правка потеряется. Контракт правится в src/types/chartPlugin.d.ts, код плагина — в src/."}}
JSON
    exit 0
    ;;
esac

exit 0
