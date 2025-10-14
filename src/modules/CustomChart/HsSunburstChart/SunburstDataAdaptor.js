import _ from 'lodash';
import CommonDataAdaptor from 'duplicates/adaptors/CommonChartAdaptor/CommonDataAdaptor';

export default class SunburstDataAdaptor extends CommonDataAdaptor {
  constructor(data, config, spec, cacheId) {
    super(data, config, spec, cacheId);
  }

  /**
   * перегруппируем данные под конкретный тип диагараммы
   * aggregated -> plotData
   */
  remapData(config) {
    const self = this;
    this.plotData = [];

    // если данные не пусты
    if (!_.isEmpty(this.aggregated)) {
      const getKey = (lastCategories, fieldIndex, rowI) => {
        return _.map(lastCategories.slice(0, fieldIndex + 1), (value) => value || 'null_' + rowI).join('/');
      };

      const getTree = (tree, fieldIndex) => {
        return /*'NAN' + */ _.map(tree.slice(0, fieldIndex + 1), (value) => _.padStart(value, 4, '0')).join('.');
      };

      const categoriesAxe = _.find(config.axes, ['type', 'categories']);
      const items = [];
      const tree = [];
      const values = [];
      const lastCategories = [];
      const categoryFields = _.get(categoriesAxe, 'fields', []);
      _.forEach(categoryFields, () => {
        items.push([]);
        tree.push(0);
        values.push(0);
        lastCategories.push(null);
      });
      const fieldCount = categoryFields.length > 0 ? categoryFields.length - 1 : 0;
      _.forEach(this.aggregated[0], (row, rowI) => {
        const shifts = _.map(new Array(fieldCount), () => {
          return false;
        });
        _.forEach(categoryFields, (field, fieldIndex) => {
          const sortBySuffix = field.sortByFieldName ? '_sortBy' : '';
          const category = row[`[categories][${fieldIndex}]${sortBySuffix}`];
          const lastCategory = lastCategories[fieldIndex];
          shifts[fieldIndex] = lastCategory !== category && !_.isNull(lastCategory);
          if (fieldIndex - 1 >= 0 && shifts[fieldIndex - 1]) {
            shifts[fieldIndex] = true;
          }
        });

        _.forEach(categoryFields, (field, fieldIndex) => {
          const lastCategory = lastCategories[fieldIndex];
          if (shifts[fieldIndex]) {
            items[fieldIndex].push({
              categories: lastCategory,
              key: getKey(lastCategories, fieldIndex, rowI - 1),
              tree: getTree(tree, fieldIndex),
              values: values[fieldIndex],
            });
          }
        });

        _.forEach(categoryFields, (field, fieldIndex) => {
          const sortBySuffix = field.sortByFieldName ? '_sortBy' : '';
          const category = row[`[categories][${fieldIndex}]${sortBySuffix}`];

          if (shifts[fieldIndex]) {
            values[fieldIndex] = 0;
            tree[fieldIndex] += 1;
            _.fill(tree, 0, fieldIndex + 1);
          }

          lastCategories[fieldIndex] = category;
          values[fieldIndex] += row.values;
        });
      });

      _.forEach(categoryFields, (field, fieldIndex) => {
        const lastCategory = lastCategories[fieldIndex];
        if (!_.isNull(lastCategory)) {
          items[fieldIndex].push({
            categories: lastCategory,
            key: getKey(lastCategories, fieldIndex, fieldCount),
            tree: getTree(tree, fieldIndex),
            values: values[fieldIndex],
          });
        }
      });

      self.plotData = _.map(categoryFields, (field, fieldIndex) => {
        return {
          id: field.id,
          items: items[fieldIndex],
        };
      });
    }
    //console.log(this.plotData)
    return this;
  }
}
