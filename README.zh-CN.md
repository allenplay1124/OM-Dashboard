# OM Dashboard

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md)

![OM Dashboard 封面](cover.png)

将 Obsidian 变成个人工作台的自定义 Dashboard 视图：一眼看到今天、快速新增内容，并统计笔记、项目和任务。

---

## 第一部分：一般用户

### 功能

- **页首**：可设置背景图和问候语；根据当前时间显示“早安／午安／晚安”并加上设置的昵称（06:00–10:59 早安、11:00–17:59 午安、18:00–05:59 晚安）；在搜索框输入关键词后按 Enter，会打开 Obsidian 全局搜索并带入关键词。
- **日期卡**：显示当天的年、月、日和星期（跟随系统语言设置）。
- **快速新增**：新增笔记、新增项目、新增任务。
- **统计**：显示笔记／项目／任务数量，任务再按状态和优先级分组；如果 dotpm 设置了颜色，分组前会显示对应色点。
- **笔记热力图**：第二行左侧卡片，按笔记创建时间显示近 12 个月的创建密度。
- **关联图**：第二行右侧卡片，显示笔记之间的链接关系；点击节点可打开笔记，节点颜色跟随主色设置。
- **近期笔记**：第三行左侧卡片，列出最近更新的 10 篇笔记，格式为“文件夹/标题”，点击可打开。
- **近期任务**：第三行中间卡片，列出截止日期最近的 10 个未完成任务；第一行“项目/任务”，第二行小字显示开始日期／截止日期／进度，点击可打开。
- **标签云**：第三行右侧卡片，按标签使用次数决定字号，文字为彩虹渐变；点击标签会打开 Obsidian 全局搜索并带入 `tag:#标签`。
- **自动更新**：vault 内新增、删除、重命名文件或笔记内容变更后，约 1 秒内更新仪表板。

### 要求

- Obsidian 1.8.7 以上。插件未限制桌面平台（`isDesktopOnly: false`）。

#### 第三方插件（依赖）

本插件可与以下第三方插件集成以提供完整功能；未安装时仍可运行，但对应功能会降级或失败：

- **dotpm / obsidian-pm**：项目管理插件。OM Dashboard 的“新增项目”“新增任务”两个按钮会调用它的命令；统计的状态／优先级标签与颜色也读取自它的设置。
  - 项目 Repo：https://github.com/dotpm/obsidian-pm
  - 未安装时，这两个按钮仍会显示，但执行会失败；标签则回退显示原始 ID。

### 安装

1. 从 GitHub Release 下载 `om-dashboard.zip`。
2. 解压后，把 `om-dashboard` 文件夹放到 `<vault>/.obsidian/plugins/`。
3. 重新加载 Obsidian，到 **设置 → 社区插件** 启用 **OM Dashboard**。

### 使用

打开方式二选一：

- 点击左侧功能区的 `layout-dashboard` 图标。
- 打开命令面板，执行 **打开 Dashboard**（命令 ID：`open-dashboard`）。

再次打开会重用现有的 Dashboard 分页；在设置中勾选“启动时开启”时，会另开新分页。

#### 设置

到 **设置 → 社区插件 → OM Dashboard**：

| 设置 | 说明 | 默认值 |
|------|------|--------|
| 语言 | 跟随 Obsidian／繁体中文／简体中文／English | 跟随 Obsidian |
| 昵称 | 页首问候语显示的称呼；留空则只显示时段问候语 | 留空 |
| 主色 | 卡片、图标、热力图、关联图节点与焦点框的主要颜色；可用颜色选择器或直接输入 `#RRGGBB` | `#65B2AB` |
| 笔记根目录 | 只统计这个文件夹下的笔记；留空则统计整个 vault（不含 dotpm 项目和任务） | 留空 |
| 页首背景图存放位置 | 输入 vault 内的图片路径，或拖拽／选择图片上传。上传的文件保存到 `附件/OM Dashboard/banner.*`，建议尺寸 1920 × 640 px | 留空 |
| 启动时开启 | Obsidian 启动时自动在主工作区打开 Dashboard | 开启 |

