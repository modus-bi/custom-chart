import { getPercentage } from '../../helpers';

export function useLogic(dataAdaptor, config) {
  let list = []
  const valuesAxe = _.find(config.axes, ['type', 'values']);

  if (valuesAxe?.fields.length > 1) {
    list = dataAdaptor?.plotData.map(data => {
      return {
        id: data['ID0'],
        category: data.categories || 'Без категории',
        value: getPercentage(data['values0'], data['values1'])
      }
    }) || []
  }

  return list
}