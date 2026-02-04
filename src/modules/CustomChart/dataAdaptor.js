import CommonDataAdaptor from 'duplicates/adaptors/CommonChartAdaptor/CommonDataAdaptor';

export default class ExampleDataAdaptor extends CommonDataAdaptor {
  constructor(data, config, spec, cacheId) {
    super(data, config, spec, cacheId);
  }

  /**
   * перегруппируем данные под конкретный тип диагараммы
   * aggregated -> plotData
   */
  remapData(config) {
    this.plotData = structuredClone(this.aggregated);
  }
}

/*
const data = this.aggregated?.[0];
const total = data?.length || 0;
if (!total) return [];

const letterCount = (item) => {
  return (item?.values + '').length;
};

const countsByLen = new Map();
for (const item of data) {
  const len = letterCount(item);
  countsByLen.set(len, (countsByLen.get(len) || 0) + 1);
}

this.plotData = Array.from(countsByLen.entries())
  .sort((a, b) => a[0] - b[0])
  .map(([len, count]) => ({
    len,
    count,
    percent: (count / total) * 100,
  }));
*/
