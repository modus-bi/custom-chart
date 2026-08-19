import type { ChartConfig } from '../modules/CustomChart/plugin.types';

import ConfigEditor from '../modules/CustomChart/configEditor';
import DataAdaptor from '../modules/CustomChart/dataAdaptor';
import { getDefaultConfig } from '../modules/CustomChart/getDefaultConfig';
import SpecGenerator from '../modules/CustomChart/specGenerator';

interface DefaultComponent {
  type: string;
  config: ChartConfig;
  spec: Record<string, unknown>;
}

export default class ComponentTypeManager {
  private readonly type: string;

  constructor(type: string) {
    this.type = type;
  }

  getDefaultComponent(): DefaultComponent {
    return { type: this.type, config: getDefaultConfig(), spec: {} };
  }

  getConfigEditor(): ConfigEditor {
    return new ConfigEditor();
  }

  getSpecGenerator(): SpecGenerator {
    return new SpecGenerator(this.type);
  }

  getDataAdaptor(data: unknown, config: unknown, spec: unknown, cacheId: string): DataAdaptor {
    return new DataAdaptor(data, config, spec, cacheId);
  }
}
