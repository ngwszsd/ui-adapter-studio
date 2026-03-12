import { nanoid } from 'nanoid';

const FALLBACK_PREFIX = 'page';

export const createId = (prefix = FALLBACK_PREFIX): string =>
  `${prefix}_${nanoid()}`;
