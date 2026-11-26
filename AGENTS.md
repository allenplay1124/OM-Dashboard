# Obsidian 社群插件

## 專案概覽

- 目標：Obsidian 社群插件（TypeScript → 打包後的 JavaScript）。
- 入口點：`src/main.ts`，編譯為 `main.js` 並由 Obsidian 載入。
- 必要的發佈產物：`main.js`、`manifest.json`，以及可選的 `styles.css`。

## 環境與工具

- Node.js：使用目前的 LTS（建議 Node 18+）。
- **套件管理器：npm**（此範例必要 —— `package.json` 定義了 npm 腳本與依賴）。
- **打包工具：esbuild**（此範例必要 —— `esbuild.config.mjs` 與建置腳本依賴它）。其他專案若能將所有外部依賴打包進 `main.js`，也可使用 Rollup 或 webpack 等替代打包工具。
- 型別：`obsidian` 型別定義。

**注意**：此範例專案對 npm 與 esbuild 有特定的技術依賴。若從零建立插件，可以選擇不同工具，但需要相應替換建置設定。

### 安裝

```bash
npm install
```

### 開發（watch）

```bash
npm run dev
```

### 正式建置

```bash
npm run build
```

## Linting

- ESLint 已預先設定 `eslint-plugin-obsidianmd`，用於 Obsidian 專屬規則。
- 執行 `npm run lint` 進行 lint。
- GitHub Action 會在所有分支的每次 commit 自動 lint。

## 檔案與資料夾慣例

- **將程式碼拆分到多個檔案**：把功能分散到不同模組，而不是全部塞進 `main.ts`。
- 原始碼放在 `src/`。保持 `main.ts` 簡小，專注於插件生命週期（載入、卸載、註冊命令）。
- **範例檔案結構**：
- **不要提交建置產物**：永遠不要將 `node_modules/`、`main.js` 或其他產生的檔案提交到版本控制。
- 保持插件輕量。避免大型依賴。優先使用瀏覽器相容的套件。
- 產生的輸出應放在插件根目錄或 `dist/`（視建置設定而定）。發佈產物必須放在 vault 中插件資料夾的頂層（`main.js`、`manifest.json`、`styles.css`）。
- **README 三語同步**：修改 `README.md` 時，必須同步更新 `README.zh-TW.md` 與 `README.zh-CN.md`，並保留開頭的語言切換連結。

## Manifest 規則（`manifest.json`）

- 必須包含（非完整清單）：
  - `id`（插件 ID；本機開發時應與資料夾名稱一致）
  - `name`
  - `version`（語意化版本 `x.y.z`）
  - `minAppVersion`
  - `description`
  - `isDesktopOnly`（布林值）
  - 可選：`author`、`authorUrl`、`fundingUrl`（字串或 map）
