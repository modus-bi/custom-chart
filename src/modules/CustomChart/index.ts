/**
 * Публичный контракт модуля `CustomChart`: всё, чем модуль пользуется снаружи, объявлено здесь
 * и только здесь. Потребители импортируют модуль целиком (`from './modules/CustomChart'`),
 * а не его внутренние файлы, — тогда раскладка `model`/`ui`/`hooks`/`lib` остаётся внутренним
 * делом модуля и меняется, не задевая остальной код.
 *
 * Реэкспортируется не всё подряд, а именно граница: контрактные единицы, которые ядро создаёт
 * само, дефолтный конфиг и типы его формы. Вспомогательные функции из `lib/` и компоненты
 * подложки из `ui/` наружу не выводятся — им незачем.
 */
export { default as CustomChart, getDatasetId } from './CustomChart';
export { default as DataAdaptor } from './dataAdaptor';
export { default as SpecGenerator } from './specGenerator';
export { default as ConfigEditor } from './configEditor';

export { getDefaultConfig } from './model/getDefaultConfig';
export { useChartSize } from './hooks/useChartSize';

export type { ChartSize } from './hooks/useChartSize';
export type {
  AxeType,
  ChartAxe,
  ChartConfig,
  ChartField,
  MarginConfig,
  OutlineConfig,
  PlotRow,
} from './model/plugin.types';
