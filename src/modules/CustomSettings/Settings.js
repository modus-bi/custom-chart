import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import MainOptions from './MainOptions';

export default class Settings extends PureComponent {
  static propTypes = {
    component: PropTypes.object,
    reportlist: PropTypes.object.isRequired,
    changeChart: PropTypes.func.isRequired,
    pluginImports: PropTypes.object.isRequired,
  };

  render() {
    const { component, pluginImports, changeChart } = this.props;

    const {
      DataOptionsContent,
      DescriptionOptionsContent,
      OutlineOptionsContent,
    } = pluginImports.sections;

    return (
      <div className='hsChartSettings'>
        <MainOptions
          open={undefined}
          component={component}
          pluginImports={pluginImports}
          changeChart={changeChart}
        />

        {DataOptionsContent}
        {DescriptionOptionsContent}
        {OutlineOptionsContent}
      </div>
    );
  }
}
