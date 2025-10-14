import tinycolor from 'tinycolor2';
import i18n from 'i18next';
import _ from 'lodash';

import {getFormula, replaceCustomFunctions} from '../../helpers/tree';
import {
  getCategoryField,
  getDatasetId,
  getIsPinned,
  getPartsExpression,
  getPartsParent,
  getQueryObjectVariables,
  getTitle,
  hsQuote
} from '../../helpers';
import {
  getAliasSuffix,
  modifyGroupForSqlPivotExport,
  modifySelectForSqlPivotExport
} from '../CommonChartAdaptor/_helpers';
import { removeDateTZ } from '../../constants/formatOptions';
import { getHasTooltipField } from '../../helpers';


export default class DataAdaptor  {

  constructor(data, config, spec, cacheId) {
    this.cacheId = cacheId;
    this.source = [];
    this.aggregated = [];
    this.plotData = [];

    this.refresh = this.refresh.bind(this);
    this.remapData = this.remapData.bind(this);
    if (data) {
      this.refresh(data, config, spec, cacheId);
    }
  }

  refresh(data, config, spec, cacheId) {
    const allFields = _.flatMap(((config || {}).axes || []), 'fields');
    const datasetId = getDatasetId(config);
    if (data) {
      this.cacheId = cacheId;
      this.source[datasetId] = (
        DataAdaptor.seriesLimitToShow(
          DataAdaptor.rowsLimitToShow(
            data, config
          ),
          config
        )
      );
      this.aggregateBypass(this.source[datasetId], config, allFields);
      this.remapData(config);
    }
  }

  static rowsLimitToShow(data, config) {
    const isLimited = _.some(data, column => {
      return (
        _.isArray(column) &&
        !!config.rowsLimitToShow &&
        column.length > config.rowsLimitToShow
      );
    });

    if (isLimited) {
      return _.map(data, (column) => {
        if (_.isArray(column)) {
          return column.slice(0, config.rowsLimitToShow);
        }
        return column;
      });
    }

    return data;
  }

  static seriesLimitToShow(data, config) {
    const isLimited = _.some(data, column => {
      return (
        _.isArray(column) &&
        !!config.seriesLimitToShow &&
        !_.isUndefined((column[0] || {}).categories) &&
        !_.isUndefined((column[0] || {}).series)
      );
    });

    if (isLimited) {
      return _.map(data, (column) => {
        if (_.isArray(column)) {
          return DataAdaptor.applySeriesLimit(column, config);
        }
        return column;
      });
    }

    return data;
  }

  static applySeriesLimit(column, config) {
    const columnNew = [];
    const counter = {};

    for (let i = column.length - 1; i >= 0; i -= 1) {
      const row = column[i];
      counter[row.categories] = counter[row.categories] || {};
      counter[row.categories][row.series] = 1;
      if (Object.keys(counter[row.categories]).length <= config.seriesLimitToShow) {
        columnNew.unshift(row);
      }
    }

    return columnNew;
  }

  static getPatternValue(selected, func, agg) {

    if (func === 'КоличествоЗначений') {
      return selected.length;
    }

    if (func === 'Максимум') {
      if (_.isEmpty(selected)) {
        return null;
      }
      return _.max(selected);
    }

    if (func === 'Минимум') {
      if (_.isEmpty(selected)) {
        return null;
      }
      return _.min(selected);
    }

    if (func === 'Сумма') {
      if (_.isEmpty(selected)) {
        return null;
      }
      return _.sum(selected);
    }

    return null;
  }

