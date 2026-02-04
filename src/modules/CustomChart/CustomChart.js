import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import CommonChartAdaptor from '../../duplicates/adaptors/CommonChartAdaptor/CommonChartAdaptor';
import defaultConfig from './defaultConfig.json';
import Content from './Content';
import './CustomChart.scss';

export default class CustomChart extends Component {
  static propTypes = {
    id: PropTypes.string,
    componentId: PropTypes.number.isRequired,
    title: PropTypes.string,
    type: PropTypes.string.isRequired,
    config: PropTypes.object.isRequired,
    configDraft: PropTypes.object,
    datas: PropTypes.object,
    loadDatas: PropTypes.func.isRequired,
    editable: PropTypes.bool,
    editorActive: PropTypes.bool.isRequired,
    changeEditorComponent: PropTypes.func.isRequired,
    changeComponentVisuals: PropTypes.func.isRequired,
    changeCustomChart: PropTypes.func.isRequired,
  };

  static getDefaultConfig() {
    return defaultConfig;
  }

  resizeChart(long) {

  }

  render() {
    const { config, changeEditorComponent } = this.props;

    return (
      <CommonChartAdaptor
        content={Content}
        {...this.props}
        config={_.defaultsDeep(config, _.omit(defaultConfig, 'axes'))}
        onComponentChange={(component) => changeEditorComponent(component)}
      />
    );
  }
}
