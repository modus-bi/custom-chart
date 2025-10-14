import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { isMobile } from 'react-device-detect';
import * as echarts from 'echarts';
import i18n from 'i18next';
import _ from 'lodash';

import CommonDataAdaptor from '../CommonChartAdaptor/CommonDataAdaptor';
import ComponentTypeManager from '../../../managers/ComponentTypeManager';
import '../../constants/formatOptions';
import { getDatasetId, getDescription, getLocal } from '../../helpers';
import { canonForDataCursor } from '../../helpers';
import { isFilterMode, getColorset } from '../../helpers';
import { getVariablesForSettings } from '../../helpers/HsFilterControlPanelHelpers';
import DataAdaptor from './EChartsDataAdaptor';
import './EChartsChartAdaptor.scss';

global.charts = [];

export default class EChartsChartAdaptor extends Component {

  static contextTypes = {
    muiTheme: PropTypes.object.isRequired
  };

  static propTypes = {
    id: PropTypes.string,
    componentId: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    config: PropTypes.object,
    cacheId: PropTypes.string,
    data: PropTypes.object,
    datasets: PropTypes.object,
    reportOptions: PropTypes.object,
    commonWidgets: PropTypes.object,

    editorActive: PropTypes.bool.isRequired,
    mainMenuActive: PropTypes.bool,
    drillDownActive: PropTypes.bool,

    loadDatas: PropTypes.func.isRequired,
    reloadDatas: PropTypes.func.isRequired,
    drillDown: PropTypes.func,
    setCursorHovered: PropTypes.func,
    setCursorClicked: PropTypes.func,
    changeFilterCategories: PropTypes.func,
    changeMultipleGlobalFilterValueAndApply: PropTypes.func,
  };

  static defaultProps = {
    id: 'chart',
    data: null,
    config: null,
    editorActive: false,
    reportOptions: {},
    setCursorHovered: () => (null),
    setCursorClicked: () => (null),
  };

  constructor(props) {
    super(props);
    const componentTypeManager = new ComponentTypeManager(props.type);
    this.specGenerator = componentTypeManager.getSpecGenerator();
    this.state = { dataAdaptor: null };
    this.container = null;
    this.chartDiv = null;
    this.chartColors = [];
    this.stateObj = null;
    this.loaded = false;
    this.firstDraw = true;
    this.resizeTimer = [];
    this.reloadTimer = null;
    this.animationFrame = null;
    this.hasDrillDown = false;
    this.clickCounter = 0;
    this.clickCategory = null;
  }


  componentDidMount() {
    // Create the echarts instance
    this.Chart = echarts.init(this.chartDiv, null, { renderer: 'svg' });
    global.charts[this.props.id] = this.Chart;
    window.addEventListener('resize', this.resizeChart);
    window.addEventListener('dataCursorChanged', this.highlightDataItem);
    this.getData(this.props);
    this.mergeColors();
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.getData(props);
    this.mergeColors();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { config, cacheId, skipRender, componentId, cursor, reportOptions } = nextProps;
    if (skipRender) {
      return false;
    }
    const stateObjNew = {
      componentId,
      cacheId,
      loaded: this.loaded,
      config: _.cloneDeep(config),
      cursor: _.cloneDeep(cursor),
      reportOptions: _.cloneDeep(reportOptions)
    };
    let res = false;
    res = res || !_.isEqual(stateObjNew, this.stateObj);
    if ((nextProps.editorActive !== nextProps.inEditor) || nextProps.mainMenuActive) {
      return false;
    }
    this.stateObj = stateObjNew;
    return res;
  }

  UNSAFE_componentWillUpdate(nextProps, nextState) {
    const { config, type } = nextProps;
    const { dataAdaptor } = nextState;
    if (!(dataAdaptor || {}).plotData) return null;
    const componentTypeManager = new ComponentTypeManager(type);
    const specGenerator = componentTypeManager.getSpecGenerator();
    if (specGenerator && this.loaded) {
      const mergedSpec = specGenerator.getSpec(config, dataAdaptor.plotData);
      this.plot(nextProps, dataAdaptor.plotData, mergedSpec);
    }
  }

  componentWillUnmount() {
    const { id } = this.props;
    window.removeEventListener('resize', this.resizeChart);
    window.removeEventListener('dataCursorChanged', this.highlightDataItem);
  }

