import ComponentTypeManager from '../../managers/ComponentTypeManager';
import { getGraphs, getDataXAxis, getGrid, getTooltip } from './specGeneratorHelpers';

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

  getSpec = (config, data) => {
    const graphs = getGraphs({ data, config });
    const spec = {
      // title: {
      //   text: 'Accumulated Waterfall Chart'
      // },
      tooltip: getTooltip({ config, data }),
      legend: {
        // top: 30,
        data: ['Уменьшение', 'Увеличение', 'Итог'],
      },
      grid: getGrid(),
      xAxis: {
        type: 'category',
        data: getDataXAxis({ config, data }),
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: 'plusDelta',
          type: 'bar',
          stack: 'plus',
          silent: true,
          stackStrategy: 'all',
          barGap: '-100%',
          itemStyle: {
            borderColor: 'transparent',
            color: 'transparent',
          },
          emphasis: {
            itemStyle: {
              borderColor: 'transparent',
              color: 'transparent',
            },
          },
          data: graphs.plusDelta,
        },
        {
          name: 'Увеличение',
          type: 'bar',
          stack: 'plus',
          stackStrategy: 'all',
          barGap: '-100%',
          itemStyle: {
            borderColor: 'transparent',
            color: 'blue',
          },
          label: {
            show: true,
            position: 'top',
          },
          data: graphs.plus,
        },
        {
          name: 'minusDelta',
          type: 'bar',
          stack: 'minus',
          stackStrategy: 'all',
          barGap: '-100%',
          silent: true,
          itemStyle: {
            borderColor: 'transparent',
            color: 'transparent',
          },
          emphasis: {
            itemStyle: {
              borderColor: 'transparent',
              color: 'transparent',
            },
          },
          data: graphs.minusDelta,
        },
        {
          name: 'Уменьшение',
          type: 'bar',
          stack: 'minus',
          stackStrategy: 'all',
          barGap: '-100%',
          itemStyle: {
            borderColor: 'transparent',
            color: 'green',
          },
          label: {
            show: true,
            position: 'bottom',
          },
          data: graphs.minus,
        },
        {
          name: 'Итог',
          type: 'bar',
          stack: 'totals',
          stackStrategy: 'all',
          barGap: '-100%',
          itemStyle: {
            borderColor: 'transparent',
            color: 'gray',
          },
          label: {
            show: true,
            position: 'top',
          },
          data: graphs.totals,
        },
        {
          name: 'line',
          type: 'line',
          step: true,
          symbol: 'none',
          barGap: '-100%',
          lineStyle: {
            width: 0.5,
          },
          itemStyle: {
            borderColor: 'gray',
            color: 'gray',
          },
          emphasis: {
            lineStyle: {},
          },
          label: {
            show: false,
          },
          data: graphs.line,
        },
      ],
    };

    return spec;
  };

  getVisualStructure = (data, config, hasSeries) => {
    return config.visuals || [];
  };
}
