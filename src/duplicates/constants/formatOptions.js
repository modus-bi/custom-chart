import _ from 'lodash';
import moment from 'moment';

/** Функция принимает строку с датой (в формате ISO 8601)
 *  убирает тайм-зону и форматирует дату обратно в ISO 8601
 **/
export const removeDateTZ = (value) => {
  const hasTzEnding = (/([0-9]+|Z)$/).test(value + '');
  const isNotOnlyDigits = (value + '').replace(/[0-9]/g, '').length > 0;
  if (_.isString(value) && hasTzEnding && isNotOnlyDigits) {
    let ret = value + '';

    // remove timezone
    ret = ret.replace(/([+-]\d+:\d+|Z)$/i, '');

    // if YYYY-MM-DD formatted
    if (moment(ret, 'YYYY-MM-DD', true).isValid()) {
      return ret.trim();
    }

    // if ISO_8601 formatted
    ret = moment(ret, [moment.ISO_8601], true);

    // apply default formatting
    if (ret.isValid()) {
      return ret.format('YYYY-MM-DD HH:mm:ss');
    }

    // if not valid date
    return value + '';
  }

  return value;
};


