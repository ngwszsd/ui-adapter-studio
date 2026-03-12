import 'i18next';
import type { DEFAULT_NS, resources } from '../i18n/index';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof DEFAULT_NS;
    resources: (typeof resources)['zh'];
  }
}
