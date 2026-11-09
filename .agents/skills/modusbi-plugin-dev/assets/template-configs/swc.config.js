/**
 * Общий пресет SWC для сборки (webpack) и тестов (jest).
 *
 * JSX-трансформ строго classic (`React.createElement`): automatic runtime подтянул бы
 * `react/jsx-runtime`, которого нет в externals — ядро отдаёт плагину только глобальный `React`.
 * Держать это правило в одном месте, чтобы сборка и тесты не разошлись.
 */
const createSwcOptions = ({ syntax, target }) => ({
  jsc: {
    parser: syntax === 'typescript' ? { syntax: 'typescript', tsx: true } : { syntax: 'ecmascript', jsx: true },
    transform: { react: { runtime: 'classic', development: false, refresh: false } },
    target,
  },
});

module.exports = { createSwcOptions };
