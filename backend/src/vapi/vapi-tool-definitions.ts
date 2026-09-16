export interface VapiToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export const VAPI_TOOL_DEFINITIONS: VapiToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'update_lead',
      description:
        'Update the lead record with information extracted from the conversation so far (products, budget, timeline, features, decision maker status, etc.)',
      parameters: {
        type: 'object',
        properties: {
          callId: { type: 'string', description: 'Internal MongoDB call ID' },
          name: { type: 'string', description: 'Customer name if provided' },
          productDescription: { type: 'string', description: 'What products the customer sells' },
          productCount: { type: 'number', description: 'Approximate number of products' },
          budget: { type: 'number', description: 'Budget amount if mentioned' },
          currency: { type: 'string', description: 'Currency code e.g. INR, USD' },
          timeline: { type: 'string', description: 'Expected timeline' },
          requiredFeatures: { type: 'array', items: { type: 'string' } },
          painPoints: { type: 'array', items: { type: 'string' } },
          isDecisionMaker: { type: 'boolean' },
          barriers: { type: 'array', items: { type: 'string' } },
          objections: { type: 'array', items: { type: 'string' } },
          buyingSignals: { type: 'array', items: { type: 'string' } },
          language: { type: 'string', description: 'Detected conversation language' },
        },
        required: ['callId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_whatsapp',
      description:
        'Send a personalized WhatsApp message to the customer during the active call. Use this only when the customer shows high buying intent (HOT lead). Never call this more than once per lead.',
      parameters: {
        type: 'object',
        properties: {
          callId: { type: 'string', description: 'Internal MongoDB call ID' },
          messageContent: {
            type: 'string',
            description: 'The personalized WhatsApp message referencing actual conversation details',
          },
        },
        required: ['callId', 'messageContent'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_callback',
      description:
        'Schedule a callback when the customer requests one. Extract the requested time in natural language (e.g. "tomorrow morning", "kal evening", "next Monday afternoon").',
      parameters: {
        type: 'object',
        properties: {
          callId: { type: 'string', description: 'Internal MongoDB call ID' },
          requestedTime: {
            type: 'string',
            description: 'Natural-language time phrase from the customer',
          },
          reason: { type: 'string', description: 'Reason for callback if mentioned' },
        },
        required: ['callId', 'requestedTime'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_lead_context',
      description: 'Retrieve the current lead context for the active call, including extracted info and qualification state.',
      parameters: {
        type: 'object',
        properties: {
          callId: { type: 'string', description: 'Internal MongoDB call ID' },
        },
        required: ['callId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'end_call',
      description: 'End the current call. Call this when the conversation has reached a natural conclusion or the customer requests to end.',
      parameters: {
        type: 'object',
        properties: {
          callId: { type: 'string', description: 'Internal MongoDB call ID' },
          summary: { type: 'string', description: 'Brief summary of why the call is ending' },
        },
        required: ['callId'],
      },
    },
  },
];
