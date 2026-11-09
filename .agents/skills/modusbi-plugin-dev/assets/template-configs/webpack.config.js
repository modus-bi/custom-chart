const path = require('path');

const { createSwcOptions } = require('./swc.config');

// Бандл едет в браузер вместе с ядром — цель ES2018.
const swcJs = createSwcOptions({ syntax: 'ecmascript', target: 'es2018' });
const swcTs = createSwcOptions({ syntax: 'typescript', target: 'es2018' });

module.exports = (env, argv) => {
  const isDev = argv.mode !== 'production';

  return {
    entry: './src/index',
    devtool: isDev ? 'eval-source-map' : false,
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    // clean: false (по умолчанию) — намеренно. create-plugin.js читает build/manifest.json,
    // который кладут в build/ вручную перед сборкой дистрибутива; включение output.clean
    // затирало бы его при каждой сборке и молча ломало npm run build:plugin.
    output: {
      filename: 'custom_chart_0.js',
      path: path.resolve(__dirname, 'build'),
      publicPath: '/plugins/',
      library: { name: 'CustomChart0', type: 'umd' },
      globalObject: 'this',
    },
    // В externals только react и react-dom: их отдаёт ядро. Библиотеку отрисовки шаблон
    // не выбирает; выбрав ECharts, не добавляй её в externals — ядро отдаёт через
    // window.echarts версию 5.6.0, а модульный импорт echarts/core в window не пишет,
    // поэтому версии сосуществуют.
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    module: {
      rules: [
        {
          test: /\.m?jsx?$/,
          exclude: /node_modules/,
          use: { loader: 'swc-loader', options: swcJs },
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: { loader: 'swc-loader', options: swcTs },
        },
        {
          test: /\.(scss|css)$/i,
          use: ['style-loader', 'css-loader', { loader: 'sass-loader', options: { implementation: require('sass') } }],
        },
      ],
    },
    devServer: {
      // publicPath для devMiddleware не задаём — он по умолчанию берётся из output.publicPath.
      static: { directory: path.resolve(__dirname, 'prebuild') },
      hot: true,
      historyApiFallback: true,
      port: process.env.PORT || 7000,
      client: {
        // Ошибки рантайма уходят только в консоль браузера: полноэкранный оверлей
        // «Uncaught runtime errors» закрывает портал целиком. Ошибки сборки оверлей
        // показывает — без успешной сборки бандла плагина нет вовсе.
        overlay: { errors: true, warnings: false, runtimeErrors: false },
      },
    },
  };
};
