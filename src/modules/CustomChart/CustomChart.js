import { Component } from 'react';
import defaultConfig from './defaultConfig.json';

export default class CustomChart extends Component {
  static getDefaultConfig() {
    return defaultConfig;
  }

  resizeChart(long) {}

  render() {
    return null;
  }
}
