import CustomChart from './modules/CustomChart';
//import DataAdaptor from './modules/CustomChart/dataAdaptor';
import DataAdaptor from './duplicates/adaptors/CommonChartAdaptor/CommonDataAdaptor';
import ConfigEditor from './duplicates/adaptors/CommonChartAdaptor/CommonConfigEditor';
import SpecGenerator from './duplicates/adaptors/CommonChartAdaptor/CommonSpecGenerator';
import CustomAxes from './modules/CustomAxes';
import CustomReducers from './modules/CustomReducers/changeCustomChartReducer';
import CustomSettings from './modules/CustomSettings/Settings';

export { CustomChart, CustomReducers, CustomSettings, CustomAxes, DataAdaptor, SpecGenerator, ConfigEditor };
