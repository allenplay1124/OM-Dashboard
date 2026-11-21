import { App } from 'obsidian';

export interface DashboardCounts {
	notes: number;
	projects: number;
	tasks: number;
}

export function countDashboard(app: App, notesRoot: string): DashboardCounts {
	const root = notesRoot.trim().replace(/^\/+|\/+$/g, '');
	const prefix = root ? `${root}/` : '';
	let notes = 0;
	let projects = 0;
	let tasks = 0;

	for (const file of app.vault.getMarkdownFiles()) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		if (frontmatter?.['pm-project'] === true) {
			projects += 1;
		} else if (frontmatter?.['pm-task'] === true) {
			tasks += 1;
		} else if (!prefix || file.path.startsWith(prefix)) {
			notes += 1;
		}
	}

	return { notes, projects, tasks };
}