界面文字由 `src/i18n.ts` 集中管理，目前支持繁体中文、简体中文和英文。

### 统计规则

统计只读取 Markdown 文件的 frontmatter，不会修改笔记内容：

- `pm-project: true` → 计入**项目**，不再计入笔记。
- `pm-task: true` → 计入**任务**，不再计入笔记；同时读取 `status` 与 `priority`。
- 其他 Markdown 文件 → 计入**笔记**。如果设置了“笔记根目录”，只计入该文件夹（含子文件夹）内的文件。
- `status` 或 `priority` 不存在时，归入**未设置**。
- “近期任务”会排除 dotpm 中标记为完成的状态（默认为 `done`、`cancelled`），并按 `due` 由近到远排序；没有 `due` 的任务排在最后。

```yaml
---
pm-task: true
status: doing
priority: high
---
```

---

## 第二部分：二次开发者

### 开发环境

- Node.js 18 以上（建议 LTS）。
- 包管理器：npm。
- 打包工具：esbuild（`esbuild.config.mjs`）。
- 类型：`obsidian` 类型定义（`latest`）。

### 安装与常用命令

```bash
npm install     # 安装依赖
npm run dev     # watch 模式，编译 src/main.ts → main.js（含 inline sourcemap）
npm run build   # 类型检查（tsc -noEmit）+ 正式构建（minify、无 sourcemap）
npm run lint    # ESLint（含 obsidianmd 规则）
npm run version # 提升版本号（version-bump.mjs）并 git add manifest.json versions.json
```

### 项目结构

源码按职责拆分在 `src/`：

| 文件 | 职责 |
|------|------|
| `src/main.ts` | 插件生命周期、命令注册、vault／metadata 事件与更新调度（1 秒 debounce） |
| `src/view.ts` | Dashboard 画面渲染与交互 |
| `src/counters.ts` | 笔记／项目／任务统计 |
| `src/recent.ts` | 近期笔记与未完成任务清单 |
| `src/tags.ts` | 标签统计与标签云 |
| `src/heatmap.ts` | 笔记创建时间热力图 |
| `src/graph.ts` | 笔记关联图 |
| `src/dotpm.ts` | 读取 dotpm 的状态／优先级设置 |
| `src/settings.ts` | 设置界面与默认值 |
| `src/settingsTab.ts` | 设置分页 UI |
| `src/i18n.ts` | 三语界面文字 |

其他根目录文件：

- `esbuild.config.mjs`：构建配置（entry `src/main.ts`、bundle、external obsidian/electron/codemirror 等）。
- `tsconfig.json`：TypeScript 严格模式（`strict: true`）。
- `eslint.config.mts`：ESLint 配置（含 `eslint-plugin-obsidianmd`）。
- `manifest.json`、`versions.json`：插件 metadata 与版本对应。

### 开发流程

1. `npm run dev` 启动 watch 模式。
2. 修改 `src/` 后，esbuild 重新编译为 `main.js`。
3. 在 Obsidian 中重新加载插件（或重启）即可看到新版本。
4. 提交前执行 `npm run build`（类型检查）与 `npm run lint`。

构建产物 `main.js` 不进版本控制，会连同 `manifest.json`、`styles.css` 直接附加到 GitHub Release，并另外打包进 `om-dashboard.zip`；`node_modules/` 也不提交。

### 发布

遵循 Obsidian 社区插件惯例：

1. 在 `manifest.json` 中提升 `version`（SemVer），并更新 `versions.json` 中对应的最低 app 版本。
2. 执行 `npm run version`（或手动）更新版本文件。
3. 执行 `npm run build` 生成 `main.js`。
4. 创建 GitHub release，tag 必须与 `manifest.json` 的 `version` 完全一致（不加前导 `v`）。
5. Release workflow 会直接附加 `main.js`、`manifest.json`、`styles.css`，并另外打包 `om-dashboard.zip` 供手动安装。

### 授权

[GPL-3.0](LICENSE)。
