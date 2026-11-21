import { App, ItemView, Notice, setIcon, TFile, WorkspaceLeaf } from 'obsidian';
import { countDashboard, DashboardCounts } from './counters';
import { OMDashboardSettings } from './settings';

export const VIEW_TYPE_OM_DASHBOARD = 'om-dashboard';

type CommandApp = App & {
	commands: { executeCommandById(id: string): Promise<void> };
};

export class OMDashboardView extends ItemView {
	private readonly settings: OMDashboardSettings;
	private lastCounts?: DashboardCounts;
	private statValues: HTMLElement[] = [];

	constructor(leaf: WorkspaceLeaf, settings: OMDashboardSettings) {
		super(leaf);
		this.settings = settings;
	}

	getViewType(): string {
		return VIEW_TYPE_OM_DASHBOARD;
	}

	getDisplayText(): string {
		return 'OM Dashboard';
	}

	getIcon(): string {
		return 'layout-dashboard';
	}

	async onOpen(): Promise<void> {
		this.rebuild();
	}

	/* Rebuild only for settings/date changes; count changes update text in place. */
	rebuild(): void {
		this.render();
	}

	refresh(): void {
		const counts = countDashboard(this.app, this.settings.notesRoot);
		const previous = this.lastCounts;
		if (
			this.statValues.length === 3 &&
			previous &&
			counts.notes === previous.notes &&
			counts.projects === previous.projects &&
			counts.tasks === previous.tasks
		) {
			return;
		}
		this.lastCounts = counts;
		if (this.statValues.length === 3) {
			const values = [counts.notes, counts.projects, counts.tasks];
			for (let index = 0; index < 3; index += 1) {
				this.statValues[index]!.textContent = String(values[index]);
			}
		} else {
			this.render();
		}
	}

	private render(): void {
		const root = this.contentEl;
		root.empty();
		root.addClass('om-dashboard');

		this.renderHero(root);
		const cards = root.createDiv({ cls: 'om-cards' });
		this.renderDateCard(cards.createDiv({ cls: 'om-card om-date-card' }));
		this.renderActionsCard(cards.createDiv({ cls: 'om-card om-actions-card' }));
		this.renderStatsCard(cards.createDiv({ cls: 'om-card om-stats-card' }));
	}

	private renderHero(root: HTMLElement): void {
		const hero = root.createDiv({ cls: 'om-hero' });
		if (this.settings.headerBackground) {
			const file = this.app.vault.getAbstractFileByPath(this.settings.headerBackground);
			if (file instanceof TFile) {
				hero.style.backgroundImage = `url("${this.app.vault.getResourcePath(file)}")`;
			}
		}

		const search = hero.createDiv({ cls: 'om-search' });
		setIcon(search, 'search');
		const input = search.createEl('input', {
			type: 'search',
			placeholder: '搜尋筆記…',
			attr: { 'aria-label': '搜尋筆記' },
		});
		input.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter') return;
			void this.openSearch(input.value.trim());
		});
	}

	private async openSearch(query: string): Promise<void> {
		await (this.app as CommandApp).commands.executeCommandById('global-search:open');
		const leaf = this.app.workspace.getLeavesOfType('search')[0];
		if (leaf) {
			const view = leaf.view as unknown as { setQuery?: (q: string) => void };
			view.setQuery?.(query);
		}
	}

	private renderDateCard(card: HTMLElement): void {
		const now = new Date();
		card.createSpan({ cls: 'om-date-year', text: String(now.getFullYear()) });
		card.createSpan({
			cls: 'om-date-month',
			text: String(now.getMonth() + 1).padStart(2, '0'),
		});
		card.createDiv({ cls: 'om-date-day', text: String(now.getDate()).padStart(2, '0') });
		card.createDiv({
			cls: 'om-date-weekday',
			text: `星期${'日一二三四五六'[now.getDay()] ?? ''}`,
		});
	}

	private renderActionsCard(card: HTMLElement): void {
		card.createDiv({ cls: 'om-card-title', text: '快速新增' });
		const actions: Array<[string, string, () => void | Promise<void>]> = [
			['file-plus', '新增筆記', () => this.createNote()],
			['folder-plus', '新增專案', () => this.runDotpm('new-project')],
			['checkbox', '新增任務', () => this.runDotpm('new-task')],
		];
		for (const [icon, label, action] of actions) {
			const button = card.createEl('button', { cls: 'om-action' });
			setIcon(button, icon);
			button.appendText(label);
			button.addEventListener('click', () => void action());
		}
	}

	private renderStatsCard(card: HTMLElement): void {
		const counts = countDashboard(this.app, this.settings.notesRoot);
		this.lastCounts = counts;
		this.statValues = [];
		card.createDiv({ cls: 'om-card-title', text: '統計' });
		const rows: Array<[string, number]> = [
			['筆記', counts.notes],
			['專案', counts.projects],
			['任務', counts.tasks],
		];
		for (const [label, value] of rows) {
			const row = card.createDiv({ cls: 'om-stat' });
			row.createSpan({ cls: 'om-stat-label', text: label });
			this.statValues.push(row.createSpan({ cls: 'om-stat-value', text: String(value) }));
		}
	}

	private async createNote(): Promise<void> {
		const folder = this.settings.notesRoot.trim().replace(/^\/+|\/+$/g, '');
		const base = folder ? `${folder}/未命名` : '未命名';
		let path = `${base}.md`;
		let index = 1;
		while (this.app.vault.getAbstractFileByPath(path)) {
			path = `${base} ${index}.md`;
			index += 1;
		}
		try {
			const file = await this.app.vault.create(path, '');
			await this.app.workspace.getLeaf(false).openFile(file);
		} catch (error) {
			new Notice(`無法建立筆記：${String(error)}`);
		}
	}

	private async runDotpm(command: 'new-project' | 'new-task'): Promise<void> {
		try {
			await (this.app as CommandApp).commands.executeCommandById(`project-manager:${command}`);
		} catch (error) {
			new Notice(`無法執行 dotpm 指令：${String(error)}`);
		}
	}
}
