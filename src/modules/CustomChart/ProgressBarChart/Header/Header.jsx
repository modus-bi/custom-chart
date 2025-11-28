import React from 'react';
import PropTypes from 'prop-types';

const Header = ({ title, colorHeader }) => {
  if (!title) return null;
  const hasNowrapTitle = !!title;
  const classNames = ['titleText', 'strongly', hasNowrapTitle ? 'nowrap' : null].filter(Boolean).join(' ');
  return (
    <div
      className='componentHeader ProgressBarChartHeader'
      style={{
        color: colorHeader,
      }}
    >
      <span>{title ? <div className={classNames}>{title}</div> : null}</span>
      <span className='path'></span>
    </div>
  );
};

Header.propTypes = {
  colorHeader: PropTypes.string,
  title: PropTypes.string,
};

export default Header;
