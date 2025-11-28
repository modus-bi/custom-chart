import { useEffect, useRef, useState } from 'react';
import { getDatasetId } from '../../helpers';
import DataAdaptor from '../../dataAdaptor';

export function useLoadData({ config, loadDatas, cacheId, data, editorActive, componentId, reloadDatas, inEditor }) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataAdaptor, setDataAdaptor] = useState(null);
  const intervalTimer = useRef(null);
  const datasetId = getDatasetId(config);
  const queryObjects = DataAdaptor.getQueryObjects(config);
  const stringQueryObjects = JSON.stringify(queryObjects);

  useEffect(() => {
    if (!datasetId) return;
    runLoadData();
    return () => {
      clearTimer();
    };
  }, [datasetId, cacheId, stringQueryObjects, data, editorActive, inEditor]);

  const reloadByInterval = () => {
    // Интервальное обновление данных
    if (config.refresh && config.refreshTime) {
      intervalTimer.current = setInterval(
        () =>
          reloadDatas(datasetId, null, config.filters, queryObjects, {
            editor: editorActive,
            componentId,
          }),
        config.refreshTime * 1000,
      );
    }
  };

  const clearTimer = () => {
    clearInterval(intervalTimer.current);
    intervalTimer.current = null;
  };

  const runLoadData = () => {
    if (!datasetId) return;
    // данных нет в кэше - заказываем скачивание
    if (!data && cacheId) {
      setLoading(true);
      loadDatas(datasetId, null, config.filters, queryObjects, { editor: editorActive, componentId })
        .then((res) => {
          setLoaded(true);
          const adapter = new DataAdaptor(res.data, config, null, cacheId);
          setDataAdaptor(adapter);
        })
        .catch(() => {
          setLoaded(false);
        })
        .finally(() => {
          setLoading(false);
        });
      reloadByInterval();
    } else if (intervalTimer.current) {
      clearTimer();
    } else if (data) {
      // данные есть в кэше
      // данные закачаны в кэш полностью
      if (!data.fetching) {
        // создаем адаптер данных, если необходимо
        if (dataAdaptor) {
          dataAdaptor.refresh(data.data, config, null, cacheId);
          setDataAdaptor(dataAdaptor);
        } else {
          setDataAdaptor(new DataAdaptor(data.data, config, null, cacheId));
        }
      }
    }
  };

  return {
    dataAdaptor,
    loadedData: loaded,
    loadingData: loading,
  };
}
