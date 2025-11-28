import _ from 'lodash';
import i18n from 'i18next';

export function getLocal(item, property, noDefault) {
  if (!item) return '';
  let language = i18n.language;
  if (!i18n.language) {
    language = 'ru';
  }
  const value = item[property + '__' + language];

  if (noDefault) {
    return value;
  }

  return _.isUndefined(value) ? item[property] : value + '';
}

export function getDescription(config) {
  return getLocal(config, 'description') || config.description || '';
}

/**
 * Возвращаем поля которые участвуют в определении порядка сортировки
 * @param configDraft
 * @returns {Array}
 */
export const getOrderedFields = (configDraft) => {
  let orderedFields = [];
  const valuesAxe = _.find(configDraft.axes, ['type', 'values']);
  if (valuesAxe) {
    _.forEach(valuesAxe.fields, (field) => {
      field.order && orderedFields.push(field);
    });
  }

  const categoriesAxe = _.find(configDraft.axes, ['type', 'categories']);
  if (categoriesAxe) {
    _.forEach(categoriesAxe.fields, (field) => {
      field.order && orderedFields.push(field);
    });
  }

  const seriesAxe = _.find(configDraft.axes, ['type', 'series']);
  if (seriesAxe) {
    _.forEach(seriesAxe.fields, (field) => {
      field.order && orderedFields.push(field);
    });
  }

  return orderedFields;
};

/**
 * очищаем порядок сортировки у всех полей кроме тех, которые активны && имеют сортировку
 * @param config
 */
export const clearNotOrderedFieldsOrderIndex = (config) => {
  // очищаем порядки сортировки у полей без сортировки
  _.forEach(config.axes, (axe) => {
    _.forEach(axe.fields, (field) => {
      if (field.orderIndex && !field.order) {
        delete field.orderIndex;
      }
    });
  });

  // очищаем порядки сортировки, превышающие максимальный
  const orderedFields = getOrderedFields(config);
  _.forEach(config.axes, (axe) => {
    _.forEach(axe.fields, (field) => {
      if (field.orderIndex > orderedFields.length) {
        field.orderIndex = null;
      }
    });
  });
};

export const shiftOrderIndex = (configNew, fieldNew) => {
  const orderedFields = getOrderedFields(configNew);

  // если поле активное, то сдвигаем совпадающие порядки вниз
  if (_.find(orderedFields, (tField) => tField.id === fieldNew.id)) {
    let sameIndexField = _.find(orderedFields, (tField) => {
      return (
        tField.id !== fieldNew.id &&
        +tField.orderIndex &&
        +fieldNew.orderIndex &&
        tField.orderIndex === fieldNew.orderIndex
      );
    });
    while (sameIndexField) {
      sameIndexField.orderIndex += 1;
      sameIndexField = _.find(orderedFields, (tField) => {
        return tField.id !== sameIndexField.id && tField.orderIndex === sameIndexField.orderIndex;
      });
    }
  }
};

/**
 * определяем единственный datasetId по всем пилюлям компонента
 * @param config
 * @returns {*}
 */
export const getDatasetId = (config) => {
  const axes = (config || {}).axes || [];
  // оставляем список уникальных datasetId для всех пилюль на всех полках и берем только самый первый
  return (_.uniq(_.map(_.flatMap(axes, 'fields'), 'datasetId')) || {})[0];
};


export function getPercentage(value, total, decimals = 2) {
  if (total === 0) {
    return 100;
  }
  const percentage = (value / total) * 100;
  return Number(percentage.toFixed(decimals));
}