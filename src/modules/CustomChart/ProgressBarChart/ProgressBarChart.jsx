import React from 'react';
import PropTypes from 'prop-types';
import { pluginImports } from '../PropTypes';
import { useStyles } from './hooks/useStyles';
import _ from 'lodash';
import { getDescription, getLocal } from '../helpers';
import './ProgressBarChart.scss';
import Header from './Header/Header';
import LinearProgress from './LinearProgress/LinearProgress';
import { useLoadData } from './hooks/useLoadData';
import { useLogic } from './hooks/useLogic';

const ProgressBarChart = React.forwardRef(
  (
    {
      config,
      theme,
      componentId,
      pluginImports,
      data,
      cacheId,
      loadDatas,
      reloadDatas,
      editorActive,
      inEditor,
      ...props
    },
    ref,
  ) => {
    const { LoadProgress } = pluginImports.components;
    const { palette } = theme;
    const { dataAdaptor, loadingData } = useLoadData({
      config,
      cacheId,
      loadDatas,
      reloadDatas,
      data,
      componentId,
      editorActive,
      inEditor,
    });
    const { hideSpinner } = config;
    const styles = useStyles(config, theme);
    const title = getLocal(config, 'title');
    const showHeader = config?.showtitle || false;
    const list = useLogic(dataAdaptor, config)
    return (
      <div
        className='hsChartContainer ProgressBarChart'
        style={styles.container}
        key={'container' + componentId}
        id={'container_' + componentId}
        ref={ref}
      >
        {showHeader ? <Header title={title} colorHeader={palette?.secondaryTextColor || null} /> : null}
        <div className='componentBody ProgressBarChartBody'>
          <div className='componentContainer ProgressBarChartComponent' style={styles.component}>
            <div className='ProgressBarChartList'>
              {list.length === 0 ? <b>Нет данных</b>: null}
              {list.map((item) => (
                <LinearProgress key={item.id} value={item.value} containerColor={'white'} linearColor={'red'}>
                  {item.category}
                </LinearProgress>
              ))}
            </div>
          </div>
          <div className='backSide' dangerouslySetInnerHTML={{ __html: _.unescape(getDescription(config) || '') }} />
          {loadingData && !hideSpinner ? (
            <div className='ProgressBarChartLoader' style={styles.container}>
              <LoadProgress />
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

ProgressBarChart.propTypes = {
  config: PropTypes.object.isRequired,
  globalFilters: PropTypes.object.isRequired,
  changeEditorComponent: PropTypes.func,
  id: PropTypes.string,
  cacheId: PropTypes.string,
  componentId: PropTypes.number.isRequired,
  title: PropTypes.string,
  type: PropTypes.string.isRequired,
  configDraft: PropTypes.object,
  datas: PropTypes.object,
  data: PropTypes.object,
  loadDatas: PropTypes.func.isRequired,
  reloadDatas: PropTypes.func.isRequired,
  editable: PropTypes.bool,
  inEditor: PropTypes.bool,
  mainMenuActive: PropTypes.bool,
  editorActive: PropTypes.bool.isRequired,
  changeComponentVisuals: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired,
  pluginImports: pluginImports,
};

export default ProgressBarChart;
