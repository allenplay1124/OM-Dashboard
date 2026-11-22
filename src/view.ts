import { App, ItemView, Notice, setIcon, TFile, WorkspaceLeaf } from 'obsidian';
import { countDashboard, DashboardCounts } from './counters';
import { DotpmOption, readDotpmMeta } from './dotpm';
import { Lang, resolveLanguage, t, weekdays } from './i18n';
import { OMDashboardSettings } from './settings';
import { collectHeatmap, renderHeatmap } from './heatmap';
import { collectGraph, mountGraph } from './graph';

export const VIEW_TYPE_OM_DASHBOARD = 'om-dashboard';

type CommandApp = App & {
	commands: { executeCommandById(id: string): Promise<void> };
};

export class OMDashboardView extends ItemView {
	private readonly settings: OMDashboardSettings;
	private lastCounts?: DashboardCounts;
	private lastSignature?: string;
	private cleanups: Array<() => void> = [];

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

	async onClose(): Promise<void> {
		for (const fn of this.cleanups) fn();
		this.cleanups = [];
	}

	/* Rebuild only for settings/date changes; count changes update text in place. */
	rebuild(): void {
		this.render();
	}

	refresh(): void {
		const counts = countDashboard(this.app, this.settings.notesRoot);
		const heatmap = collectHeatmap(this.app, this.settings);
		const graph = collectGraph(this.app, this.settings);
		const signature = JSON.stringify(counts) + '|' + JSON.stringify(heatmap.buckets) + '|' + graph.nodes.length + '|' + graph.links.length;
		if (this.lastSignature && signature === this.lastSignature) return;
		this.lastSignature = signature;
		this.lastCounts = counts;
		this.render();
	}

	private render(): void {
		for (const fn of this.cleanups) fn();
		this.cleanups = [];

		const root = this.contentEl;
		root.empty();
		root.addClass('om-dashboard');
		const lang = resolveLanguage(this.settings.language);

		this.renderHero(root, lang);
		const cards = root.createDiv({ cls: 'om-cards' });
		this.renderDateCard(cards.createDiv({ cls: 'om-card om-date-card' }), lang);
		this.renderActionsCard(cards.createDiv({ cls: 'om-card om-actions-card' }), lang);
		this.renderStatsCard(cards.createDiv({ cls: 'om-card om-stats-card' }), lang);

		const heatmapCard = cards.createDiv({ cls: 'om-card om-heatmap-card' });
		const heatmapData = collectHeatmap(this.app, this.settings);
		renderHeatmap(heatmapCard, heatmapData.buckets, heatmapData.start, heatmapData.total, lang, t);

		const graphCard = cards.createDiv({ cls: 'om-card om-graph-card' });
		const graphData = collectGraph(this.app, this.settings);
		const destroy = mountGraph(graphCard, graphData, this.app, lang, t);
		this.cleanups.push(destroy);
	}

	private renderHero(root: HTMLElement, lang: Lang): void {
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
			placeholder: t(lang, 'searchPlaceholder'),
			attr: { 'aria-label': t(lang, 'searchAria') },
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

	private renderDateCard(card: HTMLElement, lang: Lang): void {
		const now = new Date();
		card.createSpan({ cls: 'om-date-year', text: String(now.getFullYear()) });
		card.createSpan({
			cls: 'om-date-month',
			text: String(now.getMonth() + 1).padStart(2, '0'),
		});
		card.createDiv({ cls: 'om-date-day', text: String(now.getDate()).padStart(2, '0') });
		card.createDiv({
			cls: 'om-date-weekday',
			text: weekdays(lang)[now.getDay()] ?? '',
		});
	}

	private renderActionsCard(card: HTMLElement, lang: Lang): void {
		card.createDiv({ cls: 'om-card-title', text: t(lang, 'quickAdd') });
		const actions: Array<[string, string, () => void | Promise<void>]> = [
			['file-plus', t(lang, 'newNote'), () => this.createNote(lang)],
			['folder-plus', t(lang, 'newProject'), () => this.runDotpm('new-project', lang)],
			['checkbox', t(lang, 'newTask'), () => this.runDotpm('new-task', lang)],
		];
		for (const [icon, label, action] of actions) {
			const button = card.createEl('button', { cls: 'om-action' });
			setIcon(button, icon);
			button.appendText(label);
			button.addEventListener('click', () => void action());
		}
	}

	private renderStatsCard(card: HTMLElement, lang: Lang): void {
		const counts = countDashboard(this.app, this.settings.notesRoot);
		this.lastCounts = counts;
		card.createDiv({ cls: 'om-card-title', text: t(lang, 'stats') });

		const primary = card.createDiv({ cls: 'om-stat-primary' });
		const figures: Array<[string, number]> = [
			[t(lang, 'notes'), counts.notes],
			[t(lang, 'projects'), counts.projects],
			[t(lang, 'tasks'), counts.tasks],
		];
		for (const [label, value] of figures) {
			const figure = primary.createDiv({ cls: 'om-stat-figure' });
			figure.createSpan({ cls: 'om-stat-value', text: String(value) });
			figure.createSpan({ cls: 'om-stat-label', text: label });
		}

		const breakdowns = card.createDiv({ cls: 'om-stat-breakdowns' });
		if (counts.tasks === 0) {
			breakdowns.createDiv({ cls: 'om-stat-empty', text: t(lang, 'noTasks') });
			return;
		}

		const meta = readDotpmMeta(this.app);
		const renderGroup = (title: string, data: Record<string, number>, options: DotpmOption[]) => {
			const group = breakdowns.createDiv({ cls: 'om-stat-group' });
			group.createDiv({ cls: 'om-stat-group-title', text: title });

			const order = new Map(options.map((option, index) => [option.id, index]));
			const optionById = new Map(options.map((option) => [option.id, option]));
			const rows = Object.entries(data)
				.filter(([, value]) => value > 0)
				.sort((a, b) => {
					const ai = order.get(a[0]);
					const bi = order.get(b[0]);
					if (ai !== undefined && bi !== undefined) return ai - bi;
					if (ai !== undefined) return -1;
					if (bi !== undefined) return 1;
					return b[1] - a[1];
				});

			for (const [key, value] of rows) {
				const option = optionById.get(key);
				const row = group.createDiv({ cls: 'om-stat-row' });
				if (option?.color) {
					row.createSpan({ cls: 'om-stat-dot' }).style.backgroundColor = option.color;
				}
				const label = key === 'unset' ? t(lang, 'unset') : option?.label ?? key;
				row.createSpan({ cls: 'om-stat-label', text: label });
				row.createDiv({ cls: 'om-stat-leader' });
				row.createSpan({ cls: 'om-stat-value', text: String(value) });
			}
		};
		renderGroup(t(lang, 'taskByStatus'), counts.taskByStatus, meta?.statuses ?? []);
		renderGroup(t(lang, 'taskByPriority'), counts.taskByPriority, meta?.priorities ?? []);
	}

	private async createNote(lang: Lang): Promise<void> {
		const folder = this.settings.notesRoot.trim().replace(/^\/+|\/+$/g, '');
		const base = folder ? `${folder}/${t(lang, 'unnamed')}` : t(lang, 'unnamed');
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
			new Notice(`${t(lang, 'cannotCreateNote')}${String(error)}`);
		}
	}

	private async runDotpm(command: 'new-project' | 'new-task', lang: Lang): Promise<void> {
		try {
			await (this.app as CommandApp).commands.executeCommandById(`project-manager:${command}`);
		} catch (error) {
			new Notice(`${t(lang, 'cannotRunDotpm')}${String(error)}`);
		}
	}
}
