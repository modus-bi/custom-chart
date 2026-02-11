import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { getDatasetId, getDescription, getLocal } from '../../helpers';
import CommonDataAdaptor from './CommonDataAdaptor';
import ComponentTypeManager from '../../../managers/ComponentTypeManager';

export default class CommonChartAdaptor extends Component {

  static propTypes = {
    id: PropTypes.string,
    content: PropTypes.object.isRequired,
    componentId: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    config: PropTypes.object,
    cacheId: PropTypes.string,
    data: PropTypes.object,
    datasets: PropTypes.object,
    reportOptions: PropTypes.object,
    commonWidgets: PropTypes.object,
    hsTheme: PropTypes.object,

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
  };

  constructor(props) {
    super(props);
    this.state = { dataAdaptor: null };
    this.container = null;
    this.stateObj = null;
    this.loaded = false;
    this.reloadTimer = null;
  }

  componentDidMount() {
    window.addEventListener('resize', this.resizeChart);
    this.getData(this.props);
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.getData(props);
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
    const { dataAdaptor } = nextState;
    if (!(dataAdaptor || {}).plotData) return null;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeChart);
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
        else {
          const componentTypeManager = new ComponentTypeManager(props.type);
          dataAdaptor = componentTypeManager.getDataAdaptor(data.data, config, null, cacheId);
        }

        this.setState({ dataAdaptor });
      }
      this.loaded = !data.fetching;
    }
  }

  resizeChart = () => {

  }

  updateChart = () => {
    this.forceUpdate();
  }

  getStyles = () => {
    const { dataAdaptor } = this.state;
    const { config, inEditor, hsTheme } = this.props;
    const { palette, gridLayout } = hsTheme;
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
        display: (!config.showtitle) ? 'none' : ''
      },
      title: {
        whiteSpace: (subheader || subtitle) && !bottomSubtitle ? 'nowrap' : '',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: (!config.showtitle || !title) ? 'none' : ''
      },
      subtitle: {
        color: palette.componentSubtitleTextColor,
        whiteSpace: (config.title) ? 'nowrap' : '',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: (subheader || subtitle) ? '' : 'none'
      },
      container: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: `calc(100% - ${inEditor?'190px':'0px'})`,
        position: 'relative',
        border: 'none',
        backgroundColor: gridLayout.paneColor,
      },
      body: {
        position: 'relative',
        flexGrow: 1,
        height: 'calc(100% - 30px)',
        width: '100%',
        borderBottomLeftRadius: 'inherit',
        borderBottomRightRadius: 'inherit',
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
    const { config, componentId, pluginImports, content } = this.props;
    const styles = this.getStyles();
    const { LoadProgress } = pluginImports.components;

    const data = dataAdaptor?.plotData || [];
    const lastDataItem = _.last(data) || {};
    const subheader = lastDataItem.subheader || null;
    const classNames = ['hsChartContainer'];
    const title = getLocal(config, 'title');
    const subtitle = getLocal(config, 'subtitle');
    const ContentChart = content

    return (
      <div
        id={'container_' + componentId}
        className={classNames.join(' ')}
        ref={(c) => {
          this.container = c;
        }}
        style={styles.container}
      >
        {this.renderTitles(styles, title, subheader || subtitle)}
        <div className='componentBody' style={styles.body}>
          <ContentChart plotData={data} {...this.props} />
          {!this.loaded && !config.hideSpinner && <LoadProgress className='centered' />}
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
