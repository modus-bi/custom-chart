export default class ConfigEditor {
  constructor() {
    this.addField = this.addField.bind(this);
    this.updateField = this.updateField.bind(this);
  }

  addField(config, axisName, fieldIndex, fieldItem, type) {
    return config;
  }

  addAllFields(config, datasetId, datasets) {
    return config;
  }

  updateField(config, axisName, fieldIndex, fieldItem) {
    return config;
  }
}
