const { contextBridge, ipcRenderer } = require('electron');

const isMac = process.platform === 'darwin';

contextBridge.exposeInMainWorld('persuaid', {
  sttProxyUrl: 'ws://127.0.0.1:2998',
  /** Open https://persuaid.app/... in the default browser (e.g. pricing). */
  openExternal: (url) => ipcRenderer.invoke('persuaid-open-external', url),
  setCallCompactLayout: (compact) => ipcRenderer.invoke('call-compact-layout', compact),
  /** True when the native window has no title bar (macOS); use in-app traffic lights + drag regions. */
  frameless: isMac,
  windowAction: (action) => ipcRenderer.invoke('persuaid-window', action),
  /** macOS: enable/disable HUD vibrancy (call mode only). */
  setVibrancyEnabled: (enabled) => ipcRenderer.invoke('persuaid-set-vibrancy', enabled),
  /** Resize window to compact floating call HUD (or restore previous bounds). */
  setCallHudMode: (enabled) => ipcRenderer.invoke('persuaid-call-hud', enabled),
  /** Call HUD: show main panel (true) or pill-only compact window (false). */
  setCallHudPanelOpen: (open) => ipcRenderer.invoke('persuaid-call-hud-panel', open),
  /** Call HUD: set native window height to match measured web content (e.g. pill-only when hidden). */
  syncCallHudSize: (size) => ipcRenderer.invoke('persuaid-call-hud-sync-size', size),
});
