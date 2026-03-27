


/*
Anthropic Error (JSON) message:
{
    "status": 400,
    "headers": {},
    "requestID": "req_011CZNozGXDucETk7Chv7CuP",
    "error": {
        "type": "error",
        "error": {
            "type": "invalid_request_error",
            "message": "output_config.format.schema: For 'object' type, 'additionalProperties' must be explicitly set to false"
        },
        "request_id": "req_011CZNozGXDucETk7Chv7CuP"
    }
}
*/

export interface AnthropicError extends Error {
    status: number,
    headers: Record<string, string>,
    requestID: string,
    error: {
        type: string,
        error: {
            type: string,
            message: string
        },
        request_id: string
    }
}

export type AnthropicRetryOptions = { maxRetries?: number, baseDelayMs?: number, maxDelayMs?: number, requestId?: number }

export type ParseData = {
  file: Express.Multer.File;
  options?: {
    extractLineItems?: boolean;
    extractTax?: boolean;
    validateTotals?: boolean;
    confidenceThreshold?: number;
  }
};

export type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp"



// Most of these types aren't really needed
type Token = {
  input: number
  output: number
};

type Role = "user" | "assistant";

type TextBlock = {
  type: "text";
  content: string
};

type ImageBlock = {
  type: "image"
  source: {
    type: string
    media_type: MediaType
    data: string
  }
};

type Message = {
  role: Role,
  content: string | []
};

interface UserMessage extends Message {
  timestamp: string
}

interface ResponseMessage extends UserMessage {
  tokens: Token
  cost: number
}

interface ApiResponse {
  id: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

