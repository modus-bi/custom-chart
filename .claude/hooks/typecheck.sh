#!/usr/bin/env bash
# PostToolUse-хук: гоняет tsc --noEmit после правки TypeScript-файла.
#
# Зачем: в проекте strict: true, а src/index.ts содержит тип ContractCheck —
# соответствие семи экспортов контракту ядра проверяется только компилятором.
# lint-staged гоняет ESLint и Prettier, типы не трогает; CI нет.
#
# Путь к правленому файлу приходит первым аргументом: его подставляет `args`
# в .claude/settings.json. Ответ сериализует node — вывод компилятора содержит кавычки
# и переводы строк, собирать такой JSON конкатенацией нельзя. Node доступен всегда:
# им же запускается tsc строкой ниже.
#
# Два режима, потому что tsc проверяет проект целиком, а спеки входят в tsconfig:
#
#   правился обычный файл        → выход 2, ошибки уезжают обратно в модель как блокирующие;
#   правился *.spec.* или *.d.ts → выход 0 с additionalContext.
#
# Второй режим существует ради двух процессов, где промежуточная некомпилируемость штатна:
# фазы RED (тест на ещё не написанный экспорт обязан ронять tsc, а чинить реализацию
# агенту тестов запрещено) и переноса контракта ядра в src/types/chartPlugin.d.ts,
# который приходит в согласие с кодом только к концу.

set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

file=${1:-}

# Пустой аргумент — инструмент без file_path либо неподставленный плейсхолдер.
case "$file" in
  '' | '${'*) exit 0 ;;
esac

case "$file" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac

output=$(npx --no-install tsc --noEmit 2>&1)
status=$?

[ $status -eq 0 ] && exit 0

errors=$(printf '%s\n' "$output" | tail -30)

case "$file" in
  *.spec.ts | *.spec.tsx | *.d.ts)
    case "$file" in
      *.d.ts)
        hint="Правился файл деклараций. При переносе контракта ядра промежуточная некомпилируемость штатна — доводи перенос до конца, затем разбирай ошибки."
        ;;
      *)
        hint="Правился файл теста. Если ошибки указывают на отсутствующий экспорт или несуществующее API — это ожидаемое состояние фазы RED, продолжай. Ошибки в самом тесте (типы фикстур, заглушек, импортов) чини."
        ;;
    esac
    printf '%s' "$errors" | node -e '
      let errors = "";
      process.stdin
        .on("data", (chunk) => (errors += chunk))
        .on("end", () => {
          process.stdout.write(
            JSON.stringify({
              hookSpecificOutput: {
                hookEventName: "PostToolUse",
                additionalContext: `tsc --noEmit не проходит:\n${errors}\n\n${process.argv[1]}`,
              },
            }),
          );
        });
    ' "$hint"
    exit 0
    ;;
  *)
    {
      echo "tsc --noEmit упал после правки $file:"
      printf '%s\n' "$errors"
    } >&2
    exit 2
    ;;
esac
