export interface IPCData {
	command: string;
	[key: string]: any;
}

export type StflyResult = StflyResultSuccess | StflyResultFail;

export interface StflyResultSuccess {
	status: 'success';
	message: string;
	url: string;
}

export interface StflyResultFail {
	message: string;
}
