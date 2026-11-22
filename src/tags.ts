import { App, getAllTags } from 'obsidian';
import { Lang } from './i18n';

export interface TagCount {
	tag: string;
	count: number;
}

const MIN_SIZE = 12;
const MAX_SIZE = 26;

export function collectTagCloud(app: App, limit = 40): TagCount[] {
	const counts = new Map<string, number>();

	for (const file of app.vault.getMarkdownFiles()) {
		const cache = app.metadataCache.getFileCache(file);
		if (!cache) continue;
		const tags = getAllTags(cache);
		if (!tags) continue;
		for (const tag of new Set(tags)) {
			if (!tag) continue;
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
		.slice(0, limit);
}

export function renderTagCloud(
	container: HTMLElement,
	tags: TagCount[],
	lang: Lang,
	t: (lang: Lang, key: string) => string,
	onOpen: (tag: string) => void,
): void {
	container.empty();
	container.createDiv({ cls: 'om-card-title', text: t(lang, 'tagCloud') });

	if (!tags.length) {
		container.createDiv({ cls: 'om-card-empty', text: t(lang, 'noTags') });
		return;
	}

	const counts = tags.map((item) => item.count);
	const max = Math.max(...counts);
	const min = Math.min(...counts);
	const span = max - min;

	const cloud = container.createDiv({ cls: 'om-tag-cloud' });
	tags.forEach((item, index) => {
		const ratio = span === 0 ? 0.5 : (item.count - min) / span;
		const size = MIN_SIZE + Math.sqrt(ratio) * (MAX_SIZE - MIN_SIZE);
		const hue = Math.round((index * 360) / Math.max(tags.length, 1));

		const button = cloud.createEl('button', {
			cls: 'om-tag',
			text: item.tag,
			attr: {
				'aria-label': `${t(lang, 'tagCloud')} ${item.tag}`,
				title: `${item.tag} · ${item.count}`,
			},
		});
		button.style.fontSize = `${size.toFixed(1)}px`;
		button.style.setProperty('--om-tag-hue', String(hue));
		button.addEventListener('click', () => onOpen(item.tag));
	});
}
