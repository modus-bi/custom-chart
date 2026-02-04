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

            // if (action.command === 'setBackgroundColor') {
            //   configNew.backgroundColor = action.settings.value;
            // }

            return configNew;
          },
        },
      },
    }),
  );
}
