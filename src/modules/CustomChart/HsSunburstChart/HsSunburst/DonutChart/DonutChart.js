import React from 'react';
import ReactDOMServer from 'react-dom/server';

/* Lodash */
import map from 'lodash/map';
import max from 'lodash/max';
import size from 'lodash/size';
import each from 'lodash/each';
import sumBy from 'lodash/sumBy';
import sortBy from 'lodash/sortBy';
import cloneDeep from 'lodash/cloneDeep';
import range from 'lodash/range';
import find from 'lodash/find';
import filter from 'lodash/filter';
import merge from 'lodash/merge';
import isNumber from 'lodash/isNumber';
import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';
import isEmpty from 'lodash/isEmpty';
import some from 'lodash/some';

/* D3 */
import { selectAll as d3_selectAll, event } from 'd3-selection';
import { interpolate as d3_interpolate } from 'd3-interpolate';
import { scaleOrdinal as d3_scaleOrdinal, scaleLinear as d3_scaleLinear } from 'd3-scale';
import { hsl as d3_hsl, rgb as d3_rgb } from 'd3-color';
import { format as d3_format } from 'd3-format';
import { pie as d3_pie, arc as d3_arc } from 'd3-shape';
import 'd3-transition';

import { addSeparators, rgba2rgb } from './DonutChartHelpers';

import './DonutChart.scss';
import i18n from 'i18next';

const COLLAPSED_WIDTH = 20;
const BUTTON_RADIUS = 12;
const DEFAULT_FONT_SIZE = 0.8;

