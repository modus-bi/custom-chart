import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { fontTypes } from 'duplicates/constants/visualsOptions';

export default class VisualsOptions extends PureComponent {
  static contextTypes = {
    muiTheme: PropTypes.object.isRequired,
  };

  static propTypes = {
    component: PropTypes.object,
    open: PropTypes.bool,
    changeChart: PropTypes.func.isRequired,
  };

  getStyles() {
    const { palette } = this.context.muiTheme;

    return {
      textbox: { width: '100%', height: '36px' },
      mainSelector: { minWidth: '150px' },
      smallSelector: { minWidth: '120px', maxWidth: '120px', maxHeight: '160px' },
      sliderContainer: { zIndex: '-1', minWidth: '80px', maxWidth: '80px' },
      slider: { margin: '0', width: '95%' },
      textfieldSm: { width: '50px' },
      calcLabel: { width: 120, textAlign: 'right', margin: '0 8px 0 0', color: palette.accent2Color },
    };
  }

  render() {
    const { open, component, changeChart, pluginImports } = this.props;

    const {
      SettingsSection,
      SettingsItem,
      SettingsMultiselect,
      SettingsTextField,
      SettingsToggle,
    } = pluginImports.components;

    const styles = this.getStyles();

    if (!component) return null;
    const config = component ? component.configDraft : {};
    const disabled = false;
    const font = (config || {}).font;

    return (
      <SettingsSection open={open} title='Стилизация'>
        <SettingsItem type='inline' title='Тип шрифта' disabled={disabled}>
          <div style={styles.smallSelector}>
            <SettingsMultiselect
              key={'fontFamily'}
              title=''
              placeholder='Выберите шрифт'
              disabled={disabled}
              multiple={false}
              clearable={false}
              keepOpenOnSelection={false}
              optionValueKey='value'
              optionLabelKey='label'
              dataSource={fontTypes}
              selected={[_.find(fontTypes, ['value', (font || {}).family || null])]}
              onChange={(option) => changeChart('setFontFamily', { value: option ? option.value : null })}
            />
          </div>
        </SettingsItem>

        <SettingsItem disabled={disabled} type='inline' title={`Размер шрифта (${(font || {}).size || 0.8}em)`}>
          <SettingsTextField
            numeric
            disabled={disabled}
            step={0.1}
            min={0.7}
            max={5}
            defaultValue={0.8}
            value={parseFloat((font || {}).size) || 0.8}
            onChange={(e, value) => changeChart('setFontSize', { value })}
            style={styles.textfieldSm}
          />
        </SettingsItem>

        <SettingsItem type='inline' title='Многоцветность'>
          <SettingsToggle
            label={config.colorsEnabled ? 'Вкл.' : 'Выкл'}
            defaultToggled={config.colorsEnabled}
            onClick={(e) => e.stopPropagation()}
            onToggle={() => changeChart('toggleColorsEnabled')}
          />
        </SettingsItem>
      </SettingsSection>
    );
  }
}
