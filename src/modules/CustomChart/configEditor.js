import { defaultFieldOptions } from './constants';
import { nanoid } from 'nanoid';
import { clearNotOrderedFieldsOrderIndex, shiftOrderIndex } from './helpers';

export default class ConfigEditor {
  constructor() {
    this.addField = this.addField.bind(this);
    this.updateField = this.updateField.bind(this);
  }

  addField(config, axisName, fieldIndex, fieldItem, type) {
    // если имя поля пустое - ничего не делаем
    if (!fieldItem) {
      return config;
    }

    // копируем конфиг
    const configNew = structuredClone(config);

    // создаем поле на базе драг-итема
    const fieldNew = _.defaults(
      _.merge({}, _.omit(fieldItem, ['axisName', 'fieldIndex', 'itemType']), { id: fieldItem.name + '_' + nanoid() }),
      defaultFieldOptions,
    );

    // готовим плоский массив всех пилюль
    const allFields = _.flatMap(configNew.axes, 'fields');

    // цикл по всем осям
    configNew.axes.map((axe) => {
      // сбрасываем ось и фильтры, если сменился датасет
      if (!_.find(allFields, ['datasetId', fieldNew.datasetId])) {
        axe.fields = [];
        configNew.filters = {};
        configNew.filtersDefault = {};
        configNew.rules && (configNew.rules = []);
      }

      // на нужную ось добавляем новую пилюлю
      if (axe.name === axisName) {
        axe.fields.splice(fieldIndex, 0, fieldNew);
      }
    });

    // вызываем автоматическое выставление агрегации
    this.setAggregationAuto(configNew.axes);

    delete configNew.expands;

    return configNew;
  }

  addAllFields(config, datasetId, datasets) {
    const configNew = structuredClone(config);
    const axe = _.find(configNew.axes, ['type', 'values']);
    const dataset = _.find(datasets.data, ['ID', datasetId]);

    // сбрасываем ось и фильтры, если сменился датасет
    if (!_.find(_.flatMap(configNew.axes, 'fields'), ['datasetId', datasetId])) {
      configNew.axes.map((axe_) => {
        axe_.fields = [];
      });
      configNew.filters = {};
      configNew.filtersDefault = {};
      configNew.rules && (configNew.rules = []);
      configNew.visuals && (configNew.visuals = []);
    }

    axe.fields = [];
    _.forEach(dataset.fields, (fieldItem) => {
      // создаем поле на базе драг-итема
      const fieldNew = _.defaults(
        _.merge({}, _.omit(fieldItem, ['axisName', 'fieldIndex', 'itemType']), { id: fieldItem.name + '_' + nanoid() }),
        defaultFieldOptions,
      );

      // добавляем пилюлю на ось
      axe.fields.push(fieldNew);
    });

    // вызываем автоматическое выставление агрегации
    this.setAggregationAuto(configNew.axes);

    return configNew;
  }

  updateField(config, axisName, fieldIndex, fieldItem) {
    // если имя поля пустое - ничего не делаем
    if (!fieldItem) return config;

    // готовим переменные
    const configNew = structuredClone(config);
    const axis = _.find(configNew.axes, ['name', axisName]);
    const fieldNew = _.defaults(
      _.merge({}, _.omit(fieldItem, ['axisName', 'fieldIndex', 'itemType'])),
      defaultFieldOptions,
    );

    // если итем не перемещается
    if (axisName === fieldItem.axisName && fieldIndex === fieldItem.fieldIndex) {
      // если команда удалить
      if (fieldItem.remove) {
        // удаляем итем
        axis.fields.splice(fieldIndex, 1);
        // если любая другая команда
      } else {
        // подменяем итем на обновленный
        axis.fields.splice(fieldIndex, 1, fieldNew);
      }
      // если итем перемещается
    } else {
      // вставляем итем
      axis.fields.splice(fieldIndex, 0, fieldNew);

      // учитываем сдвиг, если точка вставки предшествует точке удаления
      let shift = 0;
      if (axisName === fieldItem.axisName && fieldIndex < fieldItem.fieldIndex) {
        shift = 1;
      }
      // удаляем итем
      const axisFrom = _.find(configNew.axes, ['name', fieldItem.axisName]);
      axisFrom.fields.splice(fieldItem.fieldIndex + shift, 1);
    }

    clearNotOrderedFieldsOrderIndex(configNew);

    shiftOrderIndex(configNew, fieldNew);

    clearNotOrderedFieldsOrderIndex(configNew);

    // сбрасываем редактор вычисляемого поля
    configNew.calculatedField = null;

    // вызываем автоматическое выставление агрегации
    this.setAggregationAuto(configNew.axes);

    // очиищаем фильтры, если они удалены или перемещены с полки фильтры
    const filterAxe = _.find(configNew.axes, ['type', 'filters']);
    if (filterAxe) {
      const filterNamesActive = _.map(filterAxe.fields || [], 'name') || [];
      configNew.filters = _.omitBy(configNew.filters, (field, fieldName) => !_.includes(filterNamesActive, fieldName));
    }

    delete configNew.expands;

    return configNew;
  }

  setAggregationAuto(axes) {
    // если индекс поля не выбран ставим 0
    axes.forEach((axe) => {
      if (_.isUndefined(axe.selectedFieldIndex)) {
        axe.selectedFieldIndex = 0;
      }
    });

    const valuesAxe = _.find(axes, ['type', 'values']);

    // получаем имя действующей категории
    const categoriesAxe = _.find(axes, ['type', 'categories']);
    let categoriesFieldName = null;
    if (categoriesAxe && categoriesAxe.fields.length > 0 && categoriesAxe.fields[categoriesAxe.selectedFieldIndex]) {
      categoriesFieldName = categoriesAxe.fields[categoriesAxe.selectedFieldIndex].name;
    }

    if (categoriesAxe) {
      _.forEach(categoriesAxe.fields, (field) => {
        delete field.agg;
      });
    }

    // флаг группировки если активна серия или категория
    const groupMode = categoriesAxe && categoriesAxe.fields.length > 0 && categoriesFieldName;

    // меняем аггрегации для полей значений
    if (valuesAxe) {
      // в режиме группировки добавляем группировку если ее нет
      if (groupMode) {
        valuesAxe.fields.forEach((field) => {
          if (field.type !== 'calculated' && _.isNull(field.agg) && field.name !== categoriesFieldName) {
            field.agg = field.type === 'number' ? 'sum' : 'max';
          }
        });
      }
    }
  }
}
