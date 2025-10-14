import { addPrefix } from '../../duplicates/constants/formatOptions';
import { getLocal } from '../../duplicates/helpers';
import _ from 'lodash';

export function getTooltipTreemap(config) {
  return {
    formatter: function(info) {
      var value = info.value;
      var treePathInfo = info.treePathInfo;
      var treePath = [];
      for (var i = 1; i < treePathInfo.length; i++) {
        treePath.push(treePathInfo[i].name);
      }
      const output = [];
      if (info.data && info.data.tooltipText) {
        output.push('<div class="tooltip-text">' + info.data.tooltipText + '</div>');
      } else {
        output.push('<div class="tooltip-title">' + treePath.join('<br>') + '</div>');
      }
      output.push(
        '<div class="tooltip-value">' +
          addPrefix(value, config.bigNumberClasses, false, {
            precision: config.precision || 0,
            decimalSeparator: '.',
            thousandsSeparator: ' ',
          }) +
          '</div>',
      );

      return output.join('\n');
    },
  };
}

function getName(firstItem) {
  return (
    getLocal(_.get(firstItem, 'categoryField', {}), 'title') ||
    _.get(firstItem, 'categoryField.alias', '') ||
    getLocal(_.get(firstItem, 'seriesField', {}), 'title') ||
    getLocal(_.get(firstItem, 'seriesField', {}), 'alias') ||
    _.get(firstItem, 'seriesField.name', '')
  );
}

export function getTooltip() {
  return {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
    formatter: function(params) {
      /*      let tar;
      console.log({ params })
      if (params[1] && params[1].value !== '-') {
        tar = params[1];
      }
      else {
        tar = params[2];
      }
      return tar && tar.name + '<br/>' + tar.seriesName + ' : ' + tar.value;*/
      return (
        params[0].value +
        '<br/>' +
        params[1].value +
        '<br/>' +
        params[2].value +
        '<br/>' +
        params[3].value +
        '<br/>' +
        params[4].value +
        '<br/>'
      );
    },
  };
}

export function getGrid() {
  return {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  };
}

export function getDataXAxis({ data, config }) {
  const categories = [];
  if (!_.isEmpty(data)) {
    _.map(data, (item, index) => {
      if (!item) return;
      categories.push(item['categories']);
    });
  }
  return categories;
}

export function getGraphs({ data, config }) {
  const plusDelta = [];
  const plus = [];
  const minusDelta = [];
  const minus = [];
  const totals = [];
  const line = [];
  let lastSum = 0;
  const valueFieldName = 'values0';

  if (!_.isEmpty(data)) {
    const lastIndex = data.length - 1;
    _.map(data, (item, index) => {
      if (!item) return;

      const value = +item[valueFieldName];
      if (index === 0) {
        totals.push(value);
        plus.push('-');
        plusDelta.push('-');
        minus.push('-');
        minusDelta.push('-');
        line.push(value);
      } else if (index === lastIndex) {
        totals.push(lastSum);
        plus.push('-');
        plusDelta.push('-');
        minus.push('-');
        minusDelta.push('-');
        line.push(lastSum);
      } else {
        totals.push('-');
        line.push(lastSum);
        if (value >= 0) {
          plusDelta.push(lastSum);
          plus.push(value);
          minusDelta.push('-');
          minus.push('-');
        } else {
          plusDelta.push('-');
          plus.push('-');
          minusDelta.push(lastSum);
          minus.push(value);
        }
      }

      lastSum += value;
    });
  }

  return {
    plus,
    plusDelta,
    minus,
    minusDelta,
    totals,
    line,
  };
}
