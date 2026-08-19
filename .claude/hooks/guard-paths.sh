#!/usr/bin/env bash
# PreToolUse-хук: блокирует правки в prebuild/ — распакованном ядре ModusBI.
#
# Каталог лежит в .gitignore и перезаписывается при обновлении ядра: правка выглядит
# рабочей и исчезает бесследно.
#
# Вывод — JSON с hookSpecificOutput.permissionDecision; пустой вывод = решение по умолчанию.

set -uo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')

[ -n "$file" ] || exit 0

deny() {
  jq -nc --arg reason "$1" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
}

case "$file" in
  */prebuild/* | prebuild/*)
    deny "prebuild/ — распакованное ядро ModusBI: каталог в .gitignore и перезаписывается при обновлении ядра, правка потеряется. Контракт правится в src/types/chartPlugin.d.ts, код плагина — в src/."
    ;;
esac

exit 0
