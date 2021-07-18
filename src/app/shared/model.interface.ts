export interface IPCData {
	command: string;
	[key: string]: any;
}

export type StflyResult = Yes | No;

export interface Yes {
	success: true;
	message: string;
	url: string;
}

export interface No {
	success: false;
	message: string;
}
