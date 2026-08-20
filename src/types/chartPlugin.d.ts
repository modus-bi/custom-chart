/**
 * КОПИЯ контракта ядра ModusBI из <портал>/api/chartPlugin.d.ts
 *
 * contractVersion: 1.0.0
 * coreVersion:     3.16.3
 * скопировано:     2026-08-20
 *
 * Не редактировать вручную. При обновлении ядра заменить файл целиком
 * из prebuild/api/chartPlugin.d.ts и обновить версии в этой шапке.
 */

/**
 * Контракт подключаемого плагина-визуализации.
 *
 * Плагин собирается отдельным репозиторием в UMD-бандл `custom_chart_N.js` и подключается
 * к ядру через алиас `custom-chart-N`. Ядро разбирает бандл в пяти местах:
 * `charts/ValidCharts.ts`, `managers/customChartHelpers.js`, `store/editorReducer.js`,
 * `components/ComponentEditor/AxesPanel/AxesPanelHelpers.js` и
 * `components/ComponentEditor/RightDrawerPanel/SettingsDrawer/SettingsDrawerHelpers.js`.
 *
 * Файл едет вместе со сборкой ядра: `src/static` копируется в `dist` целиком, а `frontend-update.js`
 * раскладывает `dist` по строкам таблицы `frontend_file`. Отдельного шага публикации нет.
 * Он же — источник истины: `types/visualization/chartPlugin` внутри ядра только реэкспортирует его,
 * а `types/visualization/chartPlugin.conformance` проверяет на сборке, что контракт не разошёлся с кодом.
 *
 * Файл описывает форму и обязательность экспортов, сигнатуры методов и то, что ядро
 * фактически передаёт в каждый из них. Внутренние структуры (`config`, `field`, `axe`,
 * `spec`, `data`) намеренно оставлены нераскрытыми: в ядре они заданы на JavaScript без типов,
 * и любое их описание здесь было бы реверс-инжинирингом, который начнёт врать при первом же
 * изменении ядра. TODO: раскрывать их по мере типизации соответствующих модулей ядра —
 * псевдонимы для этого и заведены отдельными типами.
 */

import type { ComponentType, ReactNode } from 'react';

/*
 * Нераскрытые структуры объявлены через `any`, а не `unknown`, сознательно.
 * `unknown` не даёт плагину сузить поле контекста до своего конкретного типа: метод плагина
 * перестаёт считаться совместимым с контрактом, и проверка в `chartPlugin.conformance.ts`
 * падает на коде, который корректен в runtime. Тот же приём применён в `charts/ValidCharts.types.ts`
 * для загрузчика чартов. Когда соответствующий модуль ядра будет типизирован, `any` здесь
 * заменяется на реальный тип, и проверка соответствия становится строже без правок в плагинах.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Конфигурация компонента отчёта. Форма задана в ядре на JavaScript и здесь не раскрыта. */
export type PluginConfig = any;

/** Поле (пилюля), лежащее на полке осей. Форма задана в ядре на JavaScript и здесь не раскрыта. */
export type PluginField = any;

/** Полка осей. Форма задана в ядре на JavaScript и здесь не раскрыта. */
export type PluginAxis = any;

/** Спецификация запроса данных. Форма задана в ядре на JavaScript и здесь не раскрыта. */
export type PluginSpec = any;

/** Данные, пришедшие с бэкенда для компонента. Форма задана в ядре и здесь не раскрыта. */
export type PluginData = any;

/** Props компонента ядра, прокинутого в плагин. Форма задана в ядре и здесь не раскрыта. */
export type PluginInjectedProps = any;

/** Карта «тип полки -> отображаемое имя», из `constants/axisOptions`. */
export type AxisNames = Record<string, string>;

/**
 * Компонент отчёта целиком — как он лежит в состоянии редактора.
 * Ядро передаёт его в `sortAxes` и в `CustomSettings`.
 */
