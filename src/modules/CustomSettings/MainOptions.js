import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class MainOptions extends PureComponent {
  static propTypes = {
    component: PropTypes.object,
    open: PropTypes.bool,
    pluginImports: PropTypes.object,
    changeChart: PropTypes.func.isRequired,
  };

  render() {
    const { open, component, pluginImports, changeChart } = this.props;

    if (!component) return null;

    const {
      autoApplyToggleContent,
      showtitleToggleContent,
      titleTextFieldContent,
      containerMarginSettingsContent,
    } = pluginImports.sections;

    const { SettingsColorPicker, SettingsItem, SettingsSection } = pluginImports.components;

    const config = component.config || {};
    return (
      <div>
        {autoApplyToggleContent}
        <SettingsSection open={open} title='Общие настройки'>
          {showtitleToggleContent}
          {titleTextFieldContent}
          {containerMarginSettingsContent}

{/*          <SettingsItem type='inline' title='Цвет фона'>
            <SettingsColorPicker
              float='right'
              color={config.backgroundColor === 'transparent' ? undefined : config.backgroundColor}
              onChange={(value) => changeChart('setBackgroundColor', { value })}
            />
          </SettingsItem>*/}
        </SettingsSection>
      </div>
    );
  }
}
