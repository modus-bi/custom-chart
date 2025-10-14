import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import HsSunburstChart from './HsSunburstChart';
import defaultConfig from './defaultConfig.json';
import ComponentTypeManager from 'managers/ComponentTypeManager';

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
  };

  static getDefaultConfig() {
    return defaultConfig;
  }

  resizeChart(long) {
    this.refs.HsSunburstChart.resizeChart(long);
  }

  render() {
    const { config, changeEditorComponent, skipRender, component, pluginImports } = this.props;

    let spec;
    const componentTypeManager = new ComponentTypeManager(component.type);
    const specGenerator = componentTypeManager.getSpecGenerator();
    if (specGenerator && !skipRender) {
      spec = specGenerator.getSpec(component.config);
    }

    return (
      <HsSunburstChart
        ref='HsSunburstChart'
        {...this.props}
        pluginImports={pluginImports}
        spec={spec}
        config={_.defaultsDeep(config, _.omit(defaultConfig, 'axes'))}
        onComponentChange={(component) => changeEditorComponent(component)}
      />
    );
  }
}
