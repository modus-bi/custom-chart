import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import MainOptions from './MainOptions';
import VisualsOptions from './VisualsOptions';

export default class Settings extends PureComponent {
  static propTypes = {
    component: PropTypes.object,
    reportlist: PropTypes.object.isRequired,
    changeChart: PropTypes.func.isRequired,
    pluginImports: PropTypes.object.isRequired,
  };

  render() {
    const { component, changeChart, pluginImports } = this.props;

    const {
      FilterModeOptionsContent,
      DrillOutOptionsContent,
      DescriptionOptionsContent,
      OutlineOptionsContent,
    } = pluginImports.sections;

    return (
      <div className='hsChartSettings'>
        <MainOptions open={undefined} component={component} pluginImports={pluginImports} changeChart={changeChart} />

        <VisualsOptions component={component} pluginImports={pluginImports} changeChart={changeChart} />

        {FilterModeOptionsContent}
        {DrillOutOptionsContent}
        {DescriptionOptionsContent}
        {OutlineOptionsContent}
      </div>
    );
  }
}