  getData = (props) => {
    const { config, data, cacheId, loadDatas, reloadDatas, editorActive, componentId } = props;
    let { dataAdaptor } = this.state;
    const datasetId = getDatasetId(config);
    if (!datasetId) return;

    const queryObjects = CommonDataAdaptor.getQueryObjects(config);
    // данных нет в кэше - заказываем скачивание
    if (!data && cacheId) {
      this.loaded = false;
      loadDatas(datasetId, null, config.filters, queryObjects, { editor: editorActive, componentId });
      if (config.refresh && config.refreshTime) {
        // Интервальное обновление данных
        clearInterval(this.reloadTimer);
        this.reloadTimer = setInterval(() => reloadDatas(datasetId, null, config.filters, queryObjects, {
          editor: editorActive,
          componentId
        }), config.refreshTime * 1000);
      }
      else if (this.reloadTimer) {
        clearInterval(this.reloadTimer);
        this.reloadTimer = null;
      }
    }

    // данные есть в кэше
    else if (data) {
      // данные закачаны в кэш полностью
      if (data.fetching === false) {
        // создаем адаптер данных, если необходимо
        if (dataAdaptor) dataAdaptor.refresh(data.data, config, null, cacheId);
        else dataAdaptor = new DataAdaptor(data.data, config, null, cacheId);
        this.setState({ dataAdaptor });
      }
      this.loaded = !data.fetching;
    }
  }

  refreshData = () => {
    const { config, cacheId, reloadDatas, editorActive, componentId } = this.props;
    const datasetId = getDatasetId(config);
    const queryObjects = CommonDataAdaptor.getQueryObjects(config);
    if (cacheId) {
      reloadDatas(datasetId, null, config.filters, queryObjects, {
        editor: editorActive,
        componentId
      });
    }
  }

  mergeColors = () => {
    const { reportOptions } = this.props;
    const { palette } = this.context.muiTheme;
    this.chartColors = getColorset(reportOptions, palette);
  }

  resetClickCounter = () => {
    this.clickCounter = 0;
  }

  getGraphData = (e) => {
    /** Receives chartCursor or Slice event object, returns graph/slice data **/
    if (!(e && e.data)) return null;
    const dataItem = e.data;
    return dataItem || null;
  }

  setAllElementsOpacity(opacity) {
    const container = this.container;
    // column chart
    [].slice.call(container.querySelectorAll(`
      .amcharts-graph-fill,
      .amcharts-graph-stroke,
      .amcharts-graph-column .amcharts-graph-column,
      .amcharts-pie-item,
      .amcharts-pie-label
    `)).map(
      (o) => o.setAttribute('opacity', opacity)
    );
  }

  toggleHighlight = (idx) => {
    const { id } = this.props;
    const chart = global.charts[id];
    if (chart) {
      const chartData = chart?._model?.option?.series[0]?.data || [];
      _.map(chartData, (dataItem, dataIndex) => {
        if (dataIndex === idx) {
          /** Highlight **/
          chart.dispatchAction({
            type: 'highlight',
            name: dataItem.name
          });
        }
        else {
          /** Restore **/
          chart.dispatchAction({
            type: 'downplay',
            name: dataItem.name
          });
        }
      });
    }
  }

  highlightDataItem = () => {
    const { id, reportOptions } = this.props;
    const cursor = global.dataCursor;
    if (!cursor) return;
    if (reportOptions.globalCursorEnabled && cursor.enabled) {
      const hoverPoint = cursor.hovered || {}; // dataCursor hover data
      const chart = global.charts[id];
      const chartData = chart?._model?.option?.series[0]?.data || [];
      const chartCursor = (chart || {}).chartCursor;
      if (chart) {
        /** Find matched chart element for highlighting **/
        const dataIndex = _.findIndex(chartData, (o) => {
          const dataContext = o.dataContext || {};
          const hoveredCategoryName = (hoverPoint.category || {}).name;
          const hoveredCategoryField = (hoverPoint.category || {}).field || {};
          const categoryField = dataContext.categoryField || {};
          const dataItemFieldTitle = categoryField.title || categoryField.alias;
          const hoveredFieldTitle = hoveredCategoryField.title || hoveredCategoryField.alias;
          let match = ( // check category is not empty
            !_.isEmpty('' + dataContext.categories) && !_.isEmpty('' + hoveredCategoryName)
          );
          // compare by category name
          match = match && (canonForDataCursor(dataContext.categories) === canonForDataCursor(hoveredCategoryName));
          // and compare by title/alias
          if (!_.isEmpty(dataItemFieldTitle) && !_.isEmpty(hoveredFieldTitle)) {
            match = match && (dataItemFieldTitle === hoveredFieldTitle);
          }
          else match = false;
          return match;
        });
        /** Highlight **/
        if (dataIndex > -1/* && chart.id !== hoverPoint.chartID*/) {
          const dataItem = chartData[dataIndex];
          const categoryName = dataItem.dataContext.categories || '';

          this.setAllElementsOpacity(0.3); // fade all elements
          this.toggleHighlight(dataIndex); // highlight selected element
          if (chartCursor && chartCursor.events) {
            // Pop-up balloons by category (for Serial Chart)
          }
        }
        /** Un-highlight **/
        else {
          this.setAllElementsOpacity(1); // un-fade all elements
          if (chart.id !== hoverPoint.chartID) {
            this.toggleHighlight();
            // Hide all cursors and balloons

          }
        }
      }
    }
  }