- 發佈後永遠不要更改 `id`。將其視為穩定的 API。
- 使用較新的 API 時，保持 `minAppVersion` 準確。
- 權威需求定義於：[https://github.com/obsidianmd/obsidian-releases/blob/master/.github/workflows/validate-plugin-entry.yml](https://github.com/obsidianmd/obsidian-releases/blob/master/.github/workflows/validate-plugin-entry.yml)

## 測試

- 手動安裝以測試：將 `main.js`、`manifest.json`、`styles.css`（若有）複製到：
- 重新載入 Obsidian，並在 **設定 → 社群插件** 啟用插件。

## 命令與設定

- 任何使用者面向的命令都應透過 `this.addCommand(...)` 新增。
- 若插件有設定，提供設定分頁與合理的預設值。
- 使用 `this.loadData()` / `this.saveData()` 持久化設定。
- 使用穩定的命令 ID；發佈後避免重新命名。

## 版本控制與發佈

- 在 `manifest.json` 中 bump `version`（SemVer），並更新 `versions.json` 以對應插件版本 → 最低 app 版本。
- 建立 GitHub release，其 tag 必須與 `manifest.json` 的 `version` 完全一致。不要使用前導 `v`。
- 將 `manifest.json`、`main.js`、`styles.css`（若有）作為獨立資產附加到 release。
- 初始發佈後，按要求的流程在社群目錄中新增／更新你的插件。

## 安全性、隱私與合規

遵循 Obsidian 的 **開發者政策** 與 **插件指南**。特別是：

- 預設為本機／離線操作。僅在功能必要時才發出網路請求。
- 不得隱藏遙測。若收集可選分析或呼叫第三方服務，必須明確 opt-in，並在 `README.md` 與設定中清楚記錄。
- 永遠不要執行遠端程式碼、fetch 並 eval 腳本，或在正常發佈之外自動更新插件程式碼。
- 最小化範圍：只在 vault 內讀寫必要的內容。不要存取 vault 外的檔案。
- 清楚揭露任何使用的外部服務、傳送的資料與風險。
- 尊重使用者隱私。除非絕對必要且經明確同意，否則不要收集 vault 內容、檔案名稱或個人資訊。
- 避免欺騙性模式、廣告或垃圾通知。
- 使用提供的 `register*` 輔助函式註冊並清理所有 DOM、app 與 interval 監聽器，使插件能安全卸載。

## UX 與文案指南（用於 UI 文字、命令、設定）

- 標題、按鈕、標題優先使用 sentence case。
- 步驟式文案使用清楚、動作導向的祈使句。
- 使用 **粗體** 標示字面 UI 標籤。互動優先使用「select」。
- 導航使用箭頭表示法：**設定 → 社群插件**。
- 保持應用程式內字串簡短、一致、無行話。

## 效能

- 保持啟動輕量。延遲非必要的繁重工作。
- 避免在 `onload` 期間執行長時間任務；使用延遲初始化。
- 批次磁碟存取，避免過度的 vault 掃描。
- 對檔案系統事件的昂貴操作進行 debounce/throttle。

## 編碼慣例

- 優先使用 `"strict": true` 的 TypeScript。
- **CSS 避免使用 `!important`**：需要覆寫 Obsidian 預設樣式時，優先提高選擇器精確度或使用 CSS 變數。
- **保持 `main.ts` 最小**：只專注於插件生命週期（onload、onunload、addCommand 呼叫）。將所有功能邏輯委派給其他模組。
- **拆分大型檔案**：若任何檔案超過 ~200-300 行，考慮拆成更小、職責分明的模組。
- **使用清楚的模組邊界**：每個檔案應有單一、定義良好的責任。
- 將所有東西打包進 `main.js`（不使用未打包的執行時期依賴）。
- 若需要行動端相容性，避免 Node/Electron API；相應設定 `isDesktopOnly`。
- 優先使用 `async/await` 而非 promise chain；妥善處理錯誤。

## 行動端

- 在可行的情況下，在 iOS 與 Android 上測試。
- 除非 `isDesktopOnly` 為 `true`，否則不要假設桌面專屬行為。
- 避免大型的記憶體內結構；留意記憶體與儲存限制。

## Agent 宜／忌

**宜**

- 與使用者交互時，使用**繁體中文**
- 使用穩定的 ID 新增命令（發佈後不要重新命名）。
- 在設定中提供預設值與驗證。
- 撰寫冪等的程式碼路徑，使 reload/unload 不洩漏監聽器或 interval。
- 對所有需要清理的東西使用 `this.register*` 輔助函式。

**忌**

- 在沒有明顯使用者面向理由與文件的情況下引入網路呼叫。
- 在沒有清楚揭露與明確 opt-in 的情況下，提供需要雲端服務的功能。
- 除非必要且經同意，否則儲存或傳輸 vault 內容。

## 常見任務

### 將程式碼組織到多個檔案

**main.ts**（最小，僅生命週期）：

```ts
import { Plugin } from 'obsidian';
import { MySettings, DEFAULT_SETTINGS } from './settings';
import { registerCommands } from './commands';

export default class MyPlugin extends Plugin {
	settings!: MySettings;

	async onload() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MySettings>,
		);
		registerCommands(this);
	}
}
```

**settings.ts**：

```ts
export interface MySettings {
	enabled: boolean;
	apiKey: string;
}

export const DEFAULT_SETTINGS: MySettings = {
	enabled: true,
	apiKey: '',
};
```

**commands/index.ts**：

```ts
import { Plugin } from 'obsidian';
import { doSomething } from './my-command';

export function registerCommands(plugin: Plugin) {
	plugin.addCommand({
		id: 'do-something',
		name: 'Do something',
		callback: () => doSomething(plugin),
	});
}
```

### 新增命令

```ts
this.addCommand({
	id: 'your-command-id',
	name: 'Do the thing',
	callback: () => this.doTheThing(),
});
```

### 持久化設定

```ts
interface MySettings { enabled: boolean }
const DEFAULT_SETTINGS: MySettings = { enabled: true };

async onload() {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MySettings>);
  await this.saveData(this.settings);
}
```

### 安全地註冊監聽器

```ts
this.registerEvent(
	this.app.workspace.on('file-open', (f) => {
		/* ... */
	}),
);
this.registerDomEvent(activeWindow, 'resize', () => {
	/* ... */
});
this.registerInterval(
	window.setInterval(() => {
		/* ... */
	}, 1000),
);
```

## 疑難排解

- 建置後插件無法載入：確認 `main.js` 與 `manifest.json` 位於 vault 中插件資料夾頂層 `<Vault>/.obsidian/plugins/<plugin-id>/`。
- 建置問題：若 `main.js` 缺失，執行 `npm run build` 或 `npm run dev` 以編譯 TypeScript 原始碼。
- 命令未出現：確認 `addCommand` 在 `onload` 之後執行，且 ID 唯一。
- 設定未持久化：確認 `loadData`/`saveData` 已 await，且變更後重新渲染 UI。
- 行動端專屬問題：確認未使用桌面專屬 API；檢查 `isDesktopOnly` 並調整。

## 參考資料

- Obsidian 範例插件：[https://github.com/obsidianmd/obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- API 文件：[https://docs.obsidian.md](https://docs.obsidian.md)
- 開發者政策：[https://docs.obsidian.md/Developer+policies](https://docs.obsidian.md/Developer+policies)
- 插件指南：[https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- 風格指南：[https://help.obsidian.md/style-guide](https://help.obsidian.md/style-guide)