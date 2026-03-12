import React from 'react';
import {
  Battery,
  Bluetooth,
  MapPin,
  Signal,
  Smartphone,
  User,
  Volume2,
  Wifi,
} from 'lucide-react';

/* ---- 模块级单例时钟：N 个页面共享 1 个定时器 ---- */

const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

let currentTime = formatTime();
let listeners = new Set<() => void>();
let timerId: ReturnType<typeof setInterval> | null = null;

const startClock = () => {
  if (timerId) return;
  timerId = setInterval(() => {
    const next = formatTime();
    if (next !== currentTime) {
      currentTime = next;
      listeners.forEach((l) => l());
    }
  }, 10_000);
};

const stopClock = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  if (listeners.size === 1) startClock();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) stopClock();
  };
};

const getSnapshot = () => currentTime;

const useCurrentTime = () => React.useSyncExternalStore(subscribe, getSnapshot);

interface ARPageHeaderProps {
  config?: import('../types').ARPageConfig;
}

export const ARPageHeader = ({ config }: ARPageHeaderProps) => {
  const time = useCurrentTime();

  const topBarVisible = config?.topBar.visible ?? true;
  if (!topBarVisible) return null;

  const menu = config?.menu ?? {
    visible: true,
    margin: 0,
    showUser: true,
    customMenus: [],
    showSystem: true,
    showCommand: true,
  };

  const status = config?.systemStatus ?? {
    visible: true,
    margin: 0,
    gap: 2,
    showCellular: true,
    showWifi: true,
    showMobileData: true,
    showBluetooth: true,
    showGPS: true,
    showVolume: true,
    showTime: true,
    showBatteryPercent: false,
  };

  return (
    <div
      className="flex shrink-0 items-center justify-between"
      style={{
        padding: '8px 12px',
        borderBottom: '1.5px dashed rgba(148,163,184,0.3)',
      }}
    >
      {/* 左侧：菜单区 */}
      {menu.visible ? (
        <div
          className="flex items-center gap-2.5"
          style={{ marginLeft: menu.margin }}
        >
          {menu.showUser && (
            <div className="flex h-3.5 w-3.5 items-center justify-center overflow-hidden rounded-full bg-slate-600">
              <User size={9} className="text-slate-300" />
            </div>
          )}
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
            {menu.showUser && <span>用户</span>}
            {(menu.customMenus ?? []).map((group) => (
              <span key={group.id}>{group.name}</span>
            ))}
            {menu.showSystem && <span>系统</span>}
            {menu.showCommand && <span>指令</span>}
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* 右侧：系统状态区 */}
      {status.visible ? (
        <div
          className="flex items-center text-slate-400"
          style={{ gap: status.gap * 4, marginRight: status.margin }}
        >
          {(status.showMobileData ?? true) && <Smartphone size={12} />}
          {(status.showBluetooth ?? true) && <Bluetooth size={12} />}
          {(status.showGPS ?? true) && <MapPin size={12} />}
          {status.showCellular && <Signal size={12} />}
          {status.showWifi && <Wifi size={12} />}
          {(status.showVolume ?? true) && <Volume2 size={12} />}
          <Battery size={12} />
          {(status.showBatteryPercent ?? false) && (
            <span className="text-[9px] font-medium">100%</span>
          )}
          {(status.showTime ?? true) && (
            <span className="ml-0.5 text-[11px] font-medium">{time}</span>
          )}
        </div>
      ) : (
        <div />
      )}
    </div>
  );
};