  handleSetCursor = (item, cursorType) => {
    if (!item.dataContext) return;
    const { id, componentId, config, datasets, setCursorClicked, setCursorHovered } = this.props;
    const valueAxe = _.find(config.axes, ['type', 'values']);
    const itemValue = item.value || (item.values || {}).value;
    const itemValueKey = _.reduce(item.dataContext, (key, v, k) => ((v === itemValue) ? key : ''), '');
    const valueIndex = Number(itemValueKey.replace('values', ''));
    const valueFieldID = item.dataContext[`id${valueIndex}`];
    const valueField = _.find(valueAxe.fields || [], ['id', valueFieldID]) || {};
    const dataset = _.find(datasets.data || [], ['ID', valueField.datasetId]) || {};
    const valueDataField = _.find(dataset.fields || [], ['name', valueField.name]) || {};
    const categoriesAxe = _.find(config.axes, ['type', 'categories']);
    const categoryField = categoriesAxe.fields[categoriesAxe.selectedFieldIndex] || {};
    const categoryDataField = _.find(dataset.fields || [], ['name', categoryField.name]) || {};
    const itemCategoryValue = item.dataContext.categories;
    // Set click cursor
    switch (cursorType) {
      case 'click' :
        setCursorClicked({
          containerID: componentId,
          chartID: id,
          category: { name: itemCategoryValue, field: _.merge({}, categoryField, categoryDataField) },
          value: { amount: itemValue, field: _.merge({}, valueField, valueDataField) }
        });
        break;
      case 'hover' :
        setCursorHovered({
          containerID: componentId,
          chartID: id,
          category: { name: itemCategoryValue, field: _.merge({}, categoryField, categoryDataField) },
          value: { amount: itemValue, field: _.merge({}, valueField, valueDataField) }
        });
        break;
      default :
        break;
    }
  }

  handleDrillDown = (item) => {
    if (_.isEmpty(item.dataContext)) {
      return;
    }
    const { drillDownActive, drillDown, componentId, config } = this.props;
    const itemCategoryName = item.dataContext.categories;
    const categoriesAxe = _.find(config.axes, ['type', 'categories']);
    if (drillDownActive) {
      const categoryField = categoriesAxe.fields[categoriesAxe.selectedFieldIndex];
      drillDown(componentId, categoryField.name, itemCategoryName);
    }
  }

  handleClickItem = (o) => {
    const { config } = this.props;
    const dataItem = this.getGraphData(o);
    if (!dataItem) return;

    const category = dataItem.dataContext.categories;

    if (isMobile) {
      /** Mobile devices **/
      if (this.clickCategory !== category) {
        this.resetClickCounter();
      }
      this.clickCounter += 1;
      this.clickCategory = category;

      // on single tap
      if (this.clickCounter === 1) {
        // set cursor
        this.handleSetCursor(dataItem, 'click');
      }
      // on double tap
      else {
        if (isFilterMode(config)) {
          // set filter
          this.handleClickFilterMode(o, dataItem);
        }
        else {
          // set drill
          this.handleDrillDown(dataItem);
        }
        this.resetClickCounter();
      }
    }
    else {
      /** Desktop **/
      // set cursor
      this.handleSetCursor(dataItem, 'click');

      if (isFilterMode(config)) {
        // set filter
        this.handleClickFilterMode(o, dataItem);
      }
      else {
        // set drill
        this.handleDrillDown(dataItem);
      }
    }
  }

  handleHoverItem = (o) => {
    const dataItem = this.getGraphData(o);
    if (!dataItem) return;
    this.handleSetCursor(dataItem, 'hover');
  }

