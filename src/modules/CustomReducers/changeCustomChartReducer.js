import update from 'react-addons-update';
import _ from 'lodash';

export default function(state, action, options) {
  const { autoApplySettings } = options;

  return autoApplySettings(
    update(state, {
      component: {
        configDraft: {
          $apply: (config) => {
            const configNew = _.cloneDeep(config);

            if (action.command === 'setColorMin') {
              configNew.colorMin = action.settings.value;
            }

            if (action.command === 'setColorMax') {
              configNew.colorMax = action.settings.value;
            }

            if (action.command === 'setInversions') {
              configNew.inversions = _.cloneDeep(action.settings.value);
            }

            if (action.command === 'setTableSize') {
              configNew.tableSize = _.cloneDeep(action.settings.value);
            }

            if (action.command === 'toggleExportFromTable') {
              configNew.exportFromTable = !configNew.exportFromTable;
            }

            return configNew;
          },
        },
      },
    }),
  );
}
