# OM Dashboard

把 Obsidian 變成個人工作台的自訂 Dashboard 檢視：一眼看到今天、快速新增內容，並統計筆記、專案與任務。

## 功能

- **頁首**：可設定背景圖；在搜尋框輸入關鍵字後按 Enter，會開啟 Obsidian 全域搜尋並帶入關鍵字。
- **日期卡**：顯示當天的年、月、日與星期（跟隨系統語言設定）。
- **快速新增**：新增筆記、新增專案、新增任務。
- **統計**：顯示筆記／專案／任務數量，任務再依狀態與優先級分組；若 dotpm 有設定顏色，分組前會顯示對應色點。
- **筆記熱力圖**：第二列左側卡片，依筆記建立時間顯示近 12 個月的建立密度。
- **關聯圖**：第二列右側卡片，顯示筆記之間的連結關聯，點擊節點可開啟筆記。
- **近期筆記**：第三列左側卡片，列出最近更新的 10 篇筆記，格式為「資料夾/標題」，點擊可開啟。
- **近期任務**：第三列中間卡片，列出截止日最近的 10 個未完成任務；第一行「專案/任務」，第二行小字顯示開始日／截止日／進度，點擊可開啟。
- **標籤雲**：第三列右側卡片，依標籤使用次數決定字級，文字為彩虹漸層；點擊標籤會開啟 Obsidian 全域搜尋並帶入 `tag:#標籤`。
- **自動更新**：vault 內新增、刪除、重命名檔案或筆記內容變更後，約 1 秒內更新儀表板。

## 需求

- Obsidian 1.8.7 以上。插件未限制桌面平台。
- 選用：dotpm（插件 ID `project-manager`）。「新增專案」「新增任務」兩顆按鈕會呼叫它的指令；統計的狀態／優先級標籤與顏色也讀自它的設定。未安裝時，這兩顆按鈕仍會出現，但執行會失敗；標籤則退回顯示原始 ID。

## 安裝

1. 取得 `main.js`、`manifest.json`、`styles.css`（自行建置或從 GitHub release 下載）。
2. 放到 `<vault>/.obsidian/plugins/om-dashboard/`。
3. 重新載入 Obsidian，到 **設定 → 社群插件** 啟用 **OM Dashboard**。

## 使用

開啟方式二選一：

- 點左側功能區的 `layout-dashboard` 圖示。
- 開命令面板，執行 **開啟 Dashboard**（命令 ID：`open-dashboard`）。

再次開啟會重用現有的 Dashboard 分頁；從設定勾選啟動時開啟時，會另開新分頁。

### 設定

到 **設定 → 社群插件 → OM Dashboard**：

| 設定 | 說明 | 預設值 |
|------|------|--------|
| 語言 | 跟隨 Obsidian／繁體中文／简体中文／English | 跟隨 Obsidian |
| 筆記根目錄 | 只統計這個資料夾下的筆記；留白則統計整個 vault（不含 dotpm 專案與任務） | 留白 |
| 頁首背景圖 | 輸入 vault 內的圖片路徑，或拖拉／選擇圖片上傳。上傳的檔案存到 `附件/OM Dashboard/banner.*`，建議尺寸 1920 × 640 px | 留白 |
| 啟動時開啟 | Obsidian 啟動時自動在主工作區開啟 Dashboard | 開啟 |

介面文字由 `src/i18n.ts` 集中管理，目前支援繁體中文、简体中文與英文。

## 統計規則

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

## 開發

需要 Node.js 18 以上，並使用 npm。

```bash
npm i          # 安裝依賴
npm run dev    # watch 模式，編譯 src/main.ts → main.js
npm run build  # 型別檢查 + 正式建置
npm run lint   # ESLint（含 obsidianmd 規則）
```

原始碼依職責拆分：

| 檔案 | 職責 |
|------|------|
| `src/main.ts` | 插件生命週期、命令註冊、事件與更新排程 |
| `src/view.ts` | Dashboard 畫面與互動 |
| `src/counters.ts` | 筆記／專案／任務統計 |
| `src/recent.ts` | 近期筆記與未完成任務清單 |
| `src/tags.ts` | 標籤統計與標籤雲 |
| `src/dotpm.ts` | 讀取 dotpm 的狀態、優先級設定 |
| `src/settings.ts`、`src/settingsTab.ts` | 預設值與設定分頁 |
| `src/i18n.ts` | 三語介面文字 |

修改 `src/` 後執行 `npm run dev`，再重新載入 Obsidian 即可看到新版本。建置產物 `main.js` 不進版本控制，僅隨 release 發布。

## 授權

[GPL-3.0](LICENSE)。
