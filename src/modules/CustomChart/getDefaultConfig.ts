import type { ChartConfig } from './plugin.types';

import defaultConfigJson from './defaultConfig.json';

/** JSON-импорт сужается один раз: `resolveJsonModule` не знает про наши union-типы. */
const defaults: unknown = defaultConfigJson;

/** Отдаёт свежую копию дефолтов: ядро вправе править полученный объект. */
export const getDefaultConfig = (): ChartConfig => structuredClone(defaults) as ChartConfig;
