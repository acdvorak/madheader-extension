import 'monaco-editor/min/vs/editor/editor.main.css';

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';

interface MonacoEnvironment {
  getWorker: (_workerId: string, label: string) => Worker;
}

let isConfigured = false;

export function configureMonacoLoader(): void {
  if (isConfigured) {
    return;
  }

  (
    self as typeof self & {
      MonacoEnvironment?: MonacoEnvironment;
    }
  ).MonacoEnvironment = {
    getWorker: (_workerId: string, label: string) => {
      if (label === 'json') {
        return new jsonWorker();
      }

      return new editorWorker();
    },
  };

  loader.config({ monaco });
  isConfigured = true;
}