  static replaceVariables(calc, config) {
    let calcNew = _.cloneDeep(calc);

    if (calcNew.includes('$Фильтр.')) {
      const re = /\$Фильтр\.(.+)\.(.+)\((.*)\)\$/g;
      let match = re.exec(calcNew);
      while (match) {
        const pattern = match[0];
        const fieldName = match[1];
        const func = match[2];
        const agg = match[3];
        const filtersAxe = _.find(config.axes, ['type', 'filters']);
        const filterField = _.find(
          ((filtersAxe || {}).fields || {}), (f) => (fieldName === (f.title || f.alias || f.name))
        ) || {};
        const filterActive = _.find(
          config.filters,
          (filter, filterName) => (filterName === filterField.name)
        );
        const patternValue = DataAdaptor.getPatternValue(((filterActive || {}).selected || []), func, agg);
        calcNew = calcNew.replace(pattern, `${patternValue}`);
        match = re.exec(calcNew);
      }
    }

    if (calcNew.includes('$Категория$')) {
      const categoriesAxe = _.find(config.axes, ['type', 'categories']);
      let categoryFieldName = getPartsExpression(
        (((categoriesAxe || {}).fields || {})[0] || {}).name
      );

      if (!categoryFieldName) {
        categoryFieldName = 'undefined';
      }

      calcNew = calcNew.replace(/\$Категория\$/g, `${categoryFieldName}`);
    }

    if (calcNew.includes('$Серия$')) {
      const seriesAxe = _.find(config.axes, ['type', 'series']);
      const seriesFieldName = getPartsExpression(
        (((seriesAxe || {}).fields || {})[0] || {}).name
      );
      if (seriesFieldName) {
        calcNew = calcNew.replace(/\$Серия\$/g, `${seriesFieldName}`);
      }
    }

    if (calcNew.includes('$Значение$')) {
      const valuesAxe = _.find(config.axes, ['type', 'values']);
      const selectedIndex = valuesAxe.selectedFieldIndex >= 0 ? valuesAxe.selectedFieldIndex : 0;
      const valuesFieldName = getPartsExpression(
        (((valuesAxe || {}).fields || {})[selectedIndex] || {}).name
      );
      if (valuesFieldName) {
        calcNew = calcNew.replace(/\$Значение\$/g, `${valuesFieldName}`);
      }
    }

    return calcNew;
  }

  static getQueryObjects(config_, exportMode = null, settings = {}) {
    const config = _.cloneDeep(config_);
    let axes = (config || {}).axes;
    const series = (config || {}).series || {};
    const options = { seriesAutoFill: series.autoFill || false };

    // если оси пустые - возвращаем false
    if (!axes || _.isEmpty(axes)) return false;

    // сортируем оси, чтобы вначале шли серии и категории
    axes = _.sortBy(axes, (axe) => {
      switch (axe.type) {
        case 'series':
          return -2;
        case 'categories':
          return -1;
        default:
          return 0;
      }
    });

    // готовим секцию order
    let order = this.getOrderSection(axes, exportMode, config);
    order = this.sortByOrderIndex(order);

    // готовим секции select и group, добавляем трейсы в объект
    const queryObjects = this.createQueryObjectsWithTraces(axes, exportMode, config, order, options, settings);

    // заменяем countd на count и флаг distinct
    _.forEach(queryObjects, (queryObject) => {
      _.forEach(queryObject.select, (field) => {
        if (field.aggr === 'countd') {
          field.aggr = 'count';
          field.distinct = 1;
        }
      });
    });

    // добавляем поле лимита количества строк
    _.forEach(queryObjects, (queryObject) => {
      queryObject.limit = config.rowsLimit;
    });

    // сбрасываем агрегации в режиме подытогов
    if (config.subMode) {
      _.forEach(queryObjects, (queryObject) => {
        _.forEach(queryObject.select, (field_) => {
          field_.aggr = '';
        });
      });
    }

    if (config.groupByOptimization) {
      queryObjects.groupByOptimization = true;
    }

    return queryObjects;
  }

