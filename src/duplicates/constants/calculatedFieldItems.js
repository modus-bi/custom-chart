export const mathItems = [
  {
    type: 'operator',
    title: ' + ',
    value: ' + ',
    arity: Infinity
  },
  {
    type: 'operator',
    title: ' - ',
    value: ' - ',
    arity: 2
  },
  {
    type: 'operator',
    title: ' / ',
    value: ' / ',
    arity: 2
  },
  {
    type: 'operator',
    title: ' * ',
    value: ' * ',
    arity: 2
  }
];

export const compareItems = [
  {
    type: 'operator',
    title: ' > ',
    value: ' > ',
    arity: 2
  },
  {
    type: 'operator',
    title: ' < ',
    value: ' < ',
    arity: 2
  },
  {
    type: 'operator',
    title: ' = ',
    value: ' = ',
    arity: 2
  },
  {
    type: 'operator',
    title: ' >= ',
    value: ' >= ',
    arity: 2
  },
  {
    type: 'operator',
    title: ' <= ',
    value: ' <= ',
    arity: 2
  },
];

export const aggregationItems = [
  {
    type: 'function',
    title: 'SUM',
    value: 'SUM( □ )',
    arity: 1
  },
  {
    type: 'function',
    title: 'AVG',
    value: 'AVG( □ )',
    arity: 1
  },
  {
    type: 'function',
    title: 'MIN',
    value: 'MIN( □ )',
    arity: 1
  },
  {
    type: 'function',
    title: 'MAX',
    value: 'MAX( □ )',
    arity: 1
  },
  {
    type: 'function',
    title: 'COUNT',
    value: 'COUNT( □ )',
    arity: 1
  },
  {
    type: 'function',
    title: 'DISTINCT',
    value: 'DISTINCT( □ )',
    arity: 1
  },
];

export const stringItems = [
  {
    type: 'function',
    title: 'STR',
    value: 'STR( □ )',
    arity: 1
  },
];


export const customItems = [
  {
    type: 'function',
    title: 'AVGD',
    description: 'SUM( □ ) / COUNT(DISTINCT( □ ))',
    value: 'SUM( □ ) / COUNT(DISTINCT( □ ))',
    arity: 2
  }
];

export default {
  mathItems,
  aggregationItems,
  customItems,
  stringItems,
};
