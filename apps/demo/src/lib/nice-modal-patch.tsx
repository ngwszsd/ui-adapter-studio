import NiceModal from '@ebay/nice-modal-react';
import { useEffect, useRef } from 'react';
import { router } from '@/routes';

const originalCreate = NiceModal.create;

// Monkey patch NiceModal.create to automatically close modals on route change
NiceModal.create = ((Comp: React.FC<any>) => {
  const WrappedComp = (props: any) => {
    const modal = NiceModal.useModal();
    // Record path on mount
    const initialPathname = useRef(router?.state?.location?.pathname || '');

    useEffect(() => {
      // Subscribe to router changes
      const unsubscribe = router.subscribe((state) => {
        if (state?.location?.pathname !== initialPathname?.current) {
          if (modal.visible) {
            modal.hide();
            modal.resolve(false); // Resolve promise with false
            modal.remove();
          }
        }
      });
      return unsubscribe;
    }, [modal]);

    return <Comp {...props} />;
  };
  return originalCreate(WrappedComp);
}) as typeof NiceModal.create;
