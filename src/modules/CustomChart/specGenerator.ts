import ComponentTypeManager from '../../managers/ComponentTypeManager';

export default class SpecGenerator {
  /**
   * Тип компонента, который ядро передаёт в конструктор (`custom-chart-N`).
   * Поле публичное намеренно: сам генератор его пока не читает, но контракт ядра
   * подразумевает, что экземпляр знает свой тип, — прятать его в `private` значит
   * держать заведомо мёртвое объявление.
   */
  public readonly type: string;

  constructor(type: string) {
    this.type = type;
  }

  /**
   * Спека компонента, созданного по умолчанию. Идёт через `ComponentTypeManager`, а не
   * напрямую по `type` — тот же путь, каким ядро создаёт спеку нового компонента; `spec`
   * дефолтного компонента у шаблона пуст (`{}`), но структура вызова совпадает со штатной.
   */
  static getDefaultSpec(type: string): Record<string, unknown> {
    const defaultComponent = new ComponentTypeManager(type).getDefaultComponent();
    return defaultComponent.spec || {};
  }

  getSpec = (): Record<string, unknown> => ({});

  getVisualStructure = (): unknown[] => [];
}
