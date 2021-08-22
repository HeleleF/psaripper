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

export interface ErrorResponse {
	response: null;
	err: true;
}

export interface SuccessResponse<T> {
	response: T;
	err: false;
}

export type BaseResponse<T> = ErrorResponse | SuccessResponse<T>;
