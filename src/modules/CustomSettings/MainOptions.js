import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import i18n from 'i18next';
import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';
import { getLocal } from '../../duplicates/helpers';

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
    const config = component ? component.configDraft : {};

    const styles = {
      textfieldSm: { width: '50px' },
      textbox: { width: '100%', height: '36px' },
      mainSelector: { minWidth: '150px' },
      smallSelector: { minWidth: '120px', maxWidth: '120px', maxHeight: '160px' },
      sliderContainer: { zIndex: '-1', minWidth: '80px', maxWidth: '80px' },
      slider: { margin: '0', width: '95%' },
    };

    const {
      autoApplyToggleContent,
      showtitleToggleContent,
      titleTextFieldContent,
      containerMarginSettingsContent,
      precisionSliderContent,
    } = pluginImports.sections;

    const { SettingsSection, SettingsItem, SettingsTextField, SettingsToggle } = pluginImports.components;

    return (
      <div>
        {autoApplyToggleContent}
        <SettingsSection open={open} title='Общие настройки  ***PLUGIN17***'>
          {showtitleToggleContent}
          {titleTextFieldContent}
          {containerMarginSettingsContent}

          <SettingsItem disabled={!config.showtitle}>
            <SettingsTextField
              disabled={!config.showtitle}
              hintText='Введите подзаголовок'
              value={getLocal(config, 'subtitle')}
              onChange={(e, value) => changeChart('setSubtitle', { value, debounce: 0, lng: i18n.language })}
            />
          </SettingsItem>

          <SettingsItem type='inline' title='Тип разворачивания'>
            <SettingsToggle
              label={config.layerExpand ? 'Послойно' : 'Посекторно'}
              toggled={config.layerExpand}
              onClick={(e) => e.stopPropagation()}
              onToggle={() => changeChart('toggleLayerExpand')}
            />
          </SettingsItem>

          <SettingsItem type='inline' title='Тёмные подписи'>
            <SettingsToggle
              label={config.darkLabels ? 'Вкл.' : 'Выкл'}
              toggled={config.darkLabels}
              onClick={(e) => e.stopPropagation()}
              onToggle={() => changeChart('toggleDarkLabels')}
            />
          </SettingsItem>

          <SettingsItem type='inline' title='Двустрочные подписи'>
            <SettingsToggle
              label={config.splittedMode ? 'Вкл.' : 'Выкл'}
              toggled={config.splittedMode}
              onClick={(e) => e.stopPropagation()}
              onToggle={() => changeChart('toggleSplittedMode')}
            />
          </SettingsItem>

          <SettingsItem type='inline' title='Лимит длины подписи'>
            <SettingsTextField
              numeric
              hintText='Число'
              value={config.ellipsisLength || 0}
              onChange={(e, value) => changeChart('setEllipsisLength', { value: +value, debounce: 0 })}
              style={styles.textfieldSm}
            />
          </SettingsItem>

          <SettingsItem type='inline' title='Начальное количество слоев:'>
            <SettingsTextField
              numeric
              hintText='Число'
              value={config.visibleLayersNumber || 0}
              style={styles.textfieldSm}
              onChange={(e, value) => changeChart('setVisibleLayersNumber', { value: +value, debounce: 0 })}
            />
          </SettingsItem>

          <SettingsItem type='inline' title='Кнопки управления количеством слоев'>
            <SettingsToggle
              label={config.layerButtons ? 'Вкл.' : 'Выкл'}
              defaultToggled={config.layerButtons}
              onClick={(e) => e.stopPropagation()}
              onToggle={() => changeChart('toggleLayerButtons')}
            />
          </SettingsItem>

          {precisionSliderContent}

          <SettingsItem type='inline' title='Порог скрывания подписей&nbsp;(%)'>
            <SettingsTextField
              numeric
              min={0}
              step={0.1}
              title='Скрывать подписи для слишком узких секторов'
              style={styles.textfieldSm}
              defaultValue={isUndefined(config.minPercent) ? '1' : config.minPercent}
              onChange={(e, value) => changeChart('setMinPercent', { value: Math.abs(parseFloat(value)) })}
            />
          </SettingsItem>
        </SettingsSection>
      </div>
    );
  }
}
