import { getLanguage } from 'obsidian';

export type Lang = 'zh-TW' | 'zh-CN' | 'en';
export type LanguageSetting = 'auto' | Lang;

export const LANGUAGE_OPTIONS: { value: LanguageSetting; label: string }[] = [
	{ value: 'auto', label: 'Follow Obsidian' },
	{ value: 'zh-TW', label: '繁體中文' },
	{ value: 'zh-CN', label: '简体中文' },
	{ value: 'en', label: 'English' },
];

export function resolveLanguage(setting: string | undefined): Lang {
	if (setting === 'zh-TW' || setting === 'zh-CN' || setting === 'en') return setting;
	let code = '';
	try {
		code = (getLanguage?.() ?? 'en').toLowerCase();
	} catch {
		code = 'en';
	}
	if (code.startsWith('zh')) {
		return /tw|hant|hk|mo/.test(code) ? 'zh-TW' : 'zh-CN';
	}
	return 'en';
}

type Dict = Record<string, string | string[]>;

const DICTS: Record<Lang, Dict> = {
	'zh-TW': {
		settingsHeading: '儀表板設定',
		notesRoot: '筆記根目錄',
		notesRootDesc: '留白則統計整個 vault 的筆記（不含 dotpm 專案與任務）。',
		notesRootPlaceholder: '例如：個人筆記',
		headerBackground: '頁首背景圖存放位置',
		headerBackgroundDesc: '輸入 vault 內圖片路徑，或從下方上傳。',
		uploadHint: '上傳頁首背景圖（建議尺寸：1920 × 640 px）',
		openOnStartup: '啟動時開啟',
		openOnStartupDesc: 'Obsidian 啟動時自動在主工作區開啟 Dashboard。',
		dependentPlugins: '相依插件',
		language: '語言',
		languageDesc: '介面語言。預設跟隨 Obsidian。',
		nickname: '暱稱',
		nicknameDesc: '頁首問候語使用的稱呼。',
		accentColor: '主色',
		accentColorDesc: '控制卡片、圖示、熱力圖與焦點框的主要顏色。',
		greetingMorning: '早安',
		greetingAfternoon: '午安',
		greetingEvening: '晚安',
		headerUpdated: '頁首背景圖已更新',
		uploadFailed: '上傳失敗：',
		cannotCreateFolder: '無法建立資料夾 ',
		openDashboard: '開啟 Dashboard',
		searchPlaceholder: '搜尋筆記…',
		searchAria: '搜尋筆記',
		quickAdd: '快速新增',
		newNote: '新增筆記',
		newProject: '新增專案',
		newTask: '新增任務',
		stats: '統計',
		heatmap: '筆記熱力圖',
		graph: '關聯圖',
		heatmapEmpty: '尚無筆記',
		heatmapTotal: '共 {n} 篇',
		graphEmpty: '尚無連結',
		notes: '筆記',
		projects: '專案',
		tasks: '任務',
		taskByStatus: '依狀態',
		taskByPriority: '依優先級',
		noTasks: '尚無任務',
		unset: '未設定',
		unnamed: '未命名',
		recentNotes: '近期筆記',
		recentTasks: '近期任務',
		tagCloud: '標籤雲',
		noRecentNotes: '尚無筆記',
		noRecentTasks: '尚無未完成任務',
		noTags: '尚無標籤',
		cannotCreateNote: '無法建立筆記：',
		cannotRunDotpm: '無法執行 dotpm 指令：',
		weekdays: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
	},
	'zh-CN': {
		settingsHeading: '仪表板设置',
		notesRoot: '笔记根目录',
		notesRootDesc: '留空则统计整个 vault 的笔记（不含 dotpm 项目与任务）。',
		notesRootPlaceholder: '例如：个人笔记',
		headerBackground: '页首背景图存放位置',
		headerBackgroundDesc: '输入 vault 内图片路径，或从下方上传。',
		uploadHint: '上传页首背景图（建议尺寸：1920 × 640 px）',
		openOnStartup: '启动时开启',
		openOnStartupDesc: 'Obsidian 启动时自动在主工作区开启 Dashboard。',
		dependentPlugins: '依赖插件',
		language: '语言',
		languageDesc: '界面语言。默认跟随 Obsidian。',
		nickname: '昵称',
		nicknameDesc: '页首问候语使用的称呼。',
		accentColor: '主色',
		accentColorDesc: '控制卡片、图标、热力图与焦点框的主要颜色。',
		greetingMorning: '早安',
		greetingAfternoon: '午安',
		greetingEvening: '晚安',
		headerUpdated: '页首背景图已更新',
		uploadFailed: '上传失败：',
		cannotCreateFolder: '无法创建文件夹 ',
		openDashboard: '打开 Dashboard',
		searchPlaceholder: '搜索笔记…',
		searchAria: '搜索笔记',
		quickAdd: '快速新增',
		newNote: '新增笔记',
		newProject: '新增项目',
		newTask: '新增任务',
		stats: '统计',
		heatmap: '笔记热力图',
		graph: '关联图',
		heatmapEmpty: '暂无笔记',
		heatmapTotal: '共 {n} 篇',
		graphEmpty: '暂无链接',
		notes: '笔记',
		projects: '项目',
		tasks: '任务',
		taskByStatus: '按状态',
		taskByPriority: '按优先级',
		noTasks: '暂无任务',
		unset: '未设置',
		unnamed: '未命名',
		recentNotes: '近期笔记',
		recentTasks: '近期任务',
		tagCloud: '标签云',
		noRecentNotes: '暂无笔记',
		noRecentTasks: '暂无未完成任务',
		noTags: '暂无标签',
		cannotCreateNote: '无法创建笔记：',
		cannotRunDotpm: '无法执行 dotpm 指令：',
		weekdays: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
	},
	en: {
		settingsHeading: 'Dashboard settings',
		notesRoot: 'Notes root folder',
		notesRootDesc: 'Leave blank to count notes across the whole vault (excluding dotpm projects and tasks).',
		notesRootPlaceholder: 'e.g. Personal notes',
		headerBackground: 'Header background image location',
		headerBackgroundDesc: 'Enter an image path inside the vault, or upload below.',
		uploadHint: 'Upload header background image (recommended size: 1920 × 640 px)',
		openOnStartup: 'Open on startup',
		openOnStartupDesc: 'Automatically open the Dashboard in the main workspace when Obsidian starts.',
		dependentPlugins: 'Dependent plugins',
		language: 'Language',
		languageDesc: 'Interface language. Defaults to follow Obsidian.',
		nickname: 'Nickname',
		nicknameDesc: 'Name used in the header greeting.',
		accentColor: 'Accent color',
		accentColorDesc: 'Main color for cards, icons, heatmap, and focus outlines.',
		greetingMorning: 'Good morning',
		greetingAfternoon: 'Good afternoon',
		greetingEvening: 'Good evening',
		headerUpdated: 'Header background updated',
		uploadFailed: 'Upload failed: ',
		cannotCreateFolder: 'Cannot create folder ',
		openDashboard: 'Open Dashboard',
		searchPlaceholder: 'Search notes…',
		searchAria: 'Search notes',
		quickAdd: 'Quick add',
		newNote: 'New note',
		newProject: 'New project',
		newTask: 'New task',
		stats: 'Statistics',
		heatmap: 'Note heatmap',
		graph: 'Graph',
		heatmapEmpty: 'No notes yet',
		heatmapTotal: '{n} notes',
		graphEmpty: 'No links yet',
		notes: 'Notes',
		projects: 'Projects',
		tasks: 'Tasks',
		taskByStatus: 'By status',
		taskByPriority: 'By priority',
		noTasks: 'No tasks yet',
		unset: 'Not set',
		unnamed: 'Untitled',
		recentNotes: 'Recent notes',
		recentTasks: 'Recent tasks',
		tagCloud: 'Tag cloud',
		noRecentNotes: 'No notes yet',
		noRecentTasks: 'No open tasks',
		noTags: 'No tags yet',
		cannotCreateNote: 'Cannot create note: ',
		cannotRunDotpm: 'Cannot run dotpm command: ',
		weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	},
};

export function t(lang: Lang, key: string): string {
	const value = DICTS[lang][key] ?? DICTS.en[key];
	if (Array.isArray(value)) return value.join('');
	if (typeof value === 'string') return value;
	return key;
}

export function weekdays(lang: Lang): string[] {
	return DICTS[lang].weekdays as string[];
}
