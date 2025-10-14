import _ from 'lodash';
import CommonSpecGenerator from 'duplicates/adaptors/CommonChartAdaptor/CommonSpecGenerator';
import { getTitle } from 'duplicates/helpers';
import defaultSpec from './defaultSpec.json';

export default class SunburstSpecGenerator extends CommonSpecGenerator {
  constructor() {
    super();
    this.getSpec = this.getSpec.bind(this);
  }

  getSpec(config, data) {
    let spec = _.cloneDeep(defaultSpec);

    spec = Object.assign(
      spec,
      _.pick(config, [
        'layerExpand',
        'darkLabels',
        'splittedMode',
        'ellipsisLength',
        'visibleLayersNumber',
        'layerButtons',
        'filterMode',
        'precision',
        'font',
        'minPercent',
        'filterCategories',
        'colorsEnabled',
      ]),
    );

    const categoryAxe = _.find(config.axes, ['type', 'categories']);

    spec.levelNames = _.map(categoryAxe.fields, (field) => getTitle(field) || field.alias || field.name);
    spec.levelIds = _.map(categoryAxe.fields, (field) => field.initialId || field.id);

    return spec;
  }
}
