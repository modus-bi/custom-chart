import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { DEBUG_RENDER } from 'duplicates/constants';
import SunburstDataAdaptor from './SunburstDataAdaptor';
import defaultConfig from '../defaultConfig.json';
import { getDatasetId, getColorset, getDescription, getLocal } from 'duplicates/helpers';
import { getVariablesForSettings } from 'duplicates/helpers/HsFilterControlPanelHelpers';
import HsSunburst from './HsSunburst/HsSunburst';
import './HsSunburstChart.scss';

class HsSunburstChart extends Component {
  static propTypes = {
    id: PropTypes.string,
    componentId: PropTypes.number.isRequired,
    inEditor: PropTypes.bool,
    title: PropTypes.string,
    type: PropTypes.string.isRequired,
    config: PropTypes.object.isRequired,
    configDraft: PropTypes.object,
    spec: PropTypes.object,
    datas: PropTypes.object,
    datasets: PropTypes.object.isRequired,
    editorActive: PropTypes.bool.isRequired,
    mainMenuActive: PropTypes.bool.isRequired,
    loadDatas: PropTypes.func.isRequired,
    changeGlobalFilterValueAndApply: PropTypes.func,
    changeMultipleGlobalFilterValueAndApply: PropTypes.func,
    changeFilterCategories: PropTypes.func,
    muiTheme: PropTypes.object.isRequired,
    globals: PropTypes.object,
  };

  static getDefaultSpec() {
    return {};
  }

  static getDefaultConfig() {
    return defaultConfig;
  }

  constructor(props) {
    super(props);
    this.state = {
      dataRes: {
        loaded: false,
        dataAdaptor: null,
      },
    };
  }

  componentDidMount() {
    this.getData('dataRes', this.props);
    window.addEventListener('resize', this.resizeChart);
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.getData('dataRes', props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { dataRes } = nextState;
    const { skipRender, componentId } = nextProps;

    if (skipRender) {
      if (DEBUG_RENDER) console.log(`skip Pivot ${componentId}`);
      return false;
    }

    if (nextProps.editorActive !== !!nextProps.inEditor || nextProps.mainMenuActive) {
      return false;
    }

    const obj = {
      spec: nextProps.spec,
      config: nextProps.config,
      configDraft: nextProps.configDraft,
      data: [(dataRes.dataAdaptor || {}).cacheId, _.isEmpty((dataRes.dataAdaptor || {}).plotData)],
    };
    const oldObj = _.cloneDeep(this.obj);
    this.obj = _.cloneDeep(obj);
    return !_.isEqual(oldObj, obj);
  }

  UNSAFE_componentWillUpdate(nextProps, nextState) {
    const { palette } = this.props.muiTheme;
    const { spec, reportOptions, globals } = nextProps;
    const { dataRes } = nextState;

    const el = this.el;
    const data = (dataRes.dataAdaptor || {}).plotData;

    if (!spec || _.isEmpty(data) || !el) {
      return;
    }

    const colorset = getColorset(reportOptions, palette);
    const specMerged = Object.assign({}, spec, { colorset });

    let sunburstChart = this.sunburstChart;
    if (!sunburstChart) {
      el.innerHTML = '';
      sunburstChart = new HsSunburst(globals);
      this.sunburstChart = sunburstChart;
      sunburstChart.init(el, data, specMerged, this.handleOnClick);
    }

    sunburstChart.update(data, specMerged);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeChart);
  }

  handleOnClick = (value) => {
    const { report, changeMultipleGlobalFilterValueAndApply, config, componentId, changeFilterCategories } = this.props;

    const categoriesAxe = _.find(config.axes, ['type', 'categories']);
    const params = _.map(categoriesAxe.fields, (field, i) => {
      let selected = ((config.filterCategories || {})[field.name] || {}).selected || [];
      const category = value.data.categories;
      if (value.layerIndex === i) {
        if (value.e.ctrlKey) {
          if (selected.includes(category)) {
            selected.splice(selected.indexOf(category), 1);
          } else {
            selected.push(category);
          }
        } else {
          if (selected.includes(category)) {
            selected.splice(selected.indexOf(category), 1);
          } else {
            selected = [category];
          }
        }

        changeFilterCategories(componentId, field, { selected });
      }

      const variables = getVariablesForSettings({
        components: (((report || {}).data || {}).grid || {}).components,
        fieldAlias: field.alias,
        selected,
      });

      return {
        fieldAlias: field.alias,
        settings: {
          selected,
          autofilter: null,
          autofilterChanged: true,
          filterMode: 'by value',
          variables,
        },
      };
    });

    changeMultipleGlobalFilterValueAndApply(params);
  };

