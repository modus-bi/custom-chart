import tinycolor from 'tinycolor2';
import _ from 'lodash';
import i18n from 'i18next';

export function getIsPinned({ field, categoryField }) {
  return (
    !field.pinToDrill || _.isEmpty(field.pinToDrill) || (field.pinToDrill || []).includes((categoryField || {}).id)
  );
}

export function getQueryObjectVariables({ variables }) {
  const vars = [];
  _.forEach(variables, (variableItem, variableName) => {
    vars.push({
      name: variableName,
      values: variableItem.value,
    });
  });
  return vars;
}

export function getCategoryField({ config }) {
  const categoriesAxe = _.find(config.axes, ['type', 'categories']);
  return ((categoriesAxe || {}).fields || {})[(categoriesAxe || {}).selectedFieldIndex || 0];
}

export function getLocalArray(arr, field) {
  const arrNew = _.map(arr, (row) => {
    return { ...row, [field]: localizeExcludingDots(row[field]) };
  });
  return arrNew;
}

export function localizeExcludingDots(value) {
  const valueArray = value.split('.');
  return i18n.t(valueArray[0]);
}

export function getLocal(item, property, noDefault) {
  if (!item) return '';
  const value = item[property + '__' + i18n.language];

  if (noDefault) {
    return value;
  }

  return _.isUndefined(value) ? item[property] : value + '';
}

export function getLocalProperty(property, lng = i18n.language) {
  return property + (lng ? `__${lng}` : '');
}

export function getTitle(field) {
  return field['title__' + i18n.language] || field.title || '';
}

export function getDescription(config) {
  return config['description__' + i18n.language] || config.description || '';
}

export function hsQuote(str) {
  if (_.isEmpty(str)) {
    return str;
  }
  return (str + '').replace(/!hs_quote!/g, "'");
}

export function getColorset(reportOptions, palette) {
  const activeColorset = reportOptions.defaultColorset
    ? _.cloneDeep(_.find(palette.chartColorSets, ['name', reportOptions.defaultColorset]) || {})
    : _.cloneDeep(_.find(palette.chartColorSets, 'options.default') || {});
  _.merge(activeColorset.colors, reportOptions.colorsetOverrides);
  const colorsetColors = _.sortBy(activeColorset.colors || [], 'options.order').map((o) => o.value);
  let colorset = [];
  for (let i = 0; i < 10; i += 1) {
    colorset = colorset.concat(colorsetColors);
  }
  return colorset;
}

export function hasDrill(config) {
  return !_.isEmpty(((config || {}).drill || {}).hierarchy);
}

export function isFilterMode(config) {
  if (hasDrill(config)) {
    return false;
  }
  return config.filterMode;
}

export function getPartsParent(name) {
  const delim = '$!$';
  const idx = name.indexOf(delim);
  return idx > 0 ? name.substr(0, idx) : name;
}

export function getPartsExpression(name) {
  if (!name) {
    return;
  }
  const delim = '$!$';
  const idx = name.indexOf(delim);
  return idx > 0 ? name.substr(idx + delim.length) : `"${name}"`;
}

export const getHasTooltipField = (config) => {
  const valuesAxe = _.find(config.axes, ['type', 'values']);
  const categoriesAxe = _.find(config.axes, ['type', 'categories']);
  const seriesAxe = _.find(config.axes, ['type', 'series']);
  return (
    !!_.find((valuesAxe || {}).fields, ['valueType', 'tooltip']) ||
    !!_.find((categoriesAxe || {}).fields, (field) => !!field.tooltipBy) ||
    !!_.find((seriesAxe || {}).fields, (field) => !!field.tooltipBy)
  );
};

export const canonForDataCursor = (value) => {
  let s = ('' + value).toLowerCase();
  if (s.includes('ё')) {
    s = s.replace('ё', 'е');
  }
  return s.trim();
};

/**
 * Возвращаем поля которые участвуют в определении порядка сортировки
 * @param configDraft
 * @returns {Array}
 */
export const getOrderedFields = (configDraft) => {
  let orderedFields = [];

  // const valuesAxe = _.find(configDraft.axes, ['type', 'values']);
  // if (valuesAxe) {
  //   if (valuesAxe.selectedFieldIndex === -2) {
  //     _.forEach(valuesAxe.fields, field => {
  //       field.order && orderedFields.push(field);
  //     });
  //   }
  //   else {
  //     const field = valuesAxe.fields[+valuesAxe.selectedFieldIndex];
  //     field && field.order && orderedFields.push(field);
  //   }
  // }
  //
  // const categoriesAxe = _.find(configDraft.axes, ['type', 'categories']);
  // if (categoriesAxe) {
  //   if (categoriesAxe.selectedFieldIndex !== -1) {
  //     const field = categoriesAxe.fields[+categoriesAxe.selectedFieldIndex];
  //     field && field.order && orderedFields.push(field);
  //   }
  // }
  //
  // const seriesAxe = _.find(configDraft.axes, ['type', 'series']);
  // if (seriesAxe) {
  //   if (seriesAxe.selectedFieldIndex !== -1) {
  //     const field = seriesAxe.fields[+seriesAxe.selectedFieldIndex];
  //     field && field.order && orderedFields.push(field);
  //   }
  // }

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

export const getHasSeries = (config) => {
  const seriesAxe = _.find(config.axes, ['type', 'series']);
  if (seriesAxe) {
    return !(seriesAxe.selectedFieldIndex === -1 || (seriesAxe.fields || []).length === 0);
  }
  return false;
};

/**
 * @param {string} color
 * @param {array<string>} colors
 * @returns {string} color
 */
export const modifyColorDup = (color, colors) => {
  // slightly modifies color for dups exclusion
  let newColor = tinycolor(color);
  if (
    colors.indexOf(color) === -1 &&
    colors.indexOf(tinycolor(color).toRgbString()) === -1 &&
    colors.indexOf(tinycolor(color).toHexString()) === -1
  ) {
    return color;
  }
  let cnt = 0;
  while (colors.indexOf(newColor.toRgbString()) !== -1 || isColorEquals(color, newColor)) {
    newColor = tinycolor.mix(color, 'gray', Math.random() * 2);
    newColor = tinycolor.mix(newColor, 'red', Math.random());
    newColor = tinycolor.mix(newColor, 'green', Math.random());
    newColor = tinycolor.mix(newColor, 'blue', Math.random());
    console.log('Old:', tinycolor(color).toRgbString(), 'New:', tinycolor(newColor).toRgbString());
    if (cnt > 100) break;
    cnt += 1;
  }
  return newColor.toRgbString();
};

/**
 * @param {string} color1
 * @param {string} color2
 * @returns {boolean}
 */
export const isColorEquals = (color1, color2) => {
  return tinycolor.equals(tinycolor(color1), tinycolor(color2));
  //return tinycolor(color1).toRgbString() === tinycolor(color2).toRgbString();
};