export interface PluginComponent {
  /*
   * Ядро всегда передаёт объект целиком. `spec` и `configDraft` помечены необязательными
   * не потому, что могут не прийти, а чтобы плагин мог сузить тип до нужных ему полей:
   * без этого его метод перестал бы считаться совместимым с контрактом.
   */

  /** Тип компонента: `CustomChart0`…`CustomChart40`, `CustomChartGraph`. */
  type: string;
  config: PluginConfig;

  /** Спецификация запроса данных, с которой компонент был построен. */
  spec?: PluginSpec;

  /** Черновик конфигурации, ещё не применённый кнопкой «Применить». */
  configDraft?: PluginConfig;
}

/** Базовый контекст, общий для большинства методов контракта осей. */
export interface AxeContextBase {
  config: PluginConfig;

  /** Тип компонента, для которого ядро ищет плагин. */
  componentType: string;
}

/** Контекст `isVisibleAxe`. Единственный метод осей, которому ядро не передаёт `componentType`. */
export interface VisibleAxeContext {
  axe: PluginAxis;
  config: PluginConfig;
}

/** Контекст `sortAxes`. */
export interface SortAxesContext {
  config: PluginConfig;
  component: PluginComponent;
  axisNames: AxisNames;
}

/** Контекст `isDisabledAxe`. */
export interface DisabledAxeContext extends AxeContextBase {
  axe: PluginAxis;
  field: PluginField;

  /** Индекс поля на полке — совпадает с порядком отрисовки пилюль. */
  fieldIndex: number;
}

/** Контекст `isVisibleField`, `getAxeIconColor`. */
export interface AxeFieldContext extends AxeContextBase {
  axe: PluginAxis;
  field: PluginField;
}

/** Контекст `getAxeName`. */
export interface AxeNameContext extends AxeContextBase {
  axe: PluginAxis;
  axisNames: AxisNames;
}

/** Контекст `renderAxeIcon`. Иконочные компоненты ядро прокидывает в плагин само. */
export interface RenderAxeIconContext extends AxeFieldContext {
  axisNames: AxisNames;

  /** Компонент шрифтовой иконки ядра (`HsFontIcon`). */
  HsMuiFontIcon: ComponentType<PluginInjectedProps>;

  /** Компонент SVG-иконки ядра (`HsSvgIconMui5`). */
  HsMuiSvgIcon: ComponentType<PluginInjectedProps>;
}

/** Контекст `renderAxeToggle`. Готовые переключатели ядро прокидывает в плагин само. */
export interface RenderAxeToggleContext extends AxeFieldContext {
  /** Штатный переключатель полки «Значения». */
  valuesToggle: ReactNode;

  /** Штатный переключатель полки «Серии». */
  seriesToggle: ReactNode;
}

/** Контекст `isVisibleAxeDragItemElement`. */
export interface VisibleAxeDragItemElementContext extends AxeContextBase {
  field: PluginField;

  /** Имя элемента пилюли, видимость которого проверяется. */
  elementName: string;
}

/** Контекст `isVisibleAxeDragItemMenuOption`. */
export interface VisibleAxeDragItemMenuOptionContext extends AxeContextBase {
  field: PluginField;

  /** Имя пункта меню пилюли, видимость которого проверяется. */
  optionName: string;
}

/**
 * Контекст `getPillTypeOptions`.
 *
 * @remarks
 * Единственный контекст осей без `componentType`: ядро передаёт тип компонента первым
 * аргументом диспетчера, но в объект пропсов его не кладёт. Обращаться к нему внутри
 * метода нельзя — там будет `undefined`.
 */
export interface PillTypeOptionsContext {
  config: PluginConfig;

  field: PluginField;

  /** Тип полки, на которой лежит пилюля: `values`, `categories`, `series`, `details`, `filters`. */
  axisName: string;

  /** Тип оси в терминах меню пилюли. */
  axisType: string;

  fieldIndex: number;
}

/**
 * Значение параметра «Тип» в меню пилюли.
 * `value` попадает в метаданные отчёта, `name` показывается пользователю.
 */
export interface PillTypeOption {
  name: string;
  value: string;
}

