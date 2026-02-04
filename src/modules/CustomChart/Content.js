import React from 'react';

function Content({ plotData, config }) {

  return (
    <div></div>
  );
}

export default Content;

/*
    <div style={{
      background: config.backgroundColor,
      height: '100%',
      overflow: 'auto'
    }}>
      <pre>{JSON.stringify(plotData, 0, 2)}</pre>
    </div>
*/

/*
    <div
      style={{
        background: config.backgroundColor,
        height: '100%',
        overflow: 'auto',
        padding: 10,
      }}
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {plotData.map((r) => (
          <div
            key={r.len}
            style={{
              display: 'grid',
              gridTemplateColumns: '20px 1fr 72px',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <div style={{ whiteSpace: 'nowrap' }}>{r.len}</div>

            <div
              style={{
                height: 12,
                background: '#ffffff',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.round(r.percent * 10) / 10}%`,
                  background: '#4c84ff',
                  borderRadius: 12,
                }}
              />
            </div>

            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {`${(Math.round(r.percent * 10) / 10).toFixed(1)}%`}
            </div>
          </div>
        ))}
      </div>
    </div>
 */
