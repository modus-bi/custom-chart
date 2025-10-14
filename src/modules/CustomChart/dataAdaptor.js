export default class DataAdaptor {
  constructor(data, config, spec, cacheId) {
    this.cacheId = cacheId;
    this.source = [];
    this.aggregated = [];
    this.plotData = [];
  }

  refresh(data, config, spec, cacheId) {}

  static getQueryObjects(config_, exportMode = null, settings = {}) {
    return [];
  }

  aggregateBypass(data, config, allFields) {}

  remapData(config) {
    return [];
  }
}
