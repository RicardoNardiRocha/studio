'use client';

import { useMemo, type DependencyList } from 'react';

/**
 * A wrapper around React's useMemo that adds a __memo flag to the result.
 * This is used by our custom `useCollection` hook to enforce that Firestore
 * queries are properly memoized, preventing infinite render loops.
 *
 * @param factory The function to compute the value.
 * @param deps The dependency array for useMemo.
 * @returns The memoized value with a __memo flag.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
    const memoizedValue = useMemo(() => {
        const value = factory();
        if (value && typeof value === 'object') {
            // Add a non-enumerable property to mark this object as memoized
            Object.defineProperty(value, '__memo', {
                value: true,
                writable: false,
                enumerable: false,
                configurable: false,
            });
        }
        return value;
    }, deps);

    return memoizedValue;
}
