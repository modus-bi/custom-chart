const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['build/**', 'prebuild/**', 'node_modules/**', 'temp/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Методы контрактов ядра (CustomAxes и подобные) всегда получают объект контекста, даже
    // когда конкретной реализации плагина он не нужен. Такой параметр стоит типизировать,
    // а не опускать: типизированная сигнатура документирует автору нового плагина, что именно
    // присылает ядро в этот метод, без похода в chartPlugin.d.ts. Ведущее подчёркивание в имени —
    // принятое в проекте обозначение «намеренно не используется», а не забытый код;
    // `noUnusedParameters` в tsconfig.json понимает эту конвенцию нативно, ESLint — только
    // с этой настройкой.
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Корневые конфиги и служебные скрипты — CommonJS (module.exports/require),
    // ES-модульный синтаксис им не подходит.
    files: [
      'eslint.config.js',
      'webpack.config.js',
      'jest.config.js',
      'swc.config.js',
      'create-plugin.js',
      'test/styleMock.js',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  prettier,
];
