import CustomChart from '../modules/CustomChart';
import DataAdaptor from '../modules/CustomChart/dataAdaptor';
import SpecGenerator from '../modules/CustomChart/specGenerator';
import ConfigEditor from '../modules/CustomChart/configEditor';

export default class ComponentTypeManager {
  constructor(type) {
    this.type = type;
  }

  getDefaultComponent() {
    return {
      type: this.type,
      config: CustomChart.getDefaultConfig(),
      spec: {},
    };
  }

  getConfigEditor() {
    return new ConfigEditor();
  }

  getSpecGenerator() {
    return new SpecGenerator(this.type);
  }

  getDataAdaptor(data, config, spec, cacheId) {
    return new DataAdaptor(data, config, spec, cacheId);
  }
}
