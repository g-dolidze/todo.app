import 'i18next';
import type ka from './ka.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof ka };
  }
}
