// hooks/use-day-change.ts
// Fires `onChange` when the local calendar day rolls over while the app is
// open. Detection happens both on a 60s polling interval and whenever the app
// returns to the 'active' AppState. The `onChange` identity is stored in a ref
// so changing callbacks don't tear down and re-create the interval/listener.

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { getTodayDateString } from '@/utils/date';

export function useDayChange(onChange: () => void): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const lastSeenRef = useRef<string>(getTodayDateString());

  useEffect(() => {
    const checkAndFire = (): void => {
      const today = getTodayDateString();
      if (today !== lastSeenRef.current) {
        lastSeenRef.current = today;
        onChangeRef.current();
      }
    };

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        checkAndFire();
      }
    }, 60000);

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        checkAndFire();
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
