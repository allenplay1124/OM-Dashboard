import { App, TFile } from 'obsidian';
import { readDotpmMeta } from './dotpm';
import { OMDashboardSettings } from './settings';

export interface RecentNote {
	file: TFile;
	category: string;
	title: string;
}

export interface RecentTask {
	file: TFile;
	project: string;
	title: string;
	start: string;
	due: string;
	progress: string;
}

const FALLBACK_COMPLETE_STATUSES = new Set(['done', 'cancelled']);

function asText(value: unknown): string {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number') return String(value);
	return '';
}

/* "[[LVL專案|LVL專案]]" → "LVL專案"; plain strings pass through. */
function linkText(value: unknown): string {
	const text = asText(value);
	const match = text.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
	if (!match) return text;
	return (match[2] ?? match[1] ?? '').trim();
}

function formatDate(value: unknown): string {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10);
	}
	const text = asText(value);
	if (!text) return '';
	return text.slice(0, 10);
}

function formatProgress(value: unknown): string {
	const text = asText(value);
	if (!text) return '';
	const num = Number(text);
	if (Number.isNaN(num)) return '';
	return `${Math.round(num)}%`;
}

export function collectRecentNotes(
	app: App,
	settings: OMDashboardSettings,
	limit = 10,
): RecentNote[] {
	const root = settings.notesRoot.trim().replace(/^\/+|\/+$/g, '');
	const prefix = root ? `${root}/` : '';

	const notes = app.vault
		.getMarkdownFiles()
		.filter((file) => {
			const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
			if (frontmatter?.['pm-project'] === true || frontmatter?.['pm-task'] === true) return false;
			if (prefix && !file.path.startsWith(prefix)) return false;
			return true;
		})
		.sort((a, b) => b.stat.mtime - a.stat.mtime)
		.slice(0, limit);

	return notes.map((file) => {
		const parent = file.parent;
		const inRoot = !parent || parent.path === '/' || parent.path === root;
		return {
			file,
			category: inRoot ? '' : parent.name,
			title: file.basename,
		};
	});
}

export function collectRecentTasks(app: App, limit = 10): RecentTask[] {
	const meta = readDotpmMeta(app);
	const completeStatuses = new Set(FALLBACK_COMPLETE_STATUSES);
	for (const status of meta?.statuses ?? []) {
		if (status.complete) completeStatuses.add(status.id);
	}

	const tasks: RecentTask[] = [];
	for (const file of app.vault.getMarkdownFiles()) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		if (frontmatter?.['pm-task'] !== true) continue;
		const status = asText(frontmatter?.['status']);
		if (completeStatuses.has(status)) continue;

		const projectFolder = file.parent?.parent;
		const project =
			linkText(frontmatter?.['projectId']) ||
			(projectFolder && projectFolder.path !== '/' ? projectFolder.name : '');

		tasks.push({
			file,
			project,
			title: asText(frontmatter?.['title']) || file.basename,
			start: formatDate(frontmatter?.['start']),
			due: formatDate(frontmatter?.['due']),
			progress: formatProgress(frontmatter?.['progress']),
		});
	}

	tasks.sort((a, b) => {
		if (a.due && b.due) return a.due.localeCompare(b.due);
		if (a.due) return -1;
		if (b.due) return 1;
		return b.file.stat.mtime - a.file.stat.mtime;
	});

	return tasks.slice(0, limit);
}

/* Cheap change detector so the view can skip needless rerenders. */
export function recentSignature(notes: RecentNote[], tasks: RecentTask[]): string {
	const notePart = notes.map((note) => `${note.file.path}@${note.file.stat.mtime}`).join(',');
	const taskPart = tasks
		.map((task) => `${task.file.path}@${task.due}@${task.progress}@${task.title}`)
		.join(',');
	return `${notePart}|${taskPart}`;
}
