import { contextBridge, ipcRenderer } from 'electron'

/**
 * レンダラープロセスに安全なAPIを公開
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * ブラウザでホーム画面を開く
   */
  openHome: () => {
    ipcRenderer.send('open-home')
  },

  /**
   * ウィンドウのクリック可能状態を設定
   * @param clickable trueでクリック可能、falseでクリックスルー
   */
  setClickable: (clickable: boolean) => {
    ipcRenderer.send('set-clickable', clickable)
  },

  /**
   * ウィンドウを相対移動
   * @param deltaX X方向の移動量
   * @param deltaY Y方向の移動量
   */
  moveWindow: (deltaX: number, deltaY: number) => {
    ipcRenderer.send('move-window', { x: deltaX, y: deltaY })
  }
})

// TypeScript用の型定義
export interface ElectronAPI {
  openHome: () => void
  setClickable: (clickable: boolean) => void
  moveWindow: (x: number, y: number) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

