import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import isDev from 'electron-is-dev'

let mascotWindow: BrowserWindow | null = null
let mainAppWindow: BrowserWindow | null = null
let tray: Tray | null = null

/**
 * マスコットウィンドウを作成
 */
function createMascotWindow() {
  mascotWindow = new BrowserWindow({
    width: 300,
    height: 400,
    // デスクトップマスコット化
    transparent: true,        // 背景を透明に
    frame: false,             // ウィンドウの枠を削除
    alwaysOnTop: true,        // 常に最前面に表示
    resizable: false,         // リサイズ不可
    hasShadow: false,         // 影なし
    skipTaskbar: true,        // タスクバーに表示しない
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    }
  })

  // 開発時はローカルサーバー、本番時はビルドされたファイル
  if (isDev) {
    mascotWindow.loadURL('http://localhost:5174')
    // DevToolsは必要に応じて手動で開く（Cmd+Option+I / Ctrl+Shift+I）
    // mascotWindow.webContents.openDevTools()
  } else {
    mascotWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // ウィンドウを閉じても終了しない（システムトレイに常駐）
  // 開発時は通常通り終了
  if (!isDev) {
    mascotWindow.on('close', (event) => {
      event.preventDefault()
      mascotWindow?.hide()
    })
  }

  mascotWindow.on('closed', () => {
    mascotWindow = null
  })
}

/**
 * メインアプリウィンドウを作成
 */
function createMainAppWindow() {
  if (mainAppWindow) {
    // 既に存在する場合は表示してフォーカス
    mainAppWindow.show()
    mainAppWindow.focus()
    return
  }

  mainAppWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false // 最初は非表示で作成
  })

  // 既存のフロントエンドアプリをロード
  if (isDev) {
    mainAppWindow.loadURL('http://localhost:5173')
    // DevToolsは必要に応じて手動で開く（Cmd+Option+I / Ctrl+Shift+I）
    // mainAppWindow.webContents.openDevTools()
  } else {
    // 本番環境では別途ビルドしたフロントエンドをロード
    mainAppWindow.loadURL('http://localhost:5173')
  }

  // ロード完了後に表示
  mainAppWindow.once('ready-to-show', () => {
    mainAppWindow?.show()
    mainAppWindow?.focus()
    // メインアプリを開いたらマスコットを下に
    if (mascotWindow) {
      mascotWindow.setAlwaysOnTop(false)
    }
  })

  mainAppWindow.on('closed', () => {
    mainAppWindow = null
    // メインアプリを閉じたらマスコットを最前面に戻す
    if (mascotWindow) {
      mascotWindow.setAlwaysOnTop(true)
    }
  })

  // メインアプリがフォーカスを失ったとき
  mainAppWindow.on('blur', () => {
    // メインアプリがアクティブでなくなったらマスコットを最前面に
    if (mascotWindow) {
      mascotWindow.setAlwaysOnTop(true)
    }
  })

  // メインアプリがフォーカスを得たとき
  mainAppWindow.on('focus', () => {
    // メインアプリがアクティブになったらマスコットを下に
    if (mascotWindow) {
      mascotWindow.setAlwaysOnTop(false)
    }
  })
}

/**
 * システムトレイの作成
 */
function createTray() {
  // シンプルなトレイアイコン（16x16の透明PNG）
  // 本番環境では適切なアイコンファイルを使用してください
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🎯 Share Motti Desktop',
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: '🏠 メインアプリ',
      click: () => {
        if (mainAppWindow) {
          mainAppWindow.show()
          mainAppWindow.focus()
        } else {
          createMainAppWindow()
        }
      }
    },
    {
      label: mascotWindow?.isVisible() ? '👻 マスコットを非表示' : '👻 マスコットを表示',
      click: () => {
        if (mascotWindow) {
          if (mascotWindow.isVisible()) {
            mascotWindow.hide()
          } else {
            mascotWindow.show()
          }
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '❌ 終了',
      click: () => {
        app.quit()
      }
    }
  ])
  
  tray.setToolTip('Share Motti Desktop Mascot')
  tray.setContextMenu(contextMenu)
  
  // クリックでメインアプリを表示
  tray.on('click', () => {
    if (mainAppWindow) {
      mainAppWindow.show()
      mainAppWindow.focus()
    } else {
      createMainAppWindow()
    }
  })
}

/**
 * IPCハンドラーの設定
 */
function setupIpcHandlers() {
  // ホーム画面を開く（メインアプリウィンドウを表示）
  ipcMain.on('open-home', () => {
    console.log('🎯 open-home イベント受信')
    createMainAppWindow()
  })

  // クリック可能状態の切り替え（マスコットウィンドウ用）
  ipcMain.on('set-clickable', (_event, clickable: boolean) => {
    if (mascotWindow) {
      mascotWindow.setIgnoreMouseEvents(!clickable, { forward: true })
    }
  })

  // ウィンドウの移動（マスコットウィンドウ用）
  ipcMain.on('move-window', (_event, { x, y }: { x: number; y: number }) => {
    if (mascotWindow) {
      const [currentX, currentY] = mascotWindow.getPosition()
      mascotWindow.setPosition(
        Math.round(currentX + x),
        Math.round(currentY + y)
      )
    }
  })
}

/**
 * アプリケーション起動
 */
app.whenReady().then(() => {
  createMascotWindow()
  // メインアプリは最初は開かず、マスコットクリックで開く
  createTray()
  setupIpcHandlers()

  app.on('activate', () => {
    if (!mascotWindow) {
      createMascotWindow()
    }
  })
})

/**
 * 全ウィンドウが閉じられても終了しない（システムトレイに常駐）
 * 開発時のみ終了する
 */
app.on('window-all-closed', () => {
  if (isDev) {
    app.quit()
  }
  // 本番環境ではシステムトレイから終了する
})

