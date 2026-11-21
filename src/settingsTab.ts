import { App, Notice, normalizePath, Plugin, PluginSettingTab, Setting, TFolder } from 'obsidian';
import { OMDashboardSettings } from './settings';

interface DashboardPlugin extends Plugin {
	settings: OMDashboardSettings;
	saveSettings(): Promise<void>;
	rebuildViews(): void;
}

export class OMDashboardSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: DashboardPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		this.containerEl.empty();
		new Setting(this.containerEl).setName('儀表板設定').setHeading();

		new Setting(this.containerEl)
			.setName('筆記根目錄')
			.setDesc('留白則統計整個 vault 的筆記（不含 dotpm 專案與任務）。')
			.addText((text) =>
				text
					.setPlaceholder('例如：個人筆記')
					.setValue(this.plugin.settings.notesRoot)
					.onChange(async (value) => {
						this.plugin.settings.notesRoot = value.trim();
						await this.plugin.saveSettings();
						this.plugin.rebuildViews();
					}),
			);

		new Setting(this.containerEl)
			.setName('頁首背景圖')
			.setDesc('輸入 vault 內圖片路徑，或從下方上傳。')
			.addText((text) =>
				text
					.setPlaceholder('附件/om-dashboard/banner.jpg')
					.setValue(this.plugin.settings.headerBackground)
					.onChange(async (value) => {
						this.plugin.settings.headerBackground = value.trim();
						await this.plugin.saveSettings();
						this.plugin.rebuildViews();
					}),
			);

		const uploader = this.containerEl.createDiv({ cls: 'om-upload' });
		uploader.createSpan({ text: '拖放或選擇圖片上傳到 vault（建議尺寸：1920 × 640 px）' });
		const input = uploader.createEl('input', {
			type: 'file',
			attr: { accept: 'image/*' },
		});
		input.addEventListener('change', () => {
			const file = input.files?.[0];
			if (file) void this.upload(file);
		});
		uploader.addEventListener('dragover', (event) => event.preventDefault());
		uploader.addEventListener('drop', (event) => {
			event.preventDefault();
			const file = event.dataTransfer?.files[0];
			if (file) void this.upload(file);
		});

		new Setting(this.containerEl)
			.setName('啟動時開啟')
			.setDesc('Obsidian 啟動時自動在主工作區開啟 Dashboard。')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.openOnStartup).onChange(async (value) => {
					this.plugin.settings.openOnStartup = value;
					await this.plugin.saveSettings();
				}),
			);
	}

	private async upload(file: File): Promise<void> {
		const folderPath = normalizePath('附件/OM Dashboard');
		await this.ensureFolder(folderPath);
		const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '.png';
		const base = normalizePath(`${folderPath}/banner`);
		let path = `${base}${ext}`;
		let index = 1;
		while (this.app.vault.getAbstractFileByPath(path)) {
			path = `${base}-${index}${ext}`;
			index += 1;
		}
		try {
			await this.app.vault.createBinary(path, await file.arrayBuffer());
			this.plugin.settings.headerBackground = path;
			await this.plugin.saveSettings();
			this.plugin.rebuildViews();
			new Notice('頁首背景圖已更新');
			this.display();
		} catch (error) {
			new Notice(`上傳失敗：${String(error)}`);
		}
	}

	private async ensureFolder(path: string): Promise<void> {
		const parts = path.split('/');
		let current = '';
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (this.app.vault.getAbstractFileByPath(current) instanceof TFolder) continue;
			try {
				await this.app.vault.createFolder(current);
			} catch (error) {
				new Notice(`無法建立資料夾 ${current}：${String(error)}`);
			}
		}
	}
}