/**
 * Контракт модуля `CustomAxes` — настройка панели осей редактора под визуализацию плагина.
 *
 * Все методы необязательны. Отсутствующий метод не является ошибкой: ядро вернёт `undefined`
 * и в dev-сборке напишет предупреждение в консоль. Но `undefined` для большинства методов
 * означает не «поведение по умолчанию», а «пусто» — полка без имени, скрытая пилюля,
 * пустая панель осей. Реализуй все методы, кроме тех, чьё «пусто» тебя устраивает;
 * исключение — `getPillTypeOptions`, у которого отсутствие корректно означает
 * «использовать штатный список ядра».
 *
 * @remarks
 * Методы объявлены method-синтаксисом намеренно: он даёт бивариантность параметров, и плагин
 * может сузить нераскрытые поля контекста до своих конкретных типов, не ломая совместимость.
 */
export interface CustomAxesModule {
  /** Показывать ли полку. `undefined` скрывает все полки редактора. */
  isVisibleAxe?(props: VisibleAxeContext): boolean;

  /** Порядок и состав полок. `undefined` даёт пустую панель осей. */
  sortAxes?(props: SortAxesContext): PluginAxis[];

  /** Заблокирована ли полка для перетаскивания. */
  isDisabledAxe?(props: DisabledAxeContext): boolean;

  /** Показывать ли пилюлю на полке. */
  isVisibleField?(props: AxeFieldContext): boolean;

  /** Подпись полки. `undefined` оставляет полку без имени. */
  getAxeName?(props: AxeNameContext): string;

  /** Иконка полки. */
  renderAxeIcon?(props: RenderAxeIconContext): ReactNode;

  /** Цвет иконки полки; пустой результат отдаёт цвет из CSS. */
  getAxeIconColor?(props: AxeFieldContext): string;

  /** Переключатель рядом с полкой. */
  renderAxeToggle?(props: RenderAxeToggleContext): ReactNode;

  /** Показывать ли элемент внутри пилюли. */
  isVisibleAxeDragItemElement?(props: VisibleAxeDragItemElementContext): boolean;

  /** Показывать ли пункт меню пилюли. Вызывается порядка 28 раз за один рендер меню. */
  isVisibleAxeDragItemMenuOption?(props: VisibleAxeDragItemMenuOptionContext): boolean;

  /**
   * Список значений параметра «Тип» в меню пилюли.
   *
   * Непустой массив заменяет штатный список ядра. Пустой массив прячет пункт «Тип» целиком.
   * Любое другое значение, включая `undefined`, оставляет штатный список.
   * Элементы без строкового `value` ядро отбрасывает.
   *
   * @example
   * ```ts
   * getPillTypeOptions: ({ axisName }) =>
   *   axisName === 'values'
   *     ? [
   *         { name: 'Значение', value: 'value' },
   *         { name: 'Отсечка', value: 'threshold' },
   *       ]
   *     : [];
   * ```
   */
  getPillTypeOptions?(props: PillTypeOptionsContext): PillTypeOption[];
}

/** Дополнительные опции, которые ядро передаёт редьюсеру плагина третьим аргументом. */
export interface CustomReducersOptions {
  /**
   * Хелпер ядра, применяющий черновик конфигурации к состоянию.
   *
   * Это функция, а не флаг: плагин обязан прогнать через неё изменённое состояние,
   * иначе правка осядет в `configDraft` и не доедет до компонента. Учитывает режим
   * применения по кнопке — при включённом `manualApplySettings` помечает черновик
   * как `dirty` вместо немедленного применения.
   *
   * @see editorReducer
   */
  autoApplySettings: (state: PluginState) => PluginState;
}

/** Состояние редактора отчёта. Форма задана в ядре на JavaScript и здесь не раскрыта. */
export type PluginState = any;

/**
 * Контракт экспорта `CustomReducers` — обработчик действия изменения конфигурации плагина.
 *
 * Ядро подставляет его в корневой редьюсер редактора под ключ `CHANGE_CUSTOM_CHART_N`
 * и вызывает как обычный редьюсер: результат целиком заменяет состояние редактора.
 */
