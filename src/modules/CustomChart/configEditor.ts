import type { ChartConfig, ChartField } from './plugin.types';

/**
 * Редактор конфига плагина.
 *
 * Ядро создаёт экземпляр без аргументов и зовёт его методы, когда пользователь перетаскивает
 * пилюлю на полку. Методы ниже возвращают `config` без изменений: конфиг после перетаскивания
 * остаётся таким, каким пришёл.
 *
 * Плагину, которому нужна реакция на перетаскивание, обычно нужны два поведения сверх этих
 * методов:
 *
 * - режим группировки — включается, когда занята хотя бы одна группирующая полка, и определяет,
 *   уходит ли поле в `group by` запроса. Набор группирующих полок задаёт сам плагин, и он обязан
 *   совпадать с тем, что использует `remapData` в [dataAdaptor.ts](dataAdaptor.ts): иначе режим
 *   группировки и фактическая форма строки данных разойдутся;
 * - автоагрегация — полям группирующих полок агрегация не ставится, полю полки «Значения»
 *   ставится `sum` по умолчанию.
 */
export default class ConfigEditor {
  /** Ядро зовёт при добавлении новой пилюли на полку. */
  addField(
    config: ChartConfig,
    _axisName: string,
    _fieldIndex: number,
    _fieldItem: ChartField,
    _type: string,
  ): ChartConfig {
    return config;
  }

  /** Ядро зовёт, когда на полку добавляются сразу все поля датасета. */
  addAllFields(config: ChartConfig, _datasetId: string, _datasets: unknown): ChartConfig {
    return config;
  }

  /** Ядро зовёт при изменении уже стоящей на полке пилюли (например, смена агрегации). */
  updateField(config: ChartConfig, _axisName: string, _fieldIndex: number, _fieldItem: ChartField): ChartConfig {
    return config;
  }
}
