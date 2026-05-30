/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import MainUI from './components/MainUI';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <MainUI />
    </ErrorBoundary>
  );
}