  static createQueryObjectsWithTraces(axes, exportMode, config, order, options, settings = {}) {
    const queryObjects = [];
    let select = [];
    const selectGroup = [];
    const where = [];
    const having = [];
    const group = [];
    const categoryAxe = _.find(config.axes, ['type', 'categories']) || {};
    const categoryField = getCategoryField({ config });
    let variables;
    if (!_.isEmpty(config.variables)) {
      variables = getQueryObjectVariables({ variables: config.variables });
    }

    // цикл по осям для заполненеия веток select и group
    _.map(axes, (axis) => {

      // поля существуют и не пусты
      if (axis.fields && !_.isEmpty(axis.fields)) {

        const fieldsExtra = [];
        _.forEach(axis.fields, (field) => {
          if (field && field.labelByFieldName) {
            fieldsExtra.push({
              name: field.labelByFieldName,
              calc: undefined,
              agg: 'max',
              order: field.order,
              orderIndex: field.orderIndex,
              alias: field.alias + '_labelBy',
              id: field.id + '_labelBy',
              fieldAlias: field.labelByFieldName
            });
          }

          if (field && field.colorByFieldName) {
            // const valuesAxe = _.find(config.axes, ['type', 'values']) || {};
            // const valuesField = (valuesAxe.fields || [])[0] || {};
            const hasCategory = ((categoryAxe || {}).fields || []).length > 0;
            fieldsExtra.push({
              name: field.colorByFieldName,
              calc: undefined,
              agg: hasCategory ? 'max' : undefined,
              order: field.order,
              orderIndex: field.orderIndex,
              alias: `${field.alias}_${field.colorByFieldName}_colorBy`,
              id: `${field.id}_${field.colorByFieldName}_colorBy`,
              fieldAlias: field.colorByFieldName
            });
          }
        });

        // цикл по полям
        _.map(_.concat(axis.fields, fieldsExtra), (field, fieldIndex) => {
          if (field) {
            const column = (!_.isEmpty(config.columns) && config.columns[field.id]) || {};

            const valueVisible = getIsPinned({ field, categoryField });

            // реальный title колонок таблиц reactabular для экспорта
            const columnTitle = (exportMode) ? column.title || null : null;

            const fieldAlias = columnTitle || getTitle(field) || field.alias || field.name;
            const calc = this.getCalc(field, config);

            let alias = `[${axis.type}]`;

            const exportObject = {
              isSub: field.isSub,
              subAllAgg: field.aggSubAll,
              subAgg: field.agg,
              fieldType: field.type,
              precision: ((config.columns || {})[field.id] || {}).precision,
              hidden: ((config.columns || {})[field.id] || {}).hidden,
              prop: field.prop
            };

            switch (axis.type) {

              /** Оси фильтров **/
              case 'filters' :
                if (field.type === 'calculated' && field.filterSqlType === 'having') {
                  const havingObj = {
                    name: field.name,
                    calc: hsQuote(calc),
                    aggr: field.agg ? field.agg : '',
                    alias,
                    id: field.id,
                    fieldAlias
                  };
                  if (calc) havingObj.lvl = field.lvl || 0;
                  having.push(havingObj);
                }
                else if (field.filterSqlType === 'where' || !field.filterSqlType) {
                  const whereObj = {
                    name: field.name,
                    aggr: field.agg ? field.agg : '',
                    alias,
                    id: field.id,
                    fieldAlias,
                    lvl: field.lvl || 0
                  };
                  where.push(whereObj);
                }
                break;
              //

              /** Группирующие оси **/
              case 'categories' :
              case 'series' :
                const aliasSuffix = getAliasSuffix(axis, field, config.chartType);

                if (config.chartType !== 'table') {
                  selectGroup.push({
                    name: field.name,
                    calc: hsQuote(calc),
                    aggr: field.agg ? field.agg : '',
                    alias: alias + aliasSuffix,
                    id: field.id,
                    fieldAlias,
                    visibleOrder: column.visibleOrder,
                    export: exportObject
                  });
                }

                if (field.sortByFieldValue) {
                  selectGroup.push({
                    name: (field.sortByFieldValue || '').includes('$!$') ? getPartsParent(field.sortByFieldValue) : field.sortByFieldValue,
                    calc: (field.sortByFieldValue || '').includes('$!$') ? getPartsExpression(field.sortByFieldValue) : undefined,
                    aggr: field.sortByAgg || 'max',
                    alias: `${alias + aliasSuffix}_sortBy`,
                    id: `${field.id}_sortBy`,
                    fieldAlias: field.sortByFieldName,
                    visibleOrder: column.visibleOrder,
                    export: exportObject
                  });

                  if (field.tooltipBy) {
                    selectGroup.push({
                      name: field.tooltipBy,
                      calc: undefined,
                      aggr: 'max',
                      alias: 'tooltip',
                      id: field.id + '_tooltipBy',
                      fieldAlias: field.tooltipBy,
                      visibleOrder: column.visibleOrder,
                      export: exportObject,
                      valueType: 'tooltip'
                    });
                  }
                }

                // добавляем группирующие поля в group, повторения по имени поля исключаем
                if (!_.some(group, ['name', field.name])) {
                  group.push({
                    name: hsQuote(calc) || field.name,
                    calc: hsQuote(calc),
                    alias: alias + aliasSuffix,
                    id: field.id,
                    fieldAlias,
                    direction: field.order
                  });
                }
                break;

              /** оси параллельных координат **/
              case 'dimension' :
                alias = `[${field.name}]`;

                select.push({
                  name: field.name,
                  calc: hsQuote(calc),
                  aggr: field.agg ? field.agg : '',
                  alias,
                  id: field.id,
                  fieldAlias
                });

                if (field.agg) {
                  group.push({
                    name: field.name,
                    calc: hsQuote(calc),
                    alias,
                    id: field.id,
                    fieldAlias
                  });
                }

                // достигли последнего поля оси
                if (fieldIndex === axis.fields.length - 1) {
                  queryObjects.push({
                    select,
                    group,
                    order,
                    options,
                    having,
                    where,
                    variables
                  });
                }
                break;

              /** Оси связей **/
              case 'identity' :
              case 'linkage' :
                // добавляем поля значений в select
                select.unshift({
                  name: ((field.parameters) ? [field.name, ...field.parameters] : field.name),
                  calc: hsQuote(calc),
                  aggr: (field.agg) ? field.agg : '',
                  alias,
                  id: field.id,
                  fieldAlias,
                  visibleOrder: column.visibleOrder,
                  export: exportObject
                });
                break;


              /** оси значений **/
              case 'values' :
              case 'xvalues' :
              case 'yvalues' :
              case 'rows' :
              case 'columns' :
              case 'keys' :
                if (valueVisible) {
                  let aggr = (field.agg) ? field.agg : '';

                  const selectObj = {
                    name: ((field.parameters) ? [field.name, ...field.parameters] : field.name),
                    calc: hsQuote(calc),
                    aggr,
                    alias: '[values]',
                    id: field.id,
                    fieldAlias,
                    visibleOrder: column.visibleOrder,
                    export: exportObject,
                    lvl: field.lvl || 0,
                    valueType: field.valueType
                  };

                  if (settings.isSqlPivot) {
                    modifySelectForSqlPivotExport({ axis, field, selectObj });
                  }

                  select.unshift(selectObj);

                  // для каждого значения записываем отдельный трейс
                  queryObjects.push({
                    select: _.concat(select, selectGroup),
                    group,
                    order,
                    options,
                    having,
                    where,
                    variables
                  });
                }

                //начинаем формировать новый трейс
                select = [];
                break;

              default :
                break;

            }

            if (settings.isSqlPivot) {
              switch (axis.type) {
                case 'columns' :
                case 'rows' :
                  modifyGroupForSqlPivotExport({ axis, field, config, group, calc, alias, fieldAlias });
                  break;
                default:
                  break;
              }
            }
          }
        });
      }
    });
    return queryObjects;
  }