export default function donutChart(globals) {
  let data = [];
  let width;
  let height;
  let margin = { top: 10, right: 10, bottom: 10, left: 10 };
  let color = colorFn;
  let variable; // value in data that will dictate proportions on chart
  let category; // compare data by
  let gutter; // effectively dictates the gap between slices
  let transTime; // transition time
  let radius;
  let updateData;
  const floatFormat = d3_format('.4r');
  let cornerRadius;
  let selectedTreeIndex;
  let selectedTreeIndexArray = [];
  let splittedMode;
  let ellipsisLength = 0;
  let visibleLayersNumber = 0;
  let spec = {};
  let pie;
  let selection;
  let onClick;
  let popupDiv;
  let svg;

  function setSelectedTreeIndexArray() {
    selectedTreeIndexArray = [];
    each(spec.filterCategories, (filterCategory) => {
      if (!isEmpty(filterCategory.selected)) {
        each(data, (level, i) => {
          if (spec.levelIds[i] === level.id) {
            each(level.items, (item) => {
              if (filterCategory.selected.includes(item.categories)) {
                selectedTreeIndexArray.push(item.tree);
              }
            });
          }
        });
      }
    });
  }

  function chart(selection_) {
    selection = selection_;
    selection.each(() => {
      // создаем генератор секторов
      pie = d3_pie()
        .value((d) => floatFormat(d[variable]))
        .sort(null);

      updateData = updateDataFn;

      init();
    });
  }

  function init() {
    if (spec.filterMode) {
      setSelectedTreeIndexArray();
    }

    // вставляем в ДОМ элемент svg
    svg = selection
      .append('svg')
      .attr('class', 'sunburstSvg')
      .attr('id', 'sunburstSvg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('text-rendering', 'geometricPrecision')
      .append('g')
      .attr('class', 'sunburstG')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    createButtons(svg);

    createPopupDiv();

    const dataRoot = getDataRoot();

    const layerSelectionEnter = svg
      .selectAll('.layer')
      .data(dataRoot, (d) => d.id)
      .enter()
      .append('g')
      .each(function(d) {
        this._current = d;
      })
      .attr('class', 'layer');

    layerSelectionEnter.append('g').attr('class', 'slices');
    layerSelectionEnter.append('g').attr('class', 'labels');

    /* PIE ENTER */

    layerSelectionEnter
      .select('.slices')
      .selectAll('path')
      .data(pieDatum, pieKey)
      .enter()
      .append('path')
      .attr('fill', color)
      .attr('d', pieD)
      .attr('opacity', pieOpacity)
      .style('cursor', getCursor);

    const labelSelectionEnter = layerSelectionEnter
      .select('.labels')
      .selectAll('g')
      .data(pieDatum, pieKey)
      .enter()
      .append('g')
      .attr('class', 'labelG')
      .attr('transform', labelTransform)
      .style('cursor', getCursor);

    labelSelectionEnter
      .append('text')
      .attr('class', 'labelText1')
      .attr('dy', labelShift1)
      .html(labelText1)
      .style('text-anchor', labelTextAnchor)
      .style('fill', labelColor)
      .style('font-size', labelFontSize)
      .style('font-family', labelFontFamily)
      .attr('opacity', labelOpacity)
      .attr('pointer-events', labelPointerEvents)
      .style('cursor', getCursor);

    labelSelectionEnter
      .append('text')
      .attr('class', 'labelText2')
      .attr('dy', labelShift2)
      .html(labelText2)
      .style('text-anchor', labelTextAnchor)
      .style('fill', labelColor)
      .style('font-size', labelFontSize)
      .style('font-family', labelFontFamily)
      .attr('opacity', labelOpacity)
      .attr('pointer-events', labelPointerEvents)
      .style('cursor', getCursor);

    /* TOOLTIP */

    svg
      .append('circle')
      .attr('class', 'returnCircle')
      .attr('r', dataRoot[0].innerRadiusAll)
      .style('fill', 'white')
      .style('cursor', `url("${globals.frontend.base_url}css/images/home-16.png"), auto`)
      .on('click', handleCenterClick);

    const allSelection = selection.selectAll('.labels .labelText1, .labels .labelText2, .slices path');
    allSelection.call(popup);
    allSelection.call(handleClick);
  }

  function updateDataFn() {
    if (spec.filterMode) {
      setSelectedTreeIndexArray();
    }

    const svgSelection = selection
      .select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const sunburstGSelection = svgSelection
      .select('.sunburstG')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    updateButtons(sunburstGSelection);

    /* SELECT LAYERS*/

    let layerSelection = sunburstGSelection.selectAll('.layer');

    /* BIND LAYERS*/

    const dataRoot = getDataRoot();

    const dataEnd = cloneDeep(dataRoot).map(pieDatum);

    const dataStart = extractDataStart(layerSelection);

    layerSelection = layerSelection.data(dataRoot, (d) => d.id);

    /* EXIT LAYERS*/

    layerSelection.exit().remove();

    /* ENTER LAYERS*/

    const layerSelectionEnter_ = layerSelection
      .enter()
      .append('g')
      .each(function(d) {
        this._current = d;
      })
      .attr('class', 'layer');

    layerSelectionEnter_.append('g').attr('class', 'slices');
    layerSelectionEnter_.append('g').attr('class', 'labels');

    /* ENTER LAYERS ENTER PIES*/
    enterLayersEnterPies(layerSelectionEnter_, dataStart, dataEnd);

    /* SELECT PIES */

    let pathSelection = layerSelection.select('.slices').selectAll('path');
    let labelSelection = layerSelection.select('.labels').selectAll('.labelG');

    /* BIND PIES */

    pathSelection = pathSelection.data(pieDatum, pieKey);

    labelSelection = labelSelection.data(pieDatum, pieKey);

    exitPies(pathSelection, labelSelection);
    enterPies(pathSelection, labelSelection);
    updatePies(pathSelection, labelSelection);

    selection.select('.returnCircle').attr('r', dataRoot[0].innerRadiusAll);

    /* UPDATE TOOLTIP*/

    const allSelection = selection.selectAll('.labels .labelText1, .labels .labelText2, .slices path');
    allSelection.call(popup);
    allSelection.call(handleClick);
    //allSelection.call(doubleClickHandler);
  }

  function isSubTree(curTree, tree) {
    return curTree.startsWith(tree);
  }

  function colorFn(d) {
    const tree = d.data.tree;
    const lastLayerIndex = d.lastLayerIndexBase;

    // если ошибка то цвет черный
    if (!tree || d.data.mixed) {
      return 'black';
    }

    const colorArray = tree.split('.');

    const gamma = cloneDeep(spec.colorset);
    //gamma.splice(6, 1);

    // берем базовый цвет из гаммы
    const colorScaleGamma = d3_scaleOrdinal()
      .domain(range(gamma.length))
      .range(gamma);
    const baseColor = spec.colorsEnabled ? colorScaleGamma(colorArray[0] % gamma.length) : '#7cb5ec';

    // определяем конечный цвет для базового
    const endColor = rgba2rgb(d3_rgb(baseColor).copy({ opacity: 0.5 }));

    // интерполируем по общему числу слоев
    const colorScale = d3_scaleLinear()
      .domain([0, lastLayerIndex])
      .range([baseColor, endColor]);
    let tColor = colorScale((colorArray.length - 1) % (lastLayerIndex + 1));

    if (
      spec.filterMode &&
      !isEmpty(selectedTreeIndexArray) &&
      !some(selectedTreeIndexArray || [], (selectedTree) => isSubTree(tree, selectedTree))
    ) {
      tColor = grayscale(tColor);
    }

    return tColor;
  }

  function grayscale(tColor) {
    const c = d3_hsl(tColor);
    return d3_hsl(c.h, 0, c.l).toString();
  }

  function exitPies(pathSelection, labelSelection) {
    pathSelection.exit().remove();

    labelSelection.exit().remove();
  }

  function labelTextAnchorTween(d) {
    this._current = this._current || d;
    const interpolate = d3_interpolate(this._current, d);
    this._current = interpolate(0);

    return function(t) {
      const dt = interpolate(t);
      return midAngle(dt) <= Math.PI ? 'start' : 'end';
    };
  }

  function labelTransformTween(d) {
    this._current = this._current || d;
    const interpolate = d3_interpolate(this._current, d);
    this._current = interpolate(0);

    return function(t) {
      const dt = interpolate(t);
      const pos = getInnerArc(dt).centroid(dt);
      const angle = toGrad(midAngle(dt) - Math.PI / 2 + (midAngle(dt) > Math.PI && Math.PI));
      return `translate(${pos})rotate(${angle})`;
    };
  }

  function pieDTween(d) {
    const interpolate = d3_interpolate(this._current, d);
    this._current = interpolate(0);
    return function(t) {
      const dt = interpolate(t);
      return getArc(dt)(dt);
    };
  }

  // находим наибольший предшествующий элемент в стартовых данных, который соотвествует i-му элементу в конечных
  function findPreceding(i, dataStart, dataEnd, key) {
    const lengthDataStart = dataStart.length;
    while (--i >= 0) {
      const keyDataEnd = key(dataEnd[i]);
      for (let j = 0; j < lengthDataStart; ++j) {
        if (key(dataStart[j]) === keyDataEnd) {
          return dataStart[j];
        }
      }
    }
  }

  // находим наибольший последующий элемент в стартовых данных, который соотвествует i-му элементу в конечных
  function findFollowing(i, dataStart, dataEnd, key) {
    const lengthDataEnd = dataEnd.length;
    const lengthDataStart = dataStart.length;
    while ((i += 1) < lengthDataEnd) {
      const keyDataEnd = key(dataEnd[i]);
      for (let j = 0; j < lengthDataStart; j += 1) {
        if (key(dataStart[j]) === keyDataEnd) {
          return dataStart[j];
        }
      }
    }
  }

  function findNeighborArc(i, dataStart, dataEnd, key) {
    const d = findPreceding(i, dataStart, dataEnd, key);
    if (d) {
      return { startAngle: d.endAngle, endAngle: d.endAngle };
    }

    const dd = findFollowing(i, dataStart, dataEnd, key);
    if (dd) {
      return { startAngle: dd.startAngle, endAngle: dd.startAngle };
    }

    return null;
  }

  function enterLayersEnterPies(layerSelectionEnter_, dataStart, dataEnd) {
    layerSelectionEnter_
      .select('.slices')
      .selectAll('path')
      .data(pieDatum, pieKey)
      .enter()
      .append('path')
      .each(function(d) {
        pieCurrentTween(this, d, dataStart, dataEnd, findNeighborArc);
      })
      .attr('fill', color)
      .attr('d', pieD)
      .attr('opacity', 0)
      .transition()
      .duration(transTime)
      .attr('opacity', pieOpacity)
      .style('cursor', getCursor);

    const labelSelectionEnterEnter = layerSelectionEnter_
      .select('.labels')
      .selectAll('.labelG')
      .data(pieDatum, pieKey)
      .enter()
      .append('g')
      .each(function(d) {
        labelCurrent(this, d);
      })
      .attr('class', 'labelG')
      .attr('transform', labelTransform)
      .style('cursor', getCursor);

    labelSelectionEnterEnter
      .append('text')
      .attr('class', 'labelText1')
      .attr('dy', labelShift1)
      .html(labelText1)
      .style('text-anchor', labelTextAnchor)
      .style('fill', labelColor)
      .style('font-size', labelFontSize)
      .style('font-family', labelFontFamily)
      .attr('opacity', 0)
      .transition()
      .duration(transTime)
      .attr('opacity', labelOpacity)
      .attr('pointer-events', labelPointerEvents)
      .style('cursor', getCursor);

    labelSelectionEnterEnter
      .append('text')
      .attr('class', 'labelText2')
      .attr('dy', labelShift2)
      .html(labelText2)
      .style('text-anchor', labelTextAnchor)
      .style('fill', labelColor)
      .style('font-size', labelFontSize)
      .style('font-family', labelFontFamily)
      .attr('opacity', 0)
      .transition()
      .duration(transTime)
      .attr('opacity', labelOpacity)
      .attr('pointer-events', labelPointerEvents)
      .style('cursor', getCursor);
  }

  function enterPies(pathSelection, labelSelection) {
    pathSelection
      .enter()
      .append('path')
      .each(function(d) {
        pieCurrent(this, d);
      })
      .style('cursor', getCursor)
      .attr('fill', color)
      .attr('d', pieD)
      .attr('opacity', pieOpacity);

    const labelSelectionEnter_ = labelSelection
      .enter()
      .append('g')
      .each(function(d) {
        labelCurrent(this, d);
      })
      .attr('class', 'labelG')
      .attr('transform', labelTransform);

    labelSelectionEnter_
      .append('text')
      .attr('class', 'labelText1')
      .attr('dy', labelShift1)
      .html(labelText1)
      .style('text-anchor', labelTextAnchor)
      .style('fill', labelColor)
      .style('font-size', labelFontSize)
      .style('font-family', labelFontFamily)
      .attr('opacity', labelOpacity)
      .attr('pointer-events', labelPointerEvents)
      .style('cursor', getCursor);

    labelSelectionEnter_
      .append('text')
      .attr('class', 'labelText2')
      .attr('dy', labelShift2)
      .html(labelText2)
      .style('text-anchor', labelTextAnchor)
      .style('fill', labelColor)
      .style('font-size', labelFontSize)
      .style('font-family', labelFontFamily)
      .attr('opacity', labelOpacity)
      .attr('pointer-events', labelPointerEvents)
      .style('cursor', getCursor);
  }

  function updatePies(pathSelection, labelSelection) {
    pathSelection
      .attr('fill', color)
      .style('cursor', getCursor)
      .transition()
      .duration(transTime)
      .attrTween('d', pieDTween);

    labelSelection
      .transition()
      .duration(transTime)
      .attrTween('transform', labelTransformTween);

    labelSelection
      .select('.labelText1')
      .html(labelText1)
      .style('fill', labelColor)
      .style('font-size', labelFontSize)
      .style('font-family', labelFontFamily)
      .attr('opacity', labelOpacity)
      .attr('pointer-events', labelPointerEvents)
      .style('cursor', getCursor)
      .transition()
      .duration(transTime)
      .styleTween('text-anchor', labelTextAnchorTween);

    labelSelection
      .select('.labelText2')
      .html(labelText2)
      .style('fill', labelColor)
      .style('font-size', labelFontSize)
      .style('font-family', labelFontFamily)
      .attr('opacity', labelOpacity)
      .attr('pointer-events', labelPointerEvents)
      .style('cursor', getCursor)
      .transition()
      .duration(transTime)
      .styleTween('text-anchor', labelTextAnchorTween);
  }

  function labelTextAnchor(d) {
    return midAngle(d) <= Math.PI ? 'start' : 'end';
  }

  function labelPointerEvents(d) {
    return labelOpacity(d) ? 'all' : 'none';
  }

  function labelOpacity(d) {
    if (
      (d.data[category] + '').startsWith('null_') ||
      d.collapsed ||
      (100 * (d.endAngle - d.startAngle)) / (2 * Math.PI) < (isUndefined(spec.minPercent) ? 1 : +spec.minPercent)
    ) {
      return 0;
    }

    return 1;
  }

  function pieCurrent(self, d) {
    self._current = d;
  }

  function pieCurrentTween(self, d, dataStart, dataEnd, findNeighborArcFn) {
    self._current =
      (dataStart[d.layerIndex] &&
        dataEnd[d.layerIndex] &&
        findNeighborArcFn(d.pieIndex, dataStart[d.layerIndex], dataEnd[d.layerIndex], pieKey)) ||
      d;
  }

  function pieD(d) {
    return getArc(d)(d);
  }

  function pieOpacity(d) {
    return (d.data[category] + '').startsWith('null_') ? 0 : 1;
  }

  function labelColor(d) {
    return d.layerIndex === d.lastLayerIndex && isShifted(d.layerIndex, d.lastLayerIndex)
      ? 'black'
      : spec.darkLabels
      ? 'black'
      : 'white';
    //
  }

  function labelFontSize(d) {
    return ((spec.font || {}).size || DEFAULT_FONT_SIZE) + 'em';
  }

  function labelFontFamily(d) {
    return (spec.font || {}).family || 'Arial';
  }

  function pieDatum(d) {
    return pie(d.items).map((p, i) => {
      p.splitted = d.splitted;
      p.collapsed = d.collapsed;
      p.outerRadius = d.outerRadius;
      p.innerRadius = d.innerRadius;
      p.innerRadiusAll = d.innerRadiusAll;
      p.lastLayerIndex = d.lastLayerIndex;
      p.lastLayerIndexBase = d.lastLayerIndexBase;
      p.layerIndex = d.layerIndex;
      p.layerId = d.id;
      p.pieIndex = i;
      return p;
    });
  }

  function pieKey(d) {
    return /*d.layerIndex + '/' + d.layerId + '/' + */ d.data.tree; //
  }

  function getArc(d) {
    return d3_arc()
      .outerRadius(d.outerRadius)
      .innerRadius(d.innerRadius)
      .cornerRadius(cornerRadius)
      .padAngle(gutter / (Math.PI * ((d.innerRadius + d.outerRadius) / 2 || 1)));
  }

  function getInnerArc(d) {
    return d3_arc()
      .outerRadius(d.innerRadius + (isShifted(d.layerIndex, d.lastLayerIndex) ? 45 : 20))
      .innerRadius(d.innerRadius);
  }

  function getDataRoot() {
    const lastLayerIndexBase = data.length - 1;
    let dataRoot = cloneDeep(data);

    if (visibleLayersNumber) {
      dataRoot = data.slice(0, visibleLayersNumber);
    }

    if (!spec.filterMode && selectedTreeIndex) {
      const hiddenLayersNumber = selectedTreeIndex.split('.').length - 1;

      const dataNew = [];
      each(dataRoot, (layer, layerIndex) => {
        if (layerIndex >= hiddenLayersNumber) {
          const layerNew = cloneDeep(layer);

          if (!spec.layerExpand) {
            layerNew.items = filter(layerNew.items, (p) => p.tree.startsWith(selectedTreeIndex));
          }

          dataNew.push(cloneDeep(layerNew));
        }
      });
      dataRoot = cloneDeep(dataNew);
    }

    const lastLayerIndex = dataRoot.length - 1;
    let outerRadiusAll = (0.95 * Math.min(width, height)) / 2;
    let innerRadiusAll = 20;
    const widthAll = outerRadiusAll - innerRadiusAll;

    let splitted = false;
    let ellipsed = false;
    let rWidthArray = getRWidthArray(dataRoot, { splitted, ellipsed });
    let rWidthAll = sumBy(rWidthArray, (d) => d.value);

    splitted = true;
    if (rWidthAll > widthAll) {
      rWidthArray = getRWidthArray(dataRoot, { splitted, ellipsed });
      rWidthAll = sumBy(rWidthArray, (d) => d.value);
    }

    ellipsed = true;
    if (rWidthAll > widthAll) {
      rWidthArray = getRWidthArray(dataRoot, { splitted, ellipsed });
      rWidthAll = sumBy(rWidthArray, (d) => d.value);
    }

    let allCollapsed = false;
    while (rWidthAll > widthAll && !allCollapsed) {
      const lastNotCollapsed = find(rWidthArray, (d) => !d.collapsed);
      if (!lastNotCollapsed) {
        allCollapsed = true;
      } else {
        lastNotCollapsed.collapsed = true;
      }
      rWidthAll = sumBy(rWidthArray, (d) => (d.collapsed ? COLLAPSED_WIDTH : d.value));
    }

    if (rWidthAll < widthAll) {
      innerRadiusAll = outerRadiusAll - rWidthAll;
    }

    let tRadius = innerRadiusAll;
    each(dataRoot, (d, i) => {
      const collapsed = rWidthArray[i].collapsed;
      const rWidth = collapsed ? COLLAPSED_WIDTH : rWidthArray[i].value;
      const innerRadius = tRadius;
      const outerRadius = tRadius + (isShifted(i, lastLayerIndex) ? 20 : rWidth - gutter / 2);

      merge(d, {
        splitted,
        innerRadiusAll,
        rWidth,
        collapsed,
        lastLayerIndex,
        lastLayerIndexBase,
        innerRadius,
        outerRadius,
        layerIndex: i,
      });

      tRadius += rWidth;
    });

    return dataRoot;
  }

  function extractDataStart(layerSelection) {
    let dataStart = [];
    layerSelection.each((layerD) => {
      dataStart.push(
        layerSelection
          .select('.slices')
          .selectAll('path')
          .filter((pathD) => pathD.layerIndex === layerD.layerIndex)
          .data(),
      );
    });
    return sortBy(dataStart, 'layerIndex');
  }

  function isShifted(i, lastLayerIndex) {
    return i === lastLayerIndex && i !== 0;
  }

  function getRWidthArray(data, options) {
    const k = getFontSizeFactor();
    const labelSize = (d) => {
      const text = (d || {})[category] + '';
      return splitLabel(text, options).minSize;
    };
    return map(data, (layer) => {
      return {
        value: 20 + k * 6 * max(map(layer.items, labelSize)),
        collapsed: false,
      };
    });
  }

  function ellipsis(text) {
    if (ellipsisLength && (text + '').length > ellipsisLength) {
      return (text + '').slice(0, ellipsisLength).trim() + '..';
    }
    return text;
  }

  function splitLabel(text, options = { splitted: true, ellipsed: true }) {
    const textArray = (text + '').split(' ');
    const labelFn = options.ellipsed ? ellipsis : (d) => d;

    if (textArray.length === 1 || !splittedMode) {
      const labelSingle = labelFn(text);
      return { part1: labelSingle, part2: '', minSize: size(labelSingle), single: true };
    }

    let label = {};
    let minSize = Infinity;
    for (let i = 1; i < textArray.length; i++) {
      const part1 = labelFn(textArray.slice(0, i).join(' '));
      const part2 = labelFn(textArray.slice(i).join(' '));
      const tSize = Math.max(size(part1), size(part2));
      const single = part2 === '';
      if (tSize < minSize) {
        minSize = tSize;
        label = { part1, part2, minSize, single };
      } else {
        break;
      }
    }
    return label;
  }

  function toGrad(angle) {
    return (180 * angle) / Math.PI;
  }

  function labelAngle(d) {
    return midAngle(d) - Math.PI / 2 + (midAngle(d) > Math.PI && Math.PI);
  }

  function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }

  function labelCurrent(self, d) {
    self._current = d;
  }

  function getFontSizeFactor() {
    return ((spec.font || {}).size || DEFAULT_FONT_SIZE) / DEFAULT_FONT_SIZE;
  }

  function labelShift1(d) {
    const k = getFontSizeFactor();
    return (d.splitted && !splitLabel(d.data[category]).single ? -0.15 : 0.35) + 'em';
  }

  function labelShift2(d) {
    const k = getFontSizeFactor();
    return k * 0.85 + 'em';
  }

  function labelText1(d) {
    return d.splitted ? splitLabel(d.data[category]).part1 : d.data[category];
  }

  function labelText2(d) {
    return d.splitted ? splitLabel(d.data[category]).part2 : '';
  }

  function labelTransform(d) {
    const pos = getInnerArc(d).centroid(d);
    const angle = toGrad(labelAngle(d));
    return `translate(${pos})rotate(${angle})`;
  }

  function getCursor(d) {
    if (d.layerIndex === d.lastLayerIndex && visibleLayersNumber && visibleLayersNumber < data.length) {
      return 'copy';
    } else if (!(d.data.categories + '').startsWith('null_')) {
      return 'pointer';
    }

    return 'auto';
  }

  function createPopupDiv() {
    popupDiv = selection.append('div').attr('class', 'popupDiv');
  }

  function createButtons(svg) {
    const xPlus = -10 - BUTTON_RADIUS;
    const xMinus = xPlus - 5 - 2 * BUTTON_RADIUS;
    const yMinus = -20 - BUTTON_RADIUS;
    const yPlus = yMinus;

    const buttonsG = svg
      .append('g')
      .attr('class', 'buttonsG')
      .attr('display', spec.layerButtons ? 'block' : 'none')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    buttonsG
      .append('circle')
      .attr('r', BUTTON_RADIUS)
      .attr('cx', xMinus)
      .attr('cy', yMinus)
      .attr('class', 'minusButton')
      .on('click', minusLayer);

    buttonsG
      .append('text')
      .attr('class', 'minusLabel')
      .attr('x', xMinus)
      .attr('y', yMinus)
      .attr('dy', '.35em')
      .html('−')
      .on('click', minusLayer);

    buttonsG
      .append('circle')
      .attr('r', BUTTON_RADIUS)
      .attr('cx', xPlus)
      .attr('cy', yPlus)
      .attr('class', 'plusButton')
      .on('click', plusLayer);

    buttonsG
      .append('text')
      .attr('class', 'plusLabel')
      .attr('x', xPlus)
      .attr('y', yPlus)
      .attr('dy', '.35em')
      .html('+')
      .on('click', plusLayer);
  }

  function plusLayer() {
    if (visibleLayersNumber < data.length) {
      visibleLayersNumber += 1;
      updateData();
    }
  }

  function minusLayer() {
    if (
      !spec.filterMode &&
      visibleLayersNumber > 1 &&
      (!selectedTreeIndex || visibleLayersNumber > selectedTreeIndex.split('.').length)
    ) {
      visibleLayersNumber -= 1;
      updateData();
    }
  }

  function updateButtons(svg) {
    svg
      .select('.buttonsG')
      .attr('display', spec.layerButtons ? 'block' : 'none')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
  }

  function handleClick(itemSelection) {
    itemSelection.on('click', function(d) {
      // если режим фильтра
      if (spec.filterMode) {
        const category_ = d.data.tree;
        if (event.ctrlKey) {
          if (selectedTreeIndexArray.includes(category_)) {
            selectedTreeIndexArray.splice(selectedTreeIndexArray.indexOf(category_), 1);
          } else {
            selectedTreeIndexArray.push(category_);
          }
        } else {
          if (selectedTreeIndexArray.includes(category_)) {
            selectedTreeIndexArray.splice(selectedTreeIndexArray.indexOf(category_), 1);
          } else {
            selectedTreeIndexArray = [category_];
          }
        }

        onClick({ data: d.data, layerIndex: d.layerIndex, selectedTreeIndexArray, e: event });
      }
      // если последний слой есть еще скрытые слои
      else if (d.layerIndex === d.lastLayerIndex && visibleLayersNumber && visibleLayersNumber < data.length) {
        // увеличиваем число слоев
        visibleLayersNumber += 1;
      }
      // в остальных случаях
      else if (!((d.data || {}).categories + '').startsWith('null_')) {
        selectedTreeIndex = d.data.tree;
      }

      updateData();
    });
  }

  function handleCenterClick() {
    selectedTreeIndex = undefined;

    if (spec.filterMode) {
      onClick({ data: {}, layerIndex: null, selectedTreeIndex });
    } else {
      visibleLayersNumber = spec.visibleLayersNumber;
    }

    updateData();
  }

  function popup(itemSelection) {
    itemSelection
      .on('mouseenter', (d) => {
        popupDiv
          .transition()
          .duration(200)
          .style('opacity', 0.9);

        popupDiv
          .html(getPopupContent(d))
          .style('left', event.pageX - selection.node().getBoundingClientRect().left + 'px')
          .style('top', event.pageY - selection.node().getBoundingClientRect().top + 'px');

        popupDiv.style('transform', getPopupTransform);
      })
      .on('mousemove', function(d) {
        popupDiv
          .html(getPopupContent(d))
          .style('left', event.pageX - selection.node().getBoundingClientRect().left + 'px')
          .style('top', event.pageY - selection.node().getBoundingClientRect().top + 'px');

        popupDiv.style('transform', getPopupTransform);
      })
      .on('mouseout', function(d) {
        popupDiv
          .transition()
          .duration(500)
          .style('opacity', 0);
      });
  }

  function getPopupTransform() {
    let transform = 'translate(10px, -10px)translate(0%, -100%)';

    const svgX = event.pageX - selection.node().getBoundingClientRect().left;
    const popupWidth = popupDiv.node().getBoundingClientRect().width;
    const marginRight = selection.node().getBoundingClientRect().width - svgX - popupWidth;
    const marginLeft = svgX - popupWidth;
    if (marginRight < 0 && marginLeft > marginRight) {
      transform += 'translateX(-20px)translateX(-100%)';
    }

    const svgY = event.pageY - selection.node().getBoundingClientRect().top;
    const popupHeight = popupDiv.node().getBoundingClientRect().height;
    const marginTop = svgY - popupHeight;
    const marginBottom = selection.node().getBoundingClientRect().height - svgY - popupHeight;
    if (marginTop < 0 && marginBottom > marginTop) {
      transform += 'translateY(20px)translateY(100%)';
    }

    return transform;
  }

  function applyPrecision(value) {
    const precision = spec.precision;

    if (!isNil(precision) && !(precision === '') && !(precision < 0) && isNumber(value)) {
      return +value.toFixed(precision);
    }

    return value;
  }

  function getPopupContent(d) {
    return ReactDOMServer.renderToStaticMarkup(
      <div className='popupTable'>
        {map(d.data.tree.split('.'), (level, i) => {
          return (
            <div className='popupRow' key={i}>
              <div className='popupCell popupHeader'>{spec.levelNames[i]}</div>
              <div className='popupCell'>{d.data.key.split('/')[i]}</div>
            </div>
          );
        })}

        <div className='popupRow' style={{ borderTop: '2px solid white' }}>
          <div className='popupCell popupHeader'>{i18n.t('Значение')}</div>
          <div className='popupCell'>
            <span>{addSeparators(applyPrecision(d.data[variable]))}</span>
            <span style={{ color: 'gray' }}>
              {` (${((100 * (d.endAngle - d.startAngle)) / (2 * Math.PI)).toFixed(1)}%)`}
            </span>
          </div>
        </div>
      </div>,
    );
  }

  function attachMethods() {
    chart.onClick = function(value) {
      if (!arguments.length) return width;
      onClick = value;
      return chart;
    };

    chart.width = function(value) {
      if (!arguments.length) return width;
      width = value;
      return chart;
    };

    chart.height = function(value) {
      if (!arguments.length) return height;
      height = value;
      return chart;
    };

    chart.margin = function(value) {
      if (!arguments.length) return margin;
      margin = value;
      return chart;
    };

    chart.radius = function(value) {
      if (!arguments.length) return radius;
      radius = value;
      return chart;
    };

    chart.gutter = function(value) {
      if (!arguments.length) return gutter;
      gutter = value;
      return chart;
    };

    chart.cornerRadius = function(value) {
      if (!arguments.length) return cornerRadius;
      cornerRadius = value;
      return chart;
    };

    chart.color = function(value) {
      if (!arguments.length) return color;
      color = value;
      return chart;
    };

    chart.variable = function(value) {
      if (!arguments.length) return variable;
      variable = value;
      return chart;
    };

    chart.category = function(value) {
      if (!arguments.length) return category;
      category = value;
      return chart;
    };

    chart.transTime = function(value) {
      if (!arguments.length) return transTime;
      transTime = value;
      return chart;
    };

    chart.spec = function(value) {
      if (!arguments.length) return spec;
      spec = cloneDeep(value);
      splittedMode = spec.splittedMode;
      ellipsisLength = spec.ellipsisLength;
      visibleLayersNumber = spec.visibleLayersNumber;
      return chart;
    };

    chart.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      if (typeof updateData === 'function') updateData();
      return chart;
    };

    chart.invalidate = function() {
      if (typeof updateData === 'function') updateData();
      return chart;
    };
  }

  attachMethods();

  return chart;
}
