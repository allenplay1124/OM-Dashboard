import { App } from 'obsidian';

export interface DashboardCounts {
	notes: number;
	projects: number;
	tasks: number;
	taskByStatus: Record<string, number>;
	taskByPriority: Record<string, number>;
}

export function countDashboard(app: App, notesRoot: string): DashboardCounts {
	const root = notesRoot.trim().replace(/^\/+|\/+$/g, '');
	const prefix = root ? `${root}/` : '';
	let notes = 0;
	let projects = 0;
	let tasks = 0;
	const taskByStatus: Record<string, number> = {};
	const taskByPriority: Record<string, number> = {};

	for (const file of app.vault.getMarkdownFiles()) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		if (frontmatter?.['pm-project'] === true) {
			projects += 1;
		} else if (frontmatter?.['pm-task'] === true) {
			tasks += 1;
			const status = String(frontmatter?.['status'] ?? 'unset');
			const priority = String(frontmatter?.['priority'] ?? 'unset');
			taskByStatus[status] = (taskByStatus[status] ?? 0) + 1;
			taskByPriority[priority] = (taskByPriority[priority] ?? 0) + 1;
		} else if (!prefix || file.path.startsWith(prefix)) {
			notes += 1;
		}
	}

	return { notes, projects, tasks, taskByStatus, taskByPriority };
}