  static getOrderSection(axes, exportMode, config) {
    const orderGroup = [];
    const orderValue = [];
    const isSunburst = (config.chartType === 'sunburstChart');
    const categoryField = getCategoryField({ config });

    // цикл по осям и полям для расчета order
    _.map(axes, (axis) => {

      if (axis.fields && !_.isEmpty(axis.fields)) {

        _.map(axis.fields, (field, fieldIndex) => {

          const alias = `[${axis.type}]`;
          const isPinned = getIsPinned({ field, categoryField });

          if (field) {
            // реальный title колонок таблиц reactabular для экспорта в PDF
            let columnTitle = null;
            if (
              exportMode === 'pdf' && !_.isEmpty(config.columns) &&
              config.columns[field.id]
            ) {
              columnTitle = config.columns[field.id].title || null;
            }

            const fieldAlias = columnTitle || getTitle(field) || field.alias || field.name;
            const calc = this.getCalc(field, config);


            switch (axis.type) {

              // оси фильтров
              case 'filters' :
                break;

              // группирующие оси
              case 'series' :
              case 'categories' :
                const aliasSuffix = getAliasSuffix(axis, field, config.chartType);

                if (field.order || isSunburst) {
                  if (field.sortByFieldValue) {
                    orderGroup.push({
                      name: (field.sortByFieldValue || '').includes('$!$') ? getPartsParent(field.sortByFieldValue) : field.sortByFieldValue,
                      calc: (field.sortByFieldValue || '').includes('$!$') ? getPartsExpression(field.sortByFieldValue) : undefined,
                      direction: field.order || 'asc',
                      orderIndex: field.orderIndex,
                      alias: `${alias + aliasSuffix}_sortBy`,
                      id: `${field.id}_sortBy`,
                      fieldAlias: field.sortByFieldName
                    });
                  }

                  else {
                    orderGroup.push({
                      name: field.name,
                      calc: hsQuote(calc),
                      direction: field.order || 'asc',
                      orderIndex: field.orderIndex,
                      alias: alias + aliasSuffix,
                      id: field.id,
                      fieldAlias
                    });
                  }
                }

                break;
              //

              // группирующие оси
              case 'subs' :
                orderGroup.unshift({
                  name: field.name,
                  calc: hsQuote(calc),
                  direction: field.order || 'asc',
                  orderIndex: field.orderIndex,
                  alias,
                  id: field.id,
                  fieldAlias
                });
                break;
              //

              // оси значений
              case 'values' :
              case 'xvalues' :
              case 'yvalues' :
              case 'identity' :
              case 'linkage' :
              case 'keys' :
                // добавляем поля значений с сортировкой order
                if (
                  isPinned &&
                  field.order &&
                  !_.find(orderGroup, ['id', (field.sortByFieldName) ? `${field.id}_sortBy` : field.id])
                  // сортировки с совпадающими алиасами выдают ошибку
                ) {
                  orderValue.push({
                    name: field.name,
                    calc: hsQuote(calc),
                    direction: field.order,
                    orderIndex: field.orderIndex,
                    alias: (config.chartType === 'treeGraph') ? alias : '[values]',
                    id: field.id,
                    fieldAlias
                  });
                }

                break;

              default :
                break;
            }
          }
        });
      }
    });

    const orderFields = isSunburst
      // приоритет группирующих осей при сортировке
      ? _.concat(orderGroup, orderValue)
      // приоритет оси значений при сортировке
      : _.concat(orderValue, orderGroup)
    ;

    return _.uniqBy(orderFields, 'id');
  }

