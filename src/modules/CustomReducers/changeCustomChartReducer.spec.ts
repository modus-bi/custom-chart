import changeCustomChartReducer from './changeCustomChartReducer';

const makeState = () => ({
  component: { type: 'CustomChart0', config: {}, configDraft: {} },
  other: 'не трогать',
});

describe('changeCustomChartReducer', () => {
  it('заглушка: действие не меняет состояние', () => {
    const state = makeState();
    const next = changeCustomChartReducer(
      state,
      { command: 'ЛЮБАЯ_КОМАНДА', settings: { value: 1 } },
      { autoApplySettings: (s) => s },
    );

    expect(next).toBe(state);
  });

  it('не зовёт autoApplySettings — состояние не менялось', () => {
    const autoApplySettings = jest.fn((s) => s);
    changeCustomChartReducer(makeState(), { command: 'ЛЮБАЯ_КОМАНДА', settings: {} }, { autoApplySettings });

    expect(autoApplySettings).not.toHaveBeenCalled();
  });
});
