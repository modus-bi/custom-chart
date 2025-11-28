export default function(state, action, options) {
  const { autoApplySettings } = options;
  const configDraft = structuredClone(state.component.configDraft);

  if (action.command === 'changeStyleBgColor') {
    configDraft.bgColor = action.settings.value;
  }

  return autoApplySettings({
    ...state,
    component: {
      ...state.component,
      configDraft: {
        ...state.component.configDraft,
        ...configDraft,
      },
    },
  });
}