  static getCalc(field, config) {
    let calc = '';

    if (field.draft) calc = field.calc;
    else if (field.tree) calc = getFormula(replaceCustomFunctions(_.cloneDeep(field.tree)), { calcMode: true });


    return DataAdaptor.replaceVariables(calc, config);
  }

  static sortByOrderIndex(orderTemp) {
    const order = [];

    // строим массив упорядоченных полей без дублирования
    const orderedFields = (
      _.sortBy(
        _.uniqBy(
          _.filter(
            orderTemp,
            field => !!field.orderIndex
          ),
          'orderIndex'
        ),
        'orderIndex'
      )
    );

    // цикл по всем возможным порядкам сортировки
    for (let orderIndex = 1; orderIndex < orderTemp.length + 1; orderIndex += 1) {
      // ищем для данного порядка сортировки поле среди упорядоченных полей
      const orderedField = _.find(orderedFields, ['orderIndex', orderIndex]);

      // если поле есть среди упорядоченных - берем его
      if (orderedField) {
        order.push(orderedField);
      }
      // если нет - заполняем одним из оставшихся неупорядоченных
      else {
        const unorderedField = _.find(orderTemp, field => {
          return (
            !_.find(orderedFields, ['id', field.id]) &&
            !_.find(order, ['id', field.id])
          );
        });
        if (unorderedField) {
          order.push(unorderedField);
        }
      }
    }

    // очищаем порядки сортировки
    _.forEach(order, field => {
      if (field && _.isObject(field)) {
        delete field.orderIndex;
      }
    });

    return order;
  }

  // дополняем уже сгруппированные данные после получения с бэкенда
  aggregateBypass(data, config, allFields) {
    const self = this;
    const queryObjects = DataAdaptor.getQueryObjects(config);
    const hasValues = _.some(queryObjects, (queryObject) => {
      return _.findIndex(queryObject.select, d => d.alias === '[values]') >= 0;
    });

    const dataNew = hasValues ? (data || []) : [data];

    self.aggregated = [];
    _.forEach(queryObjects, (queryObject, traceIndex) => {
      const valuesField = _.find(queryObject.select, (d) => (d.alias === '[values]'));
      const configField = _.find(
        allFields,
        (f) => {
          return ((f && valuesField) ? f.id === valuesField.id : false);
        }
      ) || {};
      const title = configField['title__' + i18n.language] || configField['title'] || '';
      const alias = configField.alias || '';

      if (!valuesField.hideResult) {
        // дополняем каждую точку оси значений данными из исходного запроса
        self.aggregated.push(_.map(dataNew[traceIndex], (item) => {
          let itemNew = {};
          if (valuesField) {
            const aggSuffix = (valuesField.aggr) ? ` (${valuesField.aggr})` : '';
            const traceKey = (config.chartType === 'pieChart')
              ? (item || {}).categories
              : (configField.type === 'calculated')
                ? configField.id
                : `${alias || valuesField.name}${aggSuffix}`
            ;
            itemNew = {
              name: `${valuesField.name}${aggSuffix}`,
              ID: configField.ID || '',
              id: valuesField.id,
              fieldName: valuesField.name,
              fieldAlias: alias || '',
              fieldTitle: title || '',
              traceKey
            };
          }

          return Object.assign({}, item, itemNew);
        }));
      }
    });
  }

