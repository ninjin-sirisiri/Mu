import { useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { listen } from '@tauri-apps/api/event';

type ToastEvent = {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
};

export function ToastView() {
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let mounted = true;

    (async () => {
      const unlistenFn = await listen<ToastEvent>('show_toast', event => {
        if (!mounted) return;
        const { message, type } = event.payload;
        switch (type) {
          case 'success':
            toast.success(message);
            break;
          case 'error':
            toast.error(message);
            break;
          case 'warning':
            toast.warning(message);
            break;
          default:
            toast.info(message);
            break;
        }
      });
      if (mounted) {
        unlisten = unlistenFn;
      } else {
        unlistenFn();
      }
    })();

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <Toaster
        position="bottom-right"
        richColors
      />
    </div>
  );
}
