import { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import ProgressBarChart from './ProgressBarChart/ProgressBarChart';
import { getDefaultConfig } from './getDefaultConfig';

export default class CustomChart extends Component {
  static getDefaultConfig() {
    return getDefaultConfig();
  }

  static contextTypes = {
    muiTheme: PropTypes.object.isRequired,
  };

  static propTypes = {
    id: PropTypes.string,
    componentId: PropTypes.number.isRequired,
    cacheId: PropTypes.string,
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

  constructor(props) {
    super(props);
  }

  resizeChart() {}

  render() {
    const { config, changeEditorComponent } = this.props;
    const updatedConfig = _.defaultsDeep(config, _.omit(getDefaultConfig(), 'axes'));
    return (
      <ProgressBarChart
        config={updatedConfig}
        onComponentChange={changeEditorComponent}
        {...this.props}
        theme={this.context.muiTheme}
      />
    );
  }
}
