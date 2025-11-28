import React from 'react';
import PropTypes from 'prop-types';
import MainOptions from './MainOptions/MainOptions';

const Settings = ({ pluginImports, component, changeChart }) => {
  const {
    DataOptionsContent,
    DrillOutOptionsContent,
    DescriptionOptionsContent,
    OutlineOptionsContent,
  } = pluginImports.sections;

  return (
    <div>
      <MainOptions component={component} pluginImports={pluginImports} changeChart={changeChart} />
      {DataOptionsContent}
      {DrillOutOptionsContent}
      {DescriptionOptionsContent}
      {OutlineOptionsContent}
    </div>
  );
};

Settings.propTypes = {
  component: PropTypes.object,
  reportlist: PropTypes.object.isRequired,
  changeChart: PropTypes.func.isRequired,
  pluginImports: PropTypes.object.isRequired,
};

Settings.displayName = 'Settings';

export default Settings;
