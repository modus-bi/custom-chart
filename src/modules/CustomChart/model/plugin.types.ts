/** Тип полки. Набор полок задаётся в `defaultConfig.json` и читается модулем `CustomAxes`. */
export type AxeType = 'values' | 'categories' | 'series' | 'details' | 'filters';

/**
 * Поле (пилюля) полки в том виде, в каком его хранит конфиг отчёта.
 * Ядро объявляет его как `any`; здесь перечислены только свойства, которые читает плагин.
 */
export interface ChartField {
  id: string;
  name: string;
  title?: string;
  alias?: string;
  type?: string;
  agg?: string;

  /** Id датасета, которому принадлежит поле. По нему `getDatasetId` определяет датасет отчёта. */
  datasetId?: string;
}

export interface ChartAxe {
  name: string;
  title: string;
  type: AxeType;

  /** `-2` — полка принимает несколько пилюль, `0` — ровно одну, `-1` — полка отключена. */
  selectedFieldIndex: number;
  fields: ChartField[];
}

export interface MarginConfig {
  l: number;
  r: number;
  t: number;
  b: number;
  pad: number;
}

export interface OutlineConfig {
  color: string;
  enabled: boolean;
  width: number;
}

/** Форма `config`, которую плагин хранит в отчёте и получает обратно от ядра. */
export interface ChartConfig {
  title: string;
  subtitle: string;
  chartType: string;
  showtitle: boolean;
  noexport: boolean;
  nocopy: boolean;
  filterMode: boolean;
  bgColor: string | null;
  precision: number;
  suffix: string;
  margin: MarginConfig;
  outline: OutlineConfig;
  axes: ChartAxe[];

  /**
   * Значения фильтров компонента. Ядро кладёт их третьим аргументом в `loadDatas`;
   * в `defaultConfig.json` ключа нет — его наполняет сам редактор.
   */
  filters?: unknown;

  /** Лимит строк выборки, который ядро кладёт в запрос. */
  rowsLimit?: number;
}

/** Строка агрегата, как её отдаёт `DataAdaptor.plotData`. */
export type PlotRow = Record<string, unknown>;
