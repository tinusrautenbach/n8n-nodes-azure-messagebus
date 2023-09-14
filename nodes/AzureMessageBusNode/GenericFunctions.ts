import { ServiceBusSender } from '@azure/service-bus';

import {

	IExecuteFunctions,

	NodeApiError,
} from 'n8n-workflow';




export async function sendMessage(this: IExecuteFunctions,  sender : ServiceBusSender, message: any): Promise<any> { // tslint:disable-line:no-any


	let responseData;

	try {
		responseData = await sender.sendMessages (message);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
	return responseData;
}
