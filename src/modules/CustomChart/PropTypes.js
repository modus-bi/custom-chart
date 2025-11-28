import PropTypes from 'prop-types';

export const componentsImports = PropTypes.shape({
  HsButton: PropTypes.node,
  HsDialog: PropTypes.node,
  HsFormControl: PropTypes.node,
  HsFormControlLabel: PropTypes.node,
  HsInput: PropTypes.node,
  HsInputLabel: PropTypes.node,
  HsMenuItem: PropTypes.node,
  HsSelect: PropTypes.node,
  useFormControl: PropTypes.func,
  LocalizationProvider: PropTypes.node,
  HsDateField: PropTypes.node,
  HsDatePicker: PropTypes.node,
  HsFormHelperText: PropTypes.node,
  HsAlert: PropTypes.node,
  AdapterMoment: PropTypes.any,
});

export const pluginImports = PropTypes.shape({
  components: componentsImports,
  helpers: PropTypes.shape({
    getCacheId: PropTypes.func,
  }),
  sections: PropTypes.shape({}),
});
