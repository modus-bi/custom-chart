/**
 * Side-effect импорты стилей (`import './foo.scss'`). Webpack (sass-loader/css-loader) собирает
 * такие импорты как обычно; декларация нужна только TypeScript-компилятору, экспортов у модулей
 * нет.
 */
declare module '*.scss';
declare module '*.css';
