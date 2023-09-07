import {
	IAuthenticateGeneric,
	//ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AzureMessageBusNodeApi implements ICredentialType {
	name = 'azureMessageBusNodeApi';
	displayName = 'Azure Message Bus  API';
	documentationUrl = 'https://test.com';
	properties: INodeProperties[] = [
		{
			displayName: 'Service Bus Connection String',
			name: 'connectionString',
			type: 'string',
			default: 'Endpoint=sb://<HOSTNAME>.servicebus.windows.net/;SharedAccessKeyName=XXXXXXX;SharedAccessKey=XXXXXXXXXX;',
			hint: 'Note the ; at the end'
		},
		{
			displayName: 'QueueName',
			name: 'qName',
			type: 'string',
			default: 'dev-q-name',
			hint: 'queuname on the service bus connections'
		},
	];

	// This allows the credential to be used by other parts of n8n
	// stating how this credential is injected as part of the request
	// An example is the Http Request node that can make generic calls
	// reusing this credential
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.token}}',
			},
		},
	};

	// The block below tells how this credential can be tested
	//test: ICredentialTestRequest = {
	//	request: {
	//		baseURL: '={{$credentials?.domain}}',
//			url: '/bearer',
//		},



//	};
}
