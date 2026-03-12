import { createContext, useContext } from 'react';

export const PageIdContext = createContext<string | null>(null);

export const usePageId = () => useContext(PageIdContext);
