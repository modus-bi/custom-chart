/** @jest-environment jsdom */
import React, { useRef } from 'react';
import { render, act } from '@testing-library/react';

import { useChartSize } from './useChartSize';

let observed: Element[] = [];
let disconnected = 0;
let trigger: ((entries: unknown[]) => void) | null = null;

class ResizeObserverStub {
  constructor(callback: (entries: unknown[]) => void) {
    trigger = callback;
  }

  observe(element: Element) {
    observed.push(element);
  }

  disconnect() {
    disconnected += 1;
  }
}

beforeEach(() => {
  observed = [];
  disconnected = 0;
  trigger = null;
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
});

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useChartSize(ref);
  return (
    <div ref={ref}>
      {width}x{height}
    </div>
  );
}

function EmptyRefProbe() {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useChartSize(ref);
  return (
    <div>
      {width}x{height}
    </div>
  );
}

describe('useChartSize', () => {
  it('подписывается на контейнер и отдаёт нулевой размер до первого замера', () => {
    const { container } = render(<Probe />);

    expect(observed).toHaveLength(1);
    expect(container.textContent).toBe('0x0');
  });

  it('обновляет размер по событию наблюдателя', () => {
    const { container } = render(<Probe />);

    act(() => {
      trigger?.([{ contentRect: { width: 640, height: 480 } }]);
    });

    expect(container.textContent).toBe('640x480');
  });

  it('отписывается на размонтировании', () => {
    const { unmount } = render(<Probe />);

    unmount();

    expect(disconnected).toBe(1);
  });

  it('не падает и не подписывается, когда ref ни к чему не привязан', () => {
    const { container } = render(<EmptyRefProbe />);

    expect(observed).toHaveLength(0);
    expect(container.textContent).toBe('0x0');
  });

  it('округляет дробный размер от наблюдателя', () => {
    const { container } = render(<Probe />);

    act(() => {
      trigger?.([{ contentRect: { width: 640.4, height: 480.6 } }]);
    });

    expect(container.textContent).toBe('640x481');
  });
});
