import React from 'react';
import PropTypes from 'prop-types';
import ColorSettingItem from '../CommonSettingItems/ColorSettingItem/ColorSettingItem';
import { getDefaultConfig } from '../../CustomChart/getDefaultConfig';

const MainOptions = ({ open, component, pluginImports, changeChart }) => {
  if (!component) return null;

  const {
    autoApplyToggleContent,
    showTitleToggleContent,
    titleTextFieldContent,
    containerMarginSettingsContent,
  } = pluginImports.sections;

  const { SettingsSection } = pluginImports.components;
  const { config } = component;
  const bgColor = config.bgColor || getDefaultConfig().bgColor;
  const onChange = (color) => {
    changeChart('changeStyleBgColor', { value: color });
  };
  return (
    <div>
      {autoApplyToggleContent}
      <SettingsSection open={open} title='Общие настройки'>
        {showTitleToggleContent}
        {titleTextFieldContent}
        {containerMarginSettingsContent}
        <ColorSettingItem
          title={'Цвет фона'}
          pluginImports={pluginImports}
          onChange={onChange}
          color={bgColor}
        />
      </SettingsSection>
    </div>
  );
};

MainOptions.propTypes = {
  component: PropTypes.object,
  open: PropTypes.bool,
  pluginImports: PropTypes.object,
  changeChart: PropTypes.func,
};

MainOptions.displayName = 'MainOptions';

export default MainOptions;
