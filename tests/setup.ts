import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Ensure structuredClone is available in jsdom if needed
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));
}
