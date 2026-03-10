const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('persuaid', {
  sttProxyUrl: 'ws://127.0.0.1:2998',
});
