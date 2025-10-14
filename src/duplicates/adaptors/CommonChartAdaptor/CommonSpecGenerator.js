import ComponentTypeManager from 'managers/ComponentTypeManager';

export default class CommonSpecGenerator {
  static getDefaultSpec(type) {
    const defaultComponent = new ComponentTypeManager(type).getDefaultComponent();
    return defaultComponent.spec || {};
  }

  constructor(type) {
    this.type = type; // Component class type
    this.spec = {};
  }

  getSpec(config, datasets) {
    return this.spec;
  }

  getVisualStructure(data, config, hasSeries) {
    return config.visuals || [];
  }
}
