export interface OMDashboardSettings {
	notesRoot: string;
	headerBackground: string;
	openOnStartup: boolean;
}

export const DEFAULT_SETTINGS: OMDashboardSettings = {
	notesRoot: '',
	headerBackground: '',
	openOnStartup: true,
};
