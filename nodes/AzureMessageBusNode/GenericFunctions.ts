import type { AzMBModels } from './models';
import {

	IExecuteFunctions,

	NodeApiError,
} from 'n8n-workflow';
const { ServiceBusClient } = require("@azure/service-bus");
export async function sendMessage(this: IExecuteFunctions,  queueName: string, message: any): Promise<any> { // tslint:disable-line:no-any


		const credentials = await this.getCredentials('azureMessageBusNodeApi') as AzMBModels.Credentials;
		let connectionString  =  credentials.connectionString;


	const endpointUri: string = connectionString + 'EntityPath=' + queueName;
	const serviceBusClient = new ServiceBusClient(endpointUri);

	const sender = serviceBusClient.createSender(queueName);
	let responseData;

	try {
		responseData = await sender.sendMessages (message);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
	return responseData;
}
