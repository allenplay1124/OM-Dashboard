import { App } from 'obsidian';

export interface DotpmOption {
	id: string;
	label: string;
	color?: string;
	complete?: boolean;
}

export interface DotpmMeta {
	statuses: DotpmOption[];
	priorities: DotpmOption[];
}

type DotpmHost = App & {
	plugins?: {
		plugins?: Record<string, { settings?: Record<string, unknown> }>;
	};
};

function parseOptions(value: unknown): DotpmOption[] {
	if (!Array.isArray(value)) return [];
	const options: DotpmOption[] = [];
	for (const item of value) {
		if (!item || typeof item !== 'object') continue;
		const { id, label, color, complete } = item as Record<string, unknown>;
		if (typeof id !== 'string' || typeof label !== 'string') continue;
		options.push({
			id,
			label,
			color: typeof color === 'string' ? color : undefined,
			complete: complete === true,
		});
	}
	return options;
}

/* dotpm exposes its live settings on its plugin instance; fall back to raw ids if absent. */
export function readDotpmMeta(app: App): DotpmMeta | null {
	const settings = (app as DotpmHost).plugins?.plugins?.['project-manager']?.settings;
	if (!settings) return null;
	const statuses = parseOptions(settings['statuses']);
	const priorities = parseOptions(settings['priorities']);
	if (!statuses.length && !priorities.length) return null;
	return { statuses, priorities };
}