  handleOutItem = (o) => {
    const { id } = this.props;
    const { type, target } = o;
    //if (!chart) return;
    //if (type === 'onHideCursor' && !(target.mouseX && target.mouseY)) return;
    const { setCursorHovered } = this.props;
    setCursorHovered({ chartID: id, category: null, value: null });
  }

  handleClickFilterMode = (o, item) => {
    const {
      report,
      componentId,
      config,
      changeFilterCategories,
      changeMultipleGlobalFilterValueAndApply
    } = this.props;

    const categoriesAxe = _.find(config.axes, ['type', 'categories']);
    const categoryField = categoriesAxe.fields[categoriesAxe.selectedFieldIndex];

    if (!categoryField) return;

    let selected = (((config.filterCategories || {})[categoryField.name] || {}).selected || []);
    if (item.dataContext) {
      const category = item.dataContext.categories;
      if (o.event.event.ctrlKey) {
        if (selected.includes(category)) {
          selected.splice(selected.indexOf(category), 1);
        }
        else {
          selected.push(category);
        }
      }
      else {
        if (selected.includes(category)) {
          selected.splice(selected.indexOf(category), 1);
        }
        else {
          selected = [category];
        }
      }
    }

    changeFilterCategories(
      componentId,
      categoryField,
      {
        selected
      }
    );

    const variables = getVariablesForSettings({
      components: report.data.grid.components,
      fieldAlias: categoryField.alias || categoryField.name,
      selected
    });

    changeMultipleGlobalFilterValueAndApply([{
      fieldAlias: categoryField.alias,
      settings: {
        selected,
        autofilter: null,
        autofilterChanged: true,
        filterMode: 'by value',
        variables
      }
    }]);
  }

  /** Plot chart **/
  plot = (props, data, spec) => {
    const { id, config, editorActive } = props;
    const categoriesAxe = _.find(config.axes, ['type', 'categories']) || {};
    const categoryField = (categoriesAxe.fields || [])[categoriesAxe.selectedFieldIndex] || {};
    const drillFieldIndex = _.indexOf(((config.drill || {}).hierarchy || []), categoryField.id);
    this.hasDrillDown = (drillFieldIndex >= 0) && !_.isUndefined(config.drill.hierarchy[drillFieldIndex + 1]);

    if (props.data && !props.data.fetching) {
      /*** NO DATA ***/
      if (_.isEmpty(data)) {
        // Remove chart & show message
        this.showMessage(i18n.t('нет данных'));
      }

      /*** NORMAL PLOT ***/
      else {
        const currentSpec = _.cloneDeep(spec);
        _.set(currentSpec, 'id', id);
        // Set muiTheme color palette (multiplied x10 times) for charts
        _.set(currentSpec, 'color', this.chartColors);
        // Set drill flag
        _.set(currentSpec, 'hasDrillDown', !!this.hasDrillDown);

        if (this.Chart) {
          // Draw chart spec
          this.Chart.setOption(currentSpec);

          this.Chart.on('click', this.handleClickItem);
          this.Chart.on('mouseover', this.handleHoverItem);
          this.Chart.on('mouseout', this.handleOutItem);

          // resize to container
          this.resizeTimer[`rs_${id}`] = setTimeout(() => {
            if (this.Chart) {
              this.Chart.resize();
            }
          }, 200); // await of pane animation been finished to get right dimensions*/

        }

      }
    }
  }

  showMessage = (text) => {
    const msg = (
      <div className='noData centered'>
        <div>{text || ''}</div>
      </div>
    );
    ReactDOM.render(msg, this.chartDiv);
  }

  resizeChart = () => {
    const self = this;
    const container = this.container;
    const { id, editorActive, inEditor, mainMenuActive } = this.props;
    const { dataAdaptor } = this.state;
    if (editorActive !== inEditor || mainMenuActive) return null;
    if (!self.chartDiv || !dataAdaptor || _.isEmpty(dataAdaptor.plotData)) return null;
    // fade out container
    container.classList.add('fade');
    // fade in for print version
    if (window.isPrinting) container.classList.remove('fade');
    // fade/resize timer
    if (this.resizeTimer[`rs_${id}`]) clearTimeout(this.resizeTimer[`rs_${id}`]);
    this.resizeTimer[`rs_${id}`] = setTimeout(() => {
      const timer = new Date().getTime();
      const loop = setInterval(() => {
        if (new Date().getTime() - timer > 350) {
          clearInterval(loop);
          // fade in container
          container.classList.remove('fade');
        }
      }, 50);
      if (this.Chart) {
        this.Chart.resize();
      }
    }, 600); // await of pane animation been finished to get right dimensions*/
    return true;
  }

