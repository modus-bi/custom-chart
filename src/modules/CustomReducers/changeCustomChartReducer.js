import update from 'react-addons-update';
import _ from 'lodash';
import { getLocalProperty } from '../../duplicates/helpers';

export default function(state, action, options) {
  const { autoApplySettings } = options;

  return autoApplySettings(
    update(state, {
      component: {
        configDraft: {
          $apply: (config) => {
            const configNew = _.cloneDeep(config);

            if (action.command === 'toggleColorsEnabled') {
              configNew.colorsEnabled = !configNew.colorsEnabled;
            }

            if (action.command === 'toggleFilterMode') {
              configNew.filterMode = !configNew.filterMode;
            }

            if (action.command === 'setMinPercent') {
              configNew.minPercent = action.settings.value;
            }

            if (action.command === 'setTitle') {
              configNew[getLocalProperty('title', action.settings.lng)] = _.cloneDeep(action.settings.value);
            }

            if (action.command === 'setSubtitle') {
              configNew[getLocalProperty('subtitle', action.settings.lng)] = _.cloneDeep(action.settings.value);
            }

            if (action.command === 'setMargin') {
              configNew.margin = _.cloneDeep(action.settings.value);
            }

            if (action.command === 'toggleLayerExpand') {
              configNew.layerExpand = !configNew.layerExpand;
            }

            if (action.command === 'toggleDarkLabels') {
              configNew.darkLabels = !configNew.darkLabels;
            }

            if (action.command === 'toggleSplittedMode') {
              configNew.splittedMode = !configNew.splittedMode;
            }

            if (action.command === 'setEllipsisLength') {
              configNew.ellipsisLength = action.settings.value;
            }

            if (action.command === 'setVisibleLayersNumber') {
              configNew.visibleLayersNumber = action.settings.value;
            }

            if (action.command === 'toggleLayerButtons') {
              configNew.layerButtons = !configNew.layerButtons;
            }

            if (action.command === 'setFontFamily') {
              configNew.font = configNew.font || {};
              configNew.font.family = action.settings.value;
            }

            if (action.command === 'setFontSize') {
              configNew.font = configNew.font || {};
              configNew.font.size = action.settings.value;
            }

            if (action.command === 'setPrecision') {
              configNew.precision = action.settings.value;
            }

            return configNew;
          },
        },
      },
    }),
  );
}
