import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';



import {
	sendMessage,
} from './GenericFunctions';
import { AzMBModels } from './models';
import { ServiceBusClient } from '@azure/service-bus';


export class AzureMessageBusNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Azure Message Bus Node',
		name: 'azureMessageBusNode',
		group: ['transform'],
		version: 1,
		icon: 'file:azure.svg',
		description: 'Basic Azure Message Bus Node',
		defaults: {
			name: 'Azure Message Bus Node',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'azureMessageBusNodeApi',
				required: false,
			},
		],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.

			{
				displayName: 'Event Name',
				name: 'event',
				type: 'string',
				default: '',
				placeholder: 'event-name',
				description: 'Event defined on the event bus',
			},
			{
				displayName: 'Data',
				name: 'data',
				type: 'string',
				default: '',
				placeholder: '',
				description: 'Data in JSON format',
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		//let item: INodeExecutionData;


		const credentials = await this.getCredentials('azureMessageBusNodeApi') as AzMBModels.Credentials;
		let connectionString  =  credentials.connectionString;


	const endpointUri: string = connectionString + 'EntityPath=' + credentials.qName;

	const serviceBusClient = new ServiceBusClient(endpointUri);

	const sender = serviceBusClient.createSender ( credentials.qName);

		const returnData: IDataObject[] = [];
		let responseData;
		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {

				let event = this.getNodeParameter('event', itemIndex, '') as string;
				let data = this.getNodeParameter('data', itemIndex, '') as string;

				//item = items[itemIndex];
				console.log(itemIndex +":" + event + ":" + data);
				let itemData = {"event":event, "data":data};
				let sendItem = [];
				sendItem.push({body:itemData})

				responseData = await sendMessage.call( this,  sender, sendItem);
				console.log("AFTER" + itemIndex);

				returnData.push(responseData as IDataObject);

			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(items);
	}
}
