import type { ChartConfig, PlotRow } from './model/plugin.types';

/**
 * Адаптор данных плагина.
 *
 * Ядро создаёт экземпляр на каждый пересчёт данных и читает `plotData`. Цепочка загрузки
 * (`CustomChart.tsx` → `loadDatas` → `ComponentTypeManager.getDataAdaptor`) собрана и работает,
 * но два метода, которые наполняют её содержанием, пусты: `getQueryObjects` не строит запрос,
 * `remapData` не разбирает ответ. Пока они такие, `plotData` остаётся пустым массивом —
 * реализация обоих лежит на плагине.
 */
export default class DataAdaptor {
  /** Id кэша запроса, которым ядро помечает пересчёт данных. */
  cacheId: string;

  /** Сырой ответ бэкенда, разложенный по `datasetId`. */
  source: unknown[];

  /**
   * Массив трейсов — по одному на пилюлю полки «Значения»; каждый элемент несёт строку ответа
   * вместе с метаданными пилюли. Заполняется в `aggregateBypass`, читается в `remapData`.
   */
  aggregated: unknown[];

  /** Строки, которые читает `CustomChart` для отрисовки. */
  plotData: PlotRow[];

  /** Ядро создаёт новый экземпляр на каждый пересчёт данных — не переиспользует старый. */
  constructor(data: unknown, config: unknown, spec: unknown, cacheId: string) {
    this.cacheId = cacheId;
    this.source = [];
    this.aggregated = [];
    this.plotData = [];

    if (data) {
      this.refresh(data, config, spec, cacheId);
    }
  }

  /**
   * Точка пересчёта: сюда приходит новый ответ бэкенда для уже созданного экземпляра.
   * Полная реализация обрезает данные по лимиту строк и серий, кладёт их в `source`
   * под ключом `datasetId`, зовёт `aggregateBypass`, затем `remapData`.
   */
  refresh(_data: unknown, _config: unknown, _spec: unknown, _cacheId: string): void {}

  /**
   * Строит описание запроса к бэкенду из полок конфига: какие поля идут в `select`, какие —
   * в `group by`, какие фильтры и агрегации применить. Компонент зовёт метод до создания
   * адаптора и передаёт результат в `loadDatas` (см. `CustomChart.tsx`).
   *
   * Пустой массив означает пустой запрос: `loadDatas` уходит ни за чем, данных не будет.
   */
  static getQueryObjects(_config: ChartConfig, _exportMode: unknown = null, _settings: unknown = {}): unknown[] {
    return [];
  }

  /**
   * Раскладывает сырой ответ бэкенда по трейсам полки «Значения» и наполняет `aggregated`:
   * `aggregated[индекс_пилюли][индекс_строки]`, где элемент — строка ответа вместе
   * с метаданными своей пилюли.
   */
  aggregateBypass(_data: unknown, _config: ChartConfig, _allFields: unknown[]): void {}

  /**
   * Приводит `this.aggregated` к строкам `plotData`, которые понимает отрисовка
   * (`{ <имя поля измерения>…, <имя поля значения>… }`).
   *
   * Ключи ответа бэкенда приходят алиасами вида `[categories]`, `[categories][0]` — скобки ядро
   * снимает только у части из них (`splitTraces`: `categories`, `series`, `identity`, `linkage`,
   * `node`), остальные остаются с квадратными скобками в имени ключа. Это первое, обо что
   * спотыкается реализация: `row['[categories][0]']`, а не `row.categories`, когда пилюль
   * на полке несколько.
   */
  remapData(_config: ChartConfig): this {
    this.plotData = [];
    return this;
  }
}
