import _ from 'lodash';
import * as echarts from 'echarts';
import { dateFormatFunction, formatNumber, addPrefix } from 'src/duplicates/constants/formatOptions';
import CommonSpecGenerator from 'src/duplicates/adaptors/CommonChartAdaptor/CommonSpecGenerator';
import { getDrill, getLocal } from 'src/duplicates/helpers';

const formatUtil = echarts.format;


export default class EChartsSpecGenerator {

  constructor(type) {
    this.type = type;
    this.data = [];
    this.series = [];
  }

  static getDefaultSpec(type) {
    const defaultComponent = new ComponentTypeManager(type).getDefaultComponent();
    return defaultComponent.spec || {};
  }

  getColor = (item) => {
    const color = (!item['color'] || item['color'].includes('{Вычисляемое поле}')) ? undefined : item['color'];
    return color;
  }

  getSpec = (config, data) => {
    const spec = this.spec;
    const firstItem = (!_.isEmpty(data)) ? _.head(data) : {};
    // const categoriesAxe = _.find(config.axes, ['type', 'categories']) || {};
    // const categoryField = (categoriesAxe.fields || [])[categoriesAxe.selectedFieldIndex] || {};
    // const hasDrillUp = !!getDrill(categoryField, config, 'up');
    // const hasDrillDown = !!getDrill(categoryField, config, 'down');
    // console.log(hasDrillUp, hasDrillDown);
    this.data = [];

    if (!_.isEmpty(data)) {
      _.map(data, (item) => {
        if (!item) return;

        const children = [];
        let childrenSum = 0;

        // Без серий
        if (!item.series || _.isEmpty(item.series)) {
          this.data.push({
            dataContext: item,
            value: item['values0'] || 0,
            name: item['categories'] || '',
            path: item['categories'] || '',
            tooltipText: item['tooltip'] || '',
            itemStyle: {
              color: this.getColor(item)
            }
          });
        }

        // С сериями
        else {
          _.map(item.series, (s, idx) => {
            if (item[s]) {
              //console.log(item, item[s]);
              childrenSum += Number(_.get(item[s], 'value', 0))
              children.push({
                dataContext: item,
                value: _.get(item[s], 'value', 0),
                name: s,
                tooltipText: _.get(item[s], 'tooltip', ''),
                itemStyle: {
                  color: this.getColor(item)
                }
              });
            }
          })
          this.data.push({
            dataContext: item,
            value: childrenSum || 0,
            name: item['categories'] || getLocal(_.get(item, 'seriesField', {}), 'title') || getLocal(_.get(item, 'seriesField', {}), 'alias') || '',
            path: item['categories'] || '',
            tooltipText: item['tooltip'] || '',
            itemStyle: {
              color: this.getColor(item)
            },

            children
          });
        }


        spec.series = [
          {
            name: getLocal(_.get(firstItem, 'categoryField', {}), 'title') ||
              _.get(firstItem, 'categoryField.alias', '') ||
              getLocal(_.get(firstItem, 'seriesField', {}), 'title') ||
              getLocal(_.get(firstItem, 'seriesField', {}), 'alias') ||
              _.get(firstItem, 'seriesField.name', ''),
            type: 'treemap',
            width: '100%',
            height: '100%',
            bottom: 25,
            visibleMin: 1,
            //nodeClick: !(hasDrillUp || hasDrillDown),
            // roam: 'zoom',
            scaleLimit: {
              min: 1,
              max: 5
            },
            tooltip: {
              trigger: (!!config?.balloon?.visible) ? 'item' : 'none'
            },
            label: {
              show: true,
              height: '100%',
              formatter: function (params) {
                const arr = [
                  '{name|' + params.data.name + '}',
                  '{spacer| }',
                  '{value|' + addPrefix(
                    params.data.value,
                    config.bigNumberClasses,
                    false,
                    { precision: config.precision || 0, decimalSeparator: '.', thousandsSeparator: ' ' }) + '}'
                ]
                return arr.join('\n');
              },
              rich: {
                name: {
                  align: 'left',
                  fontSize: _.get(config, 'labels.inner.fontsize', 12),
                  lineHeight: _.get(config, 'labels.inner.fontsize', 12),
                  //verticalAlign: 'bottom'
                },
                spacer: {
                  lineHeight: _.get(config, 'labels.value.topMargin', 0) + 0.001,
                },
                value: {
                  align: 'left',
                  verticalAlign: 'bottom',
                  fontSize: _.get(config, 'labels.value.fontsize', 14),
                  lineHeight: _.get(config, 'labels.value.fontsize', 14),
                  color: (!!config?.labels?.visible) ? '#FFF' : 'transparent',
                  padding: [6, 0, 0, 0]
                }
              }
            },
            upperLabel: {
              show: true,
              height: 25,
              fontSize: _.get(config, 'labels.outer.fontsize', 12),
              lineHeight: _.get(config, 'labels.outer.fontsize', 12),
              //fontWeight: 'bold',
              padding: [1, 5],
              color: '#FFF',
              textShadowColor: '#000',
              formatter: function (params) {
                return params.data.name;
              },

            },
            breadcrumb: {
              top: 'auto',
              bottom: 7,
              left: 'left',
              height: 16,
              emptyItemWidth: 16,
              itemStyle: {
                color: '#AFB4C0',
                textStyle: {
                  width: 200,
                  overflow: 'truncate',
                  padding: [4, 4, 4, 4]
                }
              },
              emphasis: {
                itemStyle: {
                  color: '#60687A',
                  textStyle: {
                    padding: [4, 4, 4, 4]
                  }
                }
              }
            },
            leafDepth: 2,
            levels: [
              {
                itemStyle: {
                  borderColor: 'transparent',
                  borderWidth: 0,
                  gapWidth: 2
                }
              },
              {
                colorSaturation: [0.3, 0.6],
                itemStyle: {
                  borderColorSaturation: 0.7,
                  gapWidth: 1,
                  borderWidth: 0
                }
              },
              {
                colorSaturation: [0.3, 0.5],
                itemStyle: {
                  borderColorSaturation: 0.6,
                  gapWidth: 1
                }
              },
              {
                colorSaturation: [0.3, 0.5]
              }
            ],
            data: this.data
          }
        ];


      });
    }

    spec.tooltip = {
      formatter: function (info) {
        var value = info.value;
        var treePathInfo = info.treePathInfo;
        var treePath = [];
        for (var i = 1; i < treePathInfo.length; i++) {
          treePath.push(treePathInfo[i].name);
        }
        const output = [];
        if (info.data && info.data.tooltipText) {
          output.push('<div class="tooltip-text">' + info.data.tooltipText + '</div>');
        }
        else {
          output.push('<div class="tooltip-title">' + treePath.join('<br>') + '</div>');
        }
        output.push('<div class="tooltip-value">' +
          addPrefix(
            value,
            config.bigNumberClasses,
            false,
            { precision: config.precision || 0, decimalSeparator: '.', thousandsSeparator: ' ' })
          + '</div>');

        return output.join('\n');
      }
    };

    //console.log(spec);
    return spec;
  }

  getVisualStructure = (data, config, hasSeries) => {
    return config.visuals || [];
  }

}
