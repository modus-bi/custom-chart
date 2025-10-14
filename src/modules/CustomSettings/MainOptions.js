import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class MainOptions extends PureComponent {
  static propTypes = {
    component: PropTypes.object,
    open: PropTypes.bool,
    pluginImports: PropTypes.object,
  };

  render() {
    const { open, component, pluginImports } = this.props;

    if (!component) return null;

    const {
      autoApplyToggleContent,
      showtitleToggleContent,
      titleTextFieldContent,
      containerMarginSettingsContent,
      precisionSliderContent,
      suffixSelectContent,
    } = pluginImports.sections;

    const { SettingsSection } = pluginImports.components;

    return (
      <div>
        {autoApplyToggleContent}
        <SettingsSection open={open} title='Общие настройки  ***PLUGIN17***'>
          {showtitleToggleContent}
          {titleTextFieldContent}
          {containerMarginSettingsContent}
          {precisionSliderContent}
          {suffixSelectContent}
        </SettingsSection>
      </div>
    );
  }
}
