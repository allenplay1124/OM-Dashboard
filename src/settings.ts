import { LanguageSetting } from './i18n';

export interface OMDashboardSettings {
	notesRoot: string;
	headerBackground: string;
	openOnStartup: boolean;
	language: LanguageSetting;
	nickname: string;
	accentColor: string;
}

export const DEFAULT_SETTINGS: OMDashboardSettings = {
	notesRoot: '',
	headerBackground: '',
	openOnStartup: true,
	language: 'auto',
	nickname: '',
	accentColor: '#65B2AB',
};
