import React, { createContext, useContext, useRef } from 'react';

const DesignerPortalContext = createContext<React.RefObject<HTMLDivElement | null> | null>(null);

export const useDesignerPortalRef = () => useContext(DesignerPortalContext);

export const DesignerPortalProvider = DesignerPortalContext.Provider;

/**
 * Hook to create and expose the portal container ref.
 * Call once in the root Editor component.
 */
export const useDesignerPortalContainer = () => {
  const portalRef = useRef<HTMLDivElement | null>(null);
  return { portalRef, DesignerPortalProvider };
};
