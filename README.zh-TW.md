# OM Dashboard

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md)

![OM Dashboard 封面](cover.png)

把 Obsidian 變成個人工作台的自訂 Dashboard 檢視：一眼看到今天、快速新增內容，並統計筆記、專案與任務。

---

## 第一部分：一般使用者

### 功能

- **頁首**：可設定背景圖與問候語；依目前時間顯示「早安／午安／晚安」加上設定的暱稱（06:00–10:59 早安、11:00–17:59 午安、18:00–05:59 晚安）；在搜尋框輸入關鍵字後按 Enter，會開啟 Obsidian 全域搜尋並帶入關鍵字。
- **日期卡**：顯示當天的年、月、日與星期（跟隨系統語言設定）。
- **快速新增**：新增筆記、新增專案、新增任務。
- **統計**：顯示筆記／專案／任務數量，任務再依狀態與優先級分組；若 dotpm 有設定顏色，分組前會顯示對應色點。
- **筆記熱力圖**：第二列左側卡片，依筆記建立時間顯示近 12 個月的建立密度。
- **關聯圖**：第二列右側卡片，顯示筆記之間的連結關聯，點擊節點可開啟筆記；節點顏色跟隨主色設定。
- **近期筆記**：第三列左側卡片，列出最近更新的 10 篇筆記，格式為「資料夾/標題」，點擊可開啟。
- **近期任務**：第三列中間卡片，列出截止日最近的 10 個未完成任務；第一行「專案/任務」，第二行小字顯示開始日／截止日／進度，點擊可開啟。
- **標籤雲**：第三列右側卡片，依標籤使用次數決定字級，文字為彩虹漸層；點擊標籤會開啟 Obsidian 全域搜尋並帶入 `tag:#標籤`。
- **自動更新**：vault 內新增、刪除、重命名檔案或筆記內容變更後，約 1 秒內更新儀表板。

### 需求

- Obsidian 1.8.7 以上。插件未限制桌面平台（`isDesktopOnly: false`）。

#### 第三方插件（相依性）

本插件可與以下第三方插件整合，以提供完整功能；未安裝時仍可運作，但對應功能會降級或失敗：

- **dotpm / obsidian-pm**：專案管理插件。OM Dashboard 的「新增專案」「新增任務」兩顆按鈕會呼叫它的指令；統計的狀態／優先級標籤與顏色也讀自它的設定。
  - 專案 Repo：https://github.com/dotpm/obsidian-pm
  - 未安裝時，這兩顆按鈕仍會出現，但執行會失敗；標籤則退回顯示原始 ID。

### 安裝

1. 從 GitHub Release 下載 `om-dashboard.zip`。
2. 解壓後，把 `om-dashboard` 資料夾放到 `<vault>/.obsidian/plugins/`。
3. 重新載入 Obsidian，到 **設定 → 社群插件** 啟用 **OM Dashboard**。

### 使用

開啟方式二選一：

- 點左側功能區的 `layout-dashboard` 圖示。
- 開命令面板，執行 **開啟 Dashboard**（命令 ID：`open-dashboard`）。

再次開啟會重用現有的 Dashboard 分頁；從設定勾選啟動時開啟時，會另開新分頁。

#### 設定

到 **設定 → 社群插件 → OM Dashboard**：

| 設定 | 說明 | 預設值 |
|------|------|--------|
| 語言 | 跟隨 Obsidian／繁體中文／简体中文／English | 跟隨 Obsidian |
| 暱稱 | 頁首問候語顯示的稱呼；留白則只顯示時段問候語 | 留白 |
| 主色 | 卡片、圖示、熱力圖、關聯圖節點與焦點框的主要顏色；可用顏色選擇器或直接輸入 `#RRGGBB` | `#65B2AB` |
| 筆記根目錄 | 只統計這個資料夾下的筆記；留白則統計整個 vault（不含 dotpm 專案與任務） | 留白 |
| 頁首背景圖存放位置 | 輸入 vault 內的圖片路徑，或拖拉／選擇圖片上傳。上傳的檔案存到 `附件/OM Dashboard/banner.*`，建議尺寸 1920 × 640 px | 留白 |
| 啟動時開啟 | Obsidian 啟動時自動在主工作區開啟 Dashboard | 開啟 |

