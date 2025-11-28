import React from 'react';
import PropTypes from 'prop-types';

const ColorSettingItem = ({ pluginImports, enabled = true, title, onChange, color }) => {
  const { SettingsItem, SettingsColorPicker } = pluginImports.components;

  return (
    <SettingsItem type='inline' title={title} disabled={!enabled}>
      <SettingsColorPicker disabled={!enabled} float='right' color={color} onChange={onChange} />
    </SettingsItem>
  );
};

ColorSettingItem.propTypes = {
  title: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  pluginImports: PropTypes.object,
  enabled: PropTypes.bool,
};

ColorSettingItem.displayName = 'ColorSettingItem';

export default ColorSettingItem;
