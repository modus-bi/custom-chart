import { rgb as d3_rgb } from 'd3-color';

export function rgba2rgb(rgba) {
  const alpha = +rgba.opacity;
  return d3_rgb(
    (1 - alpha) * 255 + alpha * +rgba.r,
    (1 - alpha) * 255 + alpha * +rgba.g,
    (1 - alpha) * 255 + alpha * +rgba.b,
  );
}

export const addSeparators = (value) => {
  if (_.isNumber(value)) {
    const [base, mantissa] = value.toString().split('.');
    return base.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (mantissa ? '.' + mantissa : '');
  }
  return value;
};