介面文字由 `src/i18n.ts` 集中管理，目前支援繁體中文、简体中文與英文。

### 統計規則

統計只讀取 Markdown 檔案的 frontmatter，不會修改筆記內容：

- `pm-project: true` → 計入**專案**，不再計入筆記。
- `pm-task: true` → 計入**任務**，不再計入筆記；同時讀取 `status` 與 `priority`。
- 其他 Markdown 檔案 → 計入**筆記**。若設定了「筆記根目錄」，只計入該資料夾（含子資料夾）內的檔案。
- `status` 或 `priority` 不存在時，歸入**未設定**。
- 「近期任務」會排除 dotpm 中標記為完成的狀態（預設為 `done`、`cancelled`），並依 `due` 由近到遠排序；沒有 `due` 的任務排在最後。

```yaml
---
pm-task: true
status: doing
priority: high
---
```

---

## 第二部分：二次開發者

### 開發環境

- Node.js 18 以上（建議 LTS）。
- 套件管理器：npm。
- 打包工具：esbuild（`esbuild.config.mjs`）。
- 型別：`obsidian` 型別定義（`latest`）。

### 安裝與常用指令

```bash
npm install    # 安裝依賴
npm run dev    # watch 模式，編譯 src/main.ts → main.js（含 inline sourcemap）
npm run build  # 型別檢查（tsc -noEmit）+ 正式建置（minify、無 sourcemap）
npm run lint   # ESLint（含 obsidianmd 規則）
npm run version # bump 版本號（version-bump.mjs）並 git add manifest.json versions.json
```

### 專案結構

原始碼依職責拆分於 `src/`：

| 檔案 | 職責 |
|------|------|
| `src/main.ts` | 插件生命週期、命令註冊、vault／metadata 事件與更新排程（1 秒 debounce） |
| `src/view.ts` | Dashboard 畫面渲染與互動 |
| `src/counters.ts` | 筆記／專案／任務統計 |
| `src/recent.ts` | 近期筆記與未完成任務清單 |
| `src/tags.ts` | 標籤統計與標籤雲 |
| `src/heatmap.ts` | 筆記建立時間熱力圖 |
| `src/graph.ts` | 筆記關聯圖 |
| `src/dotpm.ts` | 讀取 dotpm 的狀態、優先級設定 |
| `src/settings.ts` | 設定介面與預設值 |
| `src/settingsTab.ts` | 設定分頁 UI |
| `src/i18n.ts` | 三語介面文字 |

其他根目錄檔案：

- `esbuild.config.mjs`：建置設定（entry `src/main.ts`，bundle，external obsidian/electron/codemirror 等）。
- `tsconfig.json`：TypeScript 嚴格模式（`strict: true`）。
- `eslint.config.mts`：ESLint 設定（含 `eslint-plugin-obsidianmd`）。
- `manifest.json`、`versions.json`：插件 metadata 與版本對應。

### 開發流程

1. `npm run dev` 啟動 watch 模式。
2. 修改 `src/` 後，esbuild 重新編譯為 `main.js`。
3. 在 Obsidian 中重新載入插件（或重啟）即可看到新版本。
4. 提交前執行 `npm run build`（型別檢查）與 `npm run lint`。

建置產物 `main.js` 不進版本控制，會連同 `manifest.json`、`styles.css` 直接附加到 GitHub Release，並另外打包進 `om-dashboard.zip`；`node_modules/` 也不提交。

### 發佈

遵循 Obsidian 社群插件慣例：

1. 在 `manifest.json` bump `version`（SemVer），並更新 `versions.json` 對應最低 app 版本。
2. 執行 `npm run version`（或手動）更新版本檔。
3. 執行 `npm run build` 產生 `main.js`。
4. 建立 GitHub release，tag 必須與 `manifest.json` 的 `version` 完全一致（不加前導 `v`）。
5. Release workflow 會直接附加 `main.js`、`manifest.json`、`styles.css`，並另外打包 `om-dashboard.zip` 供手動安裝。

### 授權

[GPL-3.0](LICENSE)。
