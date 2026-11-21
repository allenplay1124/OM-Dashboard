import { Plugin } from 'obsidian';
import { resolveLanguage, t } from './i18n';
import { DEFAULT_SETTINGS, OMDashboardSettings } from './settings';
import { OMDashboardSettingTab } from './settingsTab';
import { OMDashboardView, VIEW_TYPE_OM_DASHBOARD } from './view';

export default class OMDashboardPlugin extends Plugin {
	settings!: OMDashboardSettings;
	private refreshTimer?: number;

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_OM_DASHBOARD, (leaf) => new OMDashboardView(leaf, this.settings));

		const openLabel = t(resolveLanguage(this.settings.language), 'openDashboard');
		this.addRibbonIcon('layout-dashboard', openLabel, () => {
			void this.openDashboard();
		});
		this.addCommand({
			id: 'open-dashboard',
			name: openLabel,
			callback: () => void this.openDashboard(),
		});
		this.addSettingTab(new OMDashboardSettingTab(this.app, this));

		this.registerEvent(this.app.vault.on('create', () => this.refreshViews()));
		this.registerEvent(this.app.vault.on('delete', () => this.refreshViews()));
		this.registerEvent(this.app.vault.on('rename', () => this.refreshViews()));
		this.registerEvent(this.app.metadataCache.on('changed', () => this.refreshViews()));

		this.app.workspace.onLayoutReady(() => {
			if (this.settings.openOnStartup && !this.app.workspace.getLeavesOfType(VIEW_TYPE_OM_DASHBOARD).length) {
				void this.openDashboard(true);
			}
		});
	}

	onunload() {
		if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<OMDashboardSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	refreshViews(): void {
		this.scheduleViewUpdate(false);
	}

	rebuildViews(): void {
		this.scheduleViewUpdate(true);
	}

	private scheduleViewUpdate(rebuild: boolean): void {
		if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_OM_DASHBOARD)) {
				const view = leaf.view as OMDashboardView;
				if (rebuild) view.rebuild();
				else view.refresh();
			}
		}, 1000);
	}

	private async openDashboard(newTab = false): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_OM_DASHBOARD)[0];
		const leaf = existing ?? this.app.workspace.getLeaf(newTab ? 'tab' : false);
		await leaf.setViewState({ type: VIEW_TYPE_OM_DASHBOARD, active: true });
	}
}
