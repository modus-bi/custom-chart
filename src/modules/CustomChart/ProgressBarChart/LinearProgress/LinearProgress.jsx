import React from 'react';
import PropTypes from 'prop-types';
import './LinearProgress.scss';

const LinearProgress = ({ value, isAnimated = true, linearColor, containerColor, heightBar = 16, children }) => {
  const styleBar = {
    width: `${value}%`,
    backgroundColor: linearColor,
    height: `${heightBar}px`,
  };
  const styleContainer = { backgroundColor: containerColor };
  const classNames = ['linearProgress', isAnimated ? 'isAnimated': null ].filter(Boolean).join(' ');
  return (
    <div className={classNames}>
      <div className='linearProgressTitle'>{children}</div>
      <div className='linearProgressContainer' style={styleContainer}>
        <div className='linearProgressBar' style={styleBar} />
      </div>
    </div>
  );
};

LinearProgress.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.number.isRequired,
  linearColor: PropTypes.string,
  heightBar: PropTypes.number,
  isAnimated: PropTypes.bool,
};

export default LinearProgress;