  remapData(config) {
    const self = this;
    //const traceType = config.visualType;
    let seriesAxe = _.find(config.axes, ['type', 'series']);
    const categoryAxe = _.find(config.axes, ['type', 'categories']) || {};
    const valueAxe = _.cloneDeep(_.find(config.axes, ['type', 'values']) || {});
    const categoryField = (categoryAxe.fields || [])[categoryAxe.selectedFieldIndex] || null;

    if (seriesAxe) {
      seriesAxe = (
        (seriesAxe.selectedFieldIndex === -1) || // -1 = отключено, -2 = все
        (seriesAxe.fields.length === 0)
      ) ? undefined : seriesAxe;
    }

    // добавляем фиктивную пилюлю типа 'tooltip', аналогичную добавленной при генерации запроса
    if (getHasTooltipField(config)) {
      let tooltipField = _.find((categoryAxe || {}).fields, field => !!field.tooltipBy);
      if (!tooltipField) {
        tooltipField = _.find((seriesAxe || {}).fields, field => !!field.tooltipBy);
      }

      if (tooltipField) {
        valueAxe.fields.push({
          name: tooltipField.tooltipBy,
          aggr: 'max',
          alias: 'tooltip',
          id: tooltipField.id + '_tooltipBy',
          fieldAlias: tooltipField.tooltipBy,
          valueType: 'tooltip'
        });
      }
    }

    this.plotData = [];
    let thresholds = [];
    // данные после агрегации не пусты
    if (!_.isEmpty(self.aggregated)) {
      _.map(_.cloneDeep(self.aggregated), (rowData, index) => {
        // Remap data props according to datagroup (trace) number if series disabled
        if (!_.isEmpty(rowData)) {
          let newRowData = [];
          let valueField = _.find(valueAxe.fields || [], ['id', rowData[0].id]) || {}; // source valueAxis fied

          /*
           const valueFieldIndex = _.findIndex(valueAxe.fields || [], valueField);
           const valueVisible = (
           !valueField.pinToDrill ||
           _.isEmpty(valueField.pinToDrill) ||
           (valueField.pinToDrill || []).includes((categoryField || {}).id)
           );
           */

          if (!valueField.hideResult) {

            /** С СЕРИЯМИ **/
            if (seriesAxe) {
              // получаем список всех уникальных серий
              const series = _.uniq(_.map(rowData, (v) => (v.series && typeof v.series === 'string')
                ? v.series.trim()
                : (_.isNumber(v.series))
                  ? `${(v.series || 0)}`
                  : `${v.series}`
              ));

              // Добавляем '0' к ключам сгруппированного по категориям объекта (для сохранения сортировки)
              const categories = _.groupBy(rowData, (o) => (`0${o.categories}`));
              let dataIdx = 0;
              _.map(categories, (category) => {
                const newItem = _.reduce(
                  _.mapValues(
                    category,
                    (data, i) => {
                      // source valueAxis field
                      valueField = _.find(valueAxe.fields || [], ['id', data.id]) || {};
                      // create remapped data object
                      return _.transform(data, (row, v, k) => {
                        //const trimmed = (typeof v === 'string') ? v.trim() : v;
                        const value = removeDateTZ(v);
                        if (k === 'values') {
                          switch (valueField.valueType) {
                            case 'threshold' :
                              // grab thresholds to array
                              if (_.isNumber(v)) {
                                thresholds.push({
                                  title: valueField.title || '',
                                  value: v
                                });
                                thresholds = _.sortBy(_.uniqBy(thresholds, 'value'), 'value');
                              }
                              break;
                            case 'tooltip' :
                              // Тултип серии
                              if (!self.plotData[dataIdx][`${data.series}`]) {
                                self.plotData[dataIdx][`${data.series}`] = {};
                              }
                              _.set(self.plotData[dataIdx][`${data.series}`], 'tooltip', data.values);
                              // Общий тултип
                              if (categoryField) {
                                _.merge(self.plotData[dataIdx], { tooltip: data.values });
                              }
                              break;
                            case 'color' :
                              _.merge(self.plotData[dataIdx], { [valueField.valueType]: (data.values) ? tinycolor(data.values).toRgbString() : data.values });
                              break;
                            case 'subheader' :
                              _.merge(self.plotData[dataIdx], { [valueField.valueType]: data.values });
                              break;
                          }
                          delete row['values'];
                        }
                        else if (k === 'series') {
                          /** Series: replace field key with a pair 'alias: value' **/
                          if (!row[`${v}`]) {
                            row[`${v}`] = {};
                          }
                          _.set(row[`${v}`], 'value', data.values);
                          delete row['series'];
                        }
                        else {
                          /** categories etc. **/
                          row[k] = value; // pass other keys "as is"

                          if (k === 'categories' && config.chartType === 'pieChart') {
                            const visual = _.find(config.visuals || [], ['anchor', v]) || {};
                            // pie chart reassign legend
                            row.title = visual.label || v;
                          }

                        }
                      }, {});
                    }
                  ),
                  _.assign,
                  {
                    // assign new fields to data object
                    series,
                    thresholds
                  }
                );
                newItem.seriesField = _.head(seriesAxe.fields || []); /*seriesAxe.fields[0].title || seriesAxe.fields[0].alias || seriesAxe.fields[0].name;*/
                newItem.categoryField = _.cloneDeep(categoryField);

                newRowData.push(newItem);
                dataIdx += 1;
              });
              // Отдаем данные
              if (index === 0) {
                self.plotData = newRowData || [];
              }
            }

            /** БЕЗ СЕРИЙ **/
            else {
              // Transform trace fieldnames to 'fieldName0', 'values0' ... etc. According to trace index.
              newRowData = _.map(rowData, (data, dataIdx) => {
                data.categories = removeDateTZ(data.categories);
                // source valueAxis field
                valueField = _.find(valueAxe.fields || [], ['id', data.id]) || {};

                // Remap trace keys
                const remapped = {};
                _.merge(remapped, _.mapKeys(data,
                  (v, k) => {
                    /** For non-value fields remap 'value' to (minimum, maximum, color, threshold... etc.) **/
                    if (valueField.valueType && valueField.valueType !== 'value') {
                      if (k === 'values') {
                        // split values by field valueType
                        switch (valueField.valueType) {
                          case 'threshold' : // grab thresholds to array
                            if (_.isNumber(v)/* && dataIdx === rowData.length - 1*/) {
                              thresholds.push({
                                title: valueField.title || '',
                                value: v
                              });
                            }
                            break;

                          case 'color':
                            // parse any colors (rgb, hsl, hex with or without '#') to rgb
                            remapped.color = (v) ? tinycolor(v).toRgbString() : v;
                            break;

                          default : // minimum, maximum, etc...
                            return valueField.valueType;
                        }
                      }
                    }
                    /** Normal fields (do not remap categories and series) **/
                    else if (k !== 'thresholds') {
                      if (k === 'categories') {
                        remapped.categoryField = _.cloneDeep(categoryField);
                        if (config.chartType === 'pieChart') {
                          // pie chart legend title
                          const visual = _.find(config.visuals || [], ['anchor', v]) || {};
                          remapped.title = visual.label || v; // pie chart reassign titles
                        }

                      }
                      return (k === 'tooltip' || k === 'categories' || k === 'series' || k === v)
                        ? k
                        : k + index;
                    }
                  }
                ));
                remapped.thresholds = _.sortBy(_.uniqBy(thresholds, 'value'), 'value');
                _.unset(remapped, undefined); // remove empty output for thresholds
                return remapped;
              });
              // Merge all aggregated data to one array
              _.merge(self.plotData, newRowData || []);
            }
          }
        }
      }, true);

    }
    //console.log(this.plotData);
    return this.plotData;
  }
}
