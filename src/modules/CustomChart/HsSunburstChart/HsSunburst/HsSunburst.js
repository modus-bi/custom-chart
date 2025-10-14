import { select as d3_select } from 'd3-selection';
import donutChart from './DonutChart';

export default class HsSunburst {
  constructor(globals) {
    this.donut = donutChart(globals)
      .transTime(750) // length of transitions in ms
      .cornerRadius(1) // sets how rounded the corners are on each slice
      .gutter(4) // effectively dictates the gap between slices
      .variable('values')
      .category('categories');

    this.el = null;
  }

  init(el, data, spec, onClick) {
    this.el = el;

    this.donut
      .spec(spec)
      .width((this.el || {}).offsetWidth || 800)
      .height((this.el || {}).offsetHeight || 800)
      .onClick(onClick)
      .data(data);

    d3_select(el).call(this.donut);
  }

  update(data, spec) {
    this.donut
      .spec(spec)
      .width((this.el || {}).offsetWidth || 800)
      .height((this.el || {}).offsetHeight || 800)
      .data(data);
  }

  resize() {
    this.donut
      .width((this.el || {}).offsetWidth || 800)
      .height((this.el || {}).offsetHeight || 800)
      .invalidate();
  }
}