  getData = (resourceName, props) => {
    const { spec, datas, loadDatas, editorActive, componentId, config, pluginImports } = props;
    let { dataAdaptor } = this.state[resourceName];

    const datasetId = getDatasetId(config);
    const filters = config.filters;
    const queryObjects = SunburstDataAdaptor.getQueryObjects(config);
    const context = { editor: editorActive, componentId };
    const cacheId = pluginImports.helpers.getCacheId(datasetId, filters, queryObjects, context);

    // данных нет в кэше - заказываем скачивание
    if (!datas || !(cacheId in datas)) {
      loadDatas(datasetId, null, filters, queryObjects, context);
    }
    // данные есть в кэше
    else {
      const data = datas[cacheId];

      // данные закачаны в кэш полностью
      if (spec && data && data.fetching === false) {
        if (dataAdaptor) {
          dataAdaptor.refresh(data.data, config, spec, cacheId);
        } else {
          dataAdaptor = new SunburstDataAdaptor(data.data, config, spec, cacheId);
        }
        this.setState({ [resourceName]: { loaded: true, dataAdaptor } });
      }
    }
  };

  resizeChart = () => {
    if (this.sunburstChart) {
      this.resizeTimer && clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.sunburstChart.resize();
      }, 400);
    }
  };

  updateChart = () => {
    this.forceUpdate();
  };

  getStyles({ showTitle, subheader, subtitle, title }) {
    const { palette, gridLayout } = this.props.muiTheme;

    return {
      header: {
        color: palette.secondaryTextColor,
        borderBottom: `solid 1px ${gridLayout.bgColor}`,
        display: !showTitle ? 'none' : '',
      },
      title: {
        whiteSpace: subheader || subtitle ? 'nowrap' : '',
        //maxWidth: 'calc(100% - 50px)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: !showTitle || !title ? 'none' : '',
      },
      subtitle: {
        color: palette.disabledColor,
        whiteSpace: title ? 'nowrap' : '',
        //maxWidth: 'calc(100% - 50px)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: subheader || subtitle ? '' : 'none',
      },
      container: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: gridLayout.paneColor,
      },
      chart: {
        width: '100%',
        height: '100%',
      },
    };
  }

  render() {
    const { componentId, inEditor, config } = this.props;
    const { dataRes } = this.state;

    const title = getLocal(config, 'title');
    const subtitle = getLocal(config, 'subtitle');
    const data = (dataRes.dataAdaptor || {}).plotData || [];
    const categoriesAxe = _.find(config.axes, ['type', 'categories']) || {};
    const categoryField = (categoriesAxe.fields || [])[categoriesAxe.selectedFieldIndex] || {};
    const drillFieldIndex = _.indexOf((config.drill || {}).hierarchy || [], categoryField.id);
    const hasDrillDown = drillFieldIndex >= 0 && !_.isUndefined(config.drill.hierarchy[drillFieldIndex + 1]);
    const lastDataItem = data[data.length - 1] ? data[data.length - 1] : {};
    const subheader = lastDataItem.subheader || null;
    const showTitle = (config || {}).showtitle || false;

    const classNames = ['hsChartContainer'];
    if (hasDrillDown) classNames.push('hasDrillDown');

    const styles = this.getStyles({ showTitle, subheader, subtitle, title });

    return (
      <div
        key={'container' + componentId}
        id={'container_' + componentId}
        className={classNames.join(' ')}
        ref={(c) => {
          this.container = c;
        }}
        style={styles.container}
      >
        <div className='componentHeader' style={styles.header}>
          <span>
            <span className='titleText strongly' style={styles.title}>
              {title || ''}
            </span>
            <span className='subtitleText' style={styles.subtitle}>
              {subheader || subtitle}
            </span>
          </span>
          <span className='path' />
        </div>
        <div className='componentBody' style={{ position: 'relative', flexGrow: 1 }}>
          <div className='sunburstCanvas' style={styles.canvas}>
            {/* диаграмма */}
            <div
              className='componentContainer'
              id={`sunburstContainer_${componentId}_${!!inEditor}`}
              style={styles.chart}
              ref={(el) => {
                this.el = el;
              }}
            />
            <div
              className='backSide'
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: _.unescape(getDescription(config) || '') }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default HsSunburstChart;
