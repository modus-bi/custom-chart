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

export function getTitle(field) {
  return field['title__' + i18n.language] || field.title || '';
}

export function hsQuote(str) {
  if (_.isEmpty(str)) {
    return str;
  }
  return (str + '').replace(/!hs_quote!/g, "'");
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