import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { ServiceBusClient, ServiceBusMessage } from '@azure/service-bus';

export class AzureMessageBusNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Azure Message Bus Node',
		name: 'azureMessageBusNode',
		icon: 'file:azure.svg',
		group: ['transform'],
		version: 1,
		description: 'Sends and receives messages from Azure Service Bus',
		defaults: {
			name: 'Azure Service Bus',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			// Credenciais ou Connection String
			{
				displayName: 'Connection String',
				name: 'connectionString',
				type: 'string',
				default: '',
				required: true,
				description: 'Connection string para se autenticar no Azure Service Bus',
			},
			// Queue ou Topic
			{
				displayName: 'Queue or Topic Name',
				name: 'queueOrTopic',
				type: 'string',
				default: '',
				required: true,
				description: 'Nome da fila (queue) ou do tópico (topic) no Azure Service Bus',
			},
			// Subscription Name (apenas se for Topic)
			{
				displayName: 'Subscription Name (Se for Tópico)',
				name: 'subscriptionName',
				type: 'string',
				default: '',
				description: 'Nome da Subscription (caso esteja usando tópicos). Deixe vazio se for fila.',
			},
			// Operation: send ou receive
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send',
						value: 'send',
					},
					{
						name: 'Receive',
						value: 'receive',
					},
				],
				default: 'send',
				description: 'Escolha a operação: enviar ou receber mensagens',
			},
			// Propriedade(s) específica(s) para a operação SEND
			{
				displayName: 'Message Body',
				name: 'messageBody',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'send',
						],
					},
				},
				description: 'Conteúdo da mensagem a ser enviada',
			},
			// Propriedade(s) específica(s) para a operação RECEIVE
			{
				displayName: 'Maximum Number of Messages',
				name: 'maxMessages',
				type: 'number',
				default: 1,
				displayOptions: {
					show: {
						operation: [
							'receive',
						],
					},
				},
				description: 'Quantidade máxima de mensagens para receber em uma única requisição',
			},
			{
				displayName: 'Max Wait Time (Ms)',
				name: 'maxWaitTime',
				type: 'number',
				default: 5000,
				displayOptions: {
					show: {
						operation: [
							'receive',
						],
					},
				},
				description: 'Tempo máximo (em milissegundos) para aguardar mensagens antes de encerrar a requisição',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {

		// const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Obtenção dos parâmetros
		const connectionString = this.getNodeParameter('connectionString', 0) as string;
		const queueOrTopic = this.getNodeParameter('queueOrTopic', 0) as string;
		const subscriptionName = this.getNodeParameter('subscriptionName', 0, '') as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Inicia o cliente de Service Bus
		const sbClient = new ServiceBusClient(connectionString);

		try {
			if (operation === 'send') {
				// Recuperar a mensagem do campo 'messageBody'
				const messageBody = this.getNodeParameter('messageBody', 0) as string;

				// Caso seja fila
				if (!subscriptionName) {
					const sender = sbClient.createSender(queueOrTopic);
					const message: ServiceBusMessage = {
						body: messageBody,
					};
					await sender.sendMessages(message);
					await sender.close();

					returnData.push({
						json: {
							success: true,
							operation: 'send',
							queueOrTopic,
							messageSent: messageBody,
						},
					});
				} else {
					// Caso seja tópico
					const sender = sbClient.createSender(queueOrTopic);
					const message: ServiceBusMessage = {
						body: messageBody,
					};
					await sender.sendMessages(message);
					await sender.close();

					returnData.push({
						json: {
							success: true,
							operation: 'send',
							topic: queueOrTopic,
							subscriptionName,
							messageSent: messageBody,
						},
					});
				}
			} else if (operation === 'receive') {
				// Receber mensagens da fila ou do tópico+subscription
				const maxMessages = this.getNodeParameter('maxMessages', 0) as number;
				const maxWaitTime = this.getNodeParameter('maxWaitTime', 0) as number;

				let messages;
				if (!subscriptionName) {
					// Fila
					const receiver = sbClient.createReceiver(queueOrTopic);
					messages = await receiver.receiveMessages(maxMessages, {
						maxWaitTimeInMs: maxWaitTime,
					});

					// Confirma o processamento das mensagens recebidas
					for (const msg of messages) {
						await receiver.completeMessage(msg);
					}
					await receiver.close();
				} else {
					// Tópico + Subscription
					const receiver = sbClient.createReceiver(queueOrTopic, subscriptionName);
					messages = await receiver.receiveMessages(maxMessages, {
						maxWaitTimeInMs: maxWaitTime,
					});

					// Confirma o processamento das mensagens recebidas
					for (const msg of messages) {
						await receiver.completeMessage(msg);
					}
					await receiver.close();
				}

				// Monta o retorno
				returnData.push({
					json: {
						success: true,
						operation: 'receive',
						queueOrTopic,
						subscriptionName,
						messagesReceived: messages.map((m) => m.body),
					},
				});
			}
		} catch (error) {
			// Em caso de erro, você pode lançar a exceção para o n8n tratar
			// eslint-disable-next-line n8n-nodes-base/node-execute-block-wrong-error-thrown
			throw new Error(`Erro ao executar a operação '${operation}': ${error.message}`);
		} finally {
			await sbClient.close();
		}

		return [returnData];
	}
}