export interface CustomReducersHandler {
  (state: PluginState, action: PluginAction, options: CustomReducersOptions): PluginState;
}

/** Действие Redux, адресованное плагину. Форма задана в ядре и здесь не раскрыта. */
export type PluginAction = any;

/**
 * Готовые куски ядра, которые ядро отдаёт панели настроек плагина.
 *
 * Собираются в `SettingsDrawerHelpers.buildPluginImports` и позволяют плагину переиспользовать
 * штатные секции настроек и UI-компоненты вместо того, чтобы повторять их у себя.
 */
export interface PluginImports {
  /** Готовые секции панели настроек ядра. */
  sections: Record<string, ReactNode>;

  /** UI-компоненты ядра, пригодные для сборки собственных настроек. */
  components: Record<string, ComponentType<PluginInjectedProps>>;

  /** Сервисы ядра, доступные плагину, — в частности сервис модальных окон. */
  services: Record<string, PluginInjectedProps>;
}

/**
 * Props, которые ядро передаёт компоненту `CustomSettings`.
 *
 * @remarks
 * Тип описывает, что приходит в компонент, но не навязывается ему: props React-компонента
 * контравариантны, и плагин, сузивший их до своего набора полей, перестал бы считаться
 * совместимым с контрактом. Поэтому в `ChartPluginModule` компонент объявлен с открытыми
 * props, а этот интерфейс служит документацией и основой для собственного типа плагина.
 */
export interface CustomSettingsProps {
  data: PluginData;

  /** Опции отчёта, в котором живёт компонент. */
  reportOptions: PluginData;

  component: PluginComponent;

  /** Список отчётов портала — нужен настройкам, ссылающимся на другие отчёты. */
  reportlist: PluginData;

  /** Колбэк применения изменений конфигурации; закрыт ядром на нужный номер плагина. */
  changeChart: (...args: any[]) => void;

  pluginImports: PluginImports;
}

/**
 * Контракт экспорта `ConfigEditor` — класса, который редактор просит у плагина без аргументов.
 *
 * @remarks
 * Форма экземпляра здесь не описана: ядро обращается к нему из нетипизированного JavaScript.
 */
export type ConfigEditorConstructor = new () => any;

/**
 * Контракт экспорта `SpecGenerator` — класса, строящего спецификацию запроса данных.
 *
 * Ядро создаёт экземпляр на каждый запрос и передаёт в конструктор тип компонента.
 */
export type SpecGeneratorConstructor = new (type: string) => any;

/**
 * Контракт экспорта `DataAdaptor` — класса, приводящего ответ бэкенда к форме, понятной чарту.
 *
 * Ядро создаёт экземпляр на каждый пересчёт данных.
 */
export type DataAdaptorConstructor = new (
  data: PluginData,
  config: PluginConfig,
  spec: PluginSpec,
  cacheId: string,
) => any;

/**
 * Контракт экспорта `CustomChart` — React-компонента самой визуализации.
 *
 * Помимо роли компонента несёт статический `getDefaultConfig`: ядро зовёт его при создании
 * нового компонента этого типа, до того как компонент будет отрисован хоть раз.
 */
export type CustomChartComponent = ComponentType<PluginInjectedProps> & {
  /** Конфигурация, с которой компонент создаётся в отчёте. */
  getDefaultConfig(): PluginConfig;
};

/**
 * Полный набор именованных экспортов бандла плагина.
 *
 * Все семь обязательны: ядро импортирует каждый статически, и отсутствующий экспорт
 * проявится не при первом обращении, а сломает соответствующую часть редактора.
 */
export interface ChartPluginModule {
  CustomChart: CustomChartComponent;
  CustomReducers: CustomReducersHandler;
  CustomSettings: ComponentType<PluginInjectedProps>;
  CustomAxes: CustomAxesModule;
  DataAdaptor: DataAdaptorConstructor;
  SpecGenerator: SpecGeneratorConstructor;
  ConfigEditor: ConfigEditorConstructor;
}
