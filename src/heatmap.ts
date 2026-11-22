import { App } from 'obsidian';
import { Lang } from './i18n';
import { OMDashboardSettings } from './settings';

const WEEKS = 53;

export function collectHeatmap(app: App, settings: OMDashboardSettings): {
	buckets: number[];
	start: Date;
	total: number;
} {
	const root = settings.notesRoot.trim().replace(/^\/+|\/+$/g, '');
	const prefix = root ? `${root}/` : '';

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const start = new Date(today);
	start.setDate(start.getDate() - start.getDay() - (WEEKS - 1) * 7);

	const buckets = new Array<number>(WEEKS * 7).fill(0);
	let total = 0;

	for (const file of app.vault.getMarkdownFiles()) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		if (frontmatter?.['pm-project'] === true || frontmatter?.['pm-task'] === true) continue;
		if (prefix && !file.path.startsWith(prefix)) continue;

		const d = new Date(file.stat.ctime);
		d.setHours(0, 0, 0, 0);
		if (d < start || d > today) continue;
		const idx = Math.round((d.getTime() - start.getTime()) / 86400000);
		if (idx >= 0 && idx < buckets.length) {
			buckets[idx] = (buckets[idx] ?? 0) + 1;
			total++;
		}
	}

	return { buckets, start, total };
}

export function renderHeatmap(
	container: HTMLElement,
	buckets: number[],
	start: Date,
	total: number,
	lang: 'zh-TW' | 'zh-CN' | 'en',
	t: (lang: Lang, key: string) => string,
): void {
	container.empty();
	container.createDiv({ cls: 'om-card-title', text: t(lang, 'heatmap') });

	if (total === 0) {
		container.createDiv({ cls: 'om-heatmap-empty', text: t(lang, 'heatmapEmpty') });
		return;
	}

	const nonzero = buckets.filter((b) => b > 0);
	const sorted = [...nonzero].sort((a, b) => a - b);
	const quantile = (q: number): number => {
		if (sorted.length === 0) return 0;
		const pos = (sorted.length - 1) * q;
		const lo = Math.floor(pos);
		const hi = Math.ceil(pos);
		if (lo === hi) return sorted[lo]!;
		return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
	};
	const q1 = quantile(0.25);
	const q2 = quantile(0.5);
	const q3 = quantile(0.75);
	const levelOf = (n: number): number => {
		if (n === 0) return 0;
		if (n <= q1) return 1;
		if (n <= q2) return 2;
		if (n <= q3) return 3;
		return 4;
	};

	const wrap = container.createDiv({ cls: 'om-heatmap-wrap' });

	// Month labels
	const monthsEl = wrap.createDiv({ cls: 'om-heatmap-months' });
	const shortMonth = (d: Date): string =>
		d.toLocaleDateString(lang === 'zh-CN' ? 'zh-CN' : lang === 'zh-TW' ? 'zh-TW' : 'en', { month: 'short' });
	let lastMonth = -1;
	for (let w = 0; w < WEEKS; w++) {
		const d = new Date(start);
		d.setDate(d.getDate() + w * 7);
		const m = d.getMonth();
		if (m !== lastMonth) {
			const span = monthsEl.createSpan({ cls: 'om-heatmap-month', text: shortMonth(d) });
			span.style.gridColumn = String(w + 1);
			lastMonth = m;
		}
	}

	// Grid: column-major (each column = one week, 7 rows = Sun..Sat)
	const grid = wrap.createDiv({ cls: 'om-heatmap-grid' });
	const dayMs = 86400000;
	for (let i = 0; i < buckets.length; i++) {
		const n = buckets[i] ?? 0;
		const d = new Date(start.getTime() + i * dayMs);
		const cell = grid.createDiv({ cls: `om-heatmap-cell om-heatmap-l${levelOf(n)}` });
		cell.setAttr('title', `${d.toISOString().slice(0, 10)} · ${n}`);
	}

	container.createDiv({ cls: 'om-heatmap-total', text: t(lang, 'heatmapTotal').replace('{n}', String(total)) });
}