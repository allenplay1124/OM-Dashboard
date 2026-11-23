import {
	App,
	Notice,
	normalizePath,
	Plugin,
	PluginSettingTab,
	Setting,
	TFolder,
} from 'obsidian';
import { LANGUAGE_OPTIONS, resolveLanguage, t } from './i18n';
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
		const lang = resolveLanguage(this.plugin.settings.language);
		new Setting(this.containerEl).setName(t(lang, 'settingsHeading')).setHeading();

		new Setting(this.containerEl)
			.setName(t(lang, 'language'))
			.setDesc(t(lang, 'languageDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(Object.fromEntries(LANGUAGE_OPTIONS.map((o) => [o.value, o.label])))
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value as OMDashboardSettings['language'];
						await this.plugin.saveSettings();
						this.plugin.rebuildViews();
						this.display();
					}),
			);

		new Setting(this.containerEl)
			.setName(t(lang, 'nickname'))
			.setDesc(t(lang, 'nicknameDesc'))
			.addText((text) =>
				text
					.setValue(this.plugin.settings.nickname)
					.onChange(async (value) => {
						this.plugin.settings.nickname = value.trim();
						await this.plugin.saveSettings();
						this.plugin.rebuildViews();
					}),
			);

		new Setting(this.containerEl)
			.setName(t(lang, 'notesRoot'))
			.setDesc(t(lang, 'notesRootDesc'))
			.addText((text) =>
				text
					.setPlaceholder(t(lang, 'notesRootPlaceholder'))
					.setValue(this.plugin.settings.notesRoot)
					.onChange(async (value) => {
						this.plugin.settings.notesRoot = value.trim();
						await this.plugin.saveSettings();
						this.plugin.rebuildViews();
					}),
			);

		new Setting(this.containerEl)
			.setName(t(lang, 'headerBackground'))
			.setDesc(t(lang, 'headerBackgroundDesc'))
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
		uploader.createSpan({ text: t(lang, 'uploadHint') });
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
			.setName(t(lang, 'openOnStartup'))
			.setDesc(t(lang, 'openOnStartupDesc'))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.openOnStartup).onChange(async (value) => {
					this.plugin.settings.openOnStartup = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(this.containerEl)
			.setName(t(lang, 'dependentPlugins'))
			.addButton((btn) =>
				btn
					.setButtonText('dotpm')
					.setCta()
					.onClick(() => {
						window.open('https://community.obsidian.md/plugins/project-manager', '_blank');
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
			new Notice(t(resolveLanguage(this.plugin.settings.language), 'headerUpdated'));
			this.display();
		} catch (error) {
			new Notice(`${t(resolveLanguage(this.plugin.settings.language), 'uploadFailed')}${String(error)}`);
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
				new Notice(`${t(resolveLanguage(this.plugin.settings.language), 'cannotCreateFolder')}${current}：${String(error)}`);
			}
		}
	}
}
