import { useEffect, useState } from 'react';

export function useStyles(config, theme) {
  const { gridLayout } = theme;
  const backgroundColor = config.bgColor || null
  const margin = config.margin || {}

  const [styles, setStyles] = useState(() => ({
    backgroundColor: backgroundColor ? backgroundColor : gridLayout.paneColor,
  }));

  const [marginStyle, setMarginStyles] = useState(() => ({
    right: margin.r || 0,
    left: margin.l || 0,
    top: margin.t || 0,
    bottom: margin.b || 0,
  }));

  useEffect(() => {
    setStyles({
      backgroundColor: backgroundColor ? backgroundColor : gridLayout.paneColor,
    });
  }, [backgroundColor]);

  useEffect(() => {
    setMarginStyles({
      ...marginStyle,
      right: margin.r || 0,
      left: margin.l || 0,
      top: margin.t || 0,
      bottom: margin.b || 0,
    });
  }, [margin.r, margin.l, margin.l, margin.t, margin.b]);

  return {
    container: {
      ...styles,
    },
    component: {
      ...marginStyle,
    },
  };
}