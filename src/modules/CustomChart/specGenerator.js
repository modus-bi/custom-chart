import ComponentTypeManager from '../../managers/ComponentTypeManager';

export default class SpecGenerator {
  constructor(type) {
    this.type = type;
    this.data = [];
    this.series = [];
  }

  static getDefaultSpec(type) {
    const defaultComponent = new ComponentTypeManager(type).getDefaultComponent();
    return defaultComponent.spec || {};
  }

  getSpec = (config, data) => {
    return {};
  };

  getVisualStructure = (data, config, hasSeries) => {
    return config.visuals || [];
  };
}