  updateChart = () => {
    this.forceUpdate();
  }

  getStyles = () => {
    const { palette, gridLayout } = this.context.muiTheme;
    const { dataAdaptor } = this.state;
    const { config } = this.props;
    const data = (dataAdaptor || {}).plotData || [];
    const title = getLocal(config, 'title');
    const subtitle = getLocal(config, 'subtitle');
    const bottomSubtitle = _.get(config, 'bottomSubtitle', false);
    const lastDataItem = _.last(data) || {};
    const subheader = lastDataItem.subheader || null;
    const isEnabledBorder = _.get(config, 'outline.enabled', false);
    const borderWidth = isEnabledBorder ? _.get(config, 'outline.width', 1) : 1;
    const borderColor = _.get(config, 'outline.color', 'rgba(221, 223, 228, 1)');
    const headerBorderStyle = (isEnabledBorder)
      ? `${borderWidth}px solid ${borderColor}`
      : 'none';


    return {
      header: {
        color: palette.secondaryTextColor,
        //color: palette.componentTitleTextColor,
        //borderBottom: `solid 1px ${gridLayout.bgColor}`,
        display: (!config.showtitle) ? 'none' : ''
      },
      title: {
        whiteSpace: (subheader || subtitle) && !bottomSubtitle ? 'nowrap' : '',
        //maxWidth: 'calc(100% - 50px)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: (!config.showtitle || !title) ? 'none' : ''
      },
      subtitle: {
        color: palette.componentSubtitleTextColor,
        whiteSpace: (config.title) ? 'nowrap' : '',
        //maxWidth: 'calc(100% - 50px)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: (subheader || subtitle) ? '' : 'none'
      },
      container: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        border: 'none',
        //overflow: 'hidden',
        backgroundColor: gridLayout.paneColor,
      },
      body: {
        position: 'relative',
        flexGrow: 1,
        borderBottomLeftRadius: 'inherit',
        borderBottomRightRadius: 'inherit',
      },
      chart: {
        position: 'absolute',
        width: 'auto',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderBottomLeftRadius: 'inherit',
        borderBottomRightRadius: 'inherit',
        top: (config.margin.t || 0) + (config.margin.pad || 0),
        right: (config.margin.r || 0) + (config.margin.pad || 0),
        bottom: (config.margin.b || 0) + (config.margin.pad || 0),
        left: (config.margin.l || 0) + (config.margin.pad || 0)
      },
      borderTitle: {
        borderBottom: headerBorderStyle,
      }
    };
  }

  renderTitles(styles, title, subtitle) {
    const { dataAdaptor } = this.state;
    const data = (dataAdaptor || {}).plotData || [];
    const lastDataItem = _.last(data) || {};
    const subheader = lastDataItem.subheader || null;

    return (
      <div className='componentHeader' style={{...styles.header, ...styles.borderTitle}}>
        <span>
          <span>
            <span className='titleText strongly' style={styles.title}>{title || ''}</span>
            <span className='subtitleText' style={styles.subtitle}>{subheader || subtitle}</span>
          </span>
          <span className='path'/>
        </span>
      </div>
    );
  }

  render() {
    const { dataAdaptor } = this.state;
    const { config, componentId, pluginImports } = this.props;
    const styles = this.getStyles();
    const { LoadProgress } = pluginImports.components;

    const data = (dataAdaptor || {}).plotData || [];
    const lastDataItem = _.last(data) || {};
    const subheader = lastDataItem.subheader || null;
    const classNames = ['hsChartContainer', 'ECharts'];
    const chartClassNames = ['componentContainer'];
    const title = getLocal(config, 'title');
    const subtitle = getLocal(config, 'subtitle');
    const bottomSubtitle = _.get(config, 'bottomSubtitle', false);
    if (this.hasDrillDown) classNames.push('hasDrillDown');
    if (!!bottomSubtitle) chartClassNames.push('bottomSubTitle')

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
        {this.renderTitles(styles, title, subheader || subtitle)}
        <div className='componentBody' style={styles.body}>
          <div
            className={chartClassNames.join(' ')}
            style={styles.chart}
            id={'echarts_' + componentId}
            key={'echarts_' + componentId}
            ref={(c) => {
              this.chartDiv = c;
            }}
          />
          {(!this.loaded && !config.hideSpinner) && <LoadProgress className='centered'/>}
          <div
            className='backSide'
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: _.unescape(getDescription(config) || '') }}
          />
        </div>
      </div>
    );
  }
}
