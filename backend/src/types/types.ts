


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

export type AppErrorOptions = {
  isOperational?: boolean,
  details?: unknown, 
  cause?: unknown,
  requestId?: unknown,
  originalError?: unknown 
}

type Vendor = {
  name: string,
  address?: string | null,
  phone?: string | null,
  email?: string | null,
  taxId?: string | null,
  confidence?: number
}

type InvoiceInfo = {
  number: string,
  date: string,
  dueDate?: string | null,
  poNumber?: string | null,
  confidence?: number
}

type Customer = {
  name: string,
  address?: string | null,
  phone?: string | null,
  email?: string | null,
  confidence?: number
}

type LineItem = {
  description: string,
  quantity?: number | null,
  unitPrice?: number | null,
  amount: number,
  confidence?: number
}

type Totals = {
  subtotal?: number,
  taxRate?: number | null,
  taxAmount?: number | null,
  total: number,
  currency?: string,
  confidence?: number
}

export type Invoice = {
  imageType: "invoice" | "unknown",
  typeConfidence: number,
  errorCode: "NONE" | "LOW_CONFIDENCE" | "POOR_IMAGE_QUALITY" | "NOT_AN_INVOICE" | "MULTIPLE_INVOICES",
  vendor: Vendor,
  invoice: InvoiceInfo,
  customer: Customer,
  lineItems?: LineItem[],
  totals: Totals
}

export type MathChecks = {
  lineItemsMatchSubtotal: boolean,
  expectedSubtotal: number,
  extractedSubtotal: number,
  difference: number
}

type ValidationErrors = {
  instancePath: string,
  schemaPath: string,
  keyword: string,
  params: Record<string, string>,
  message: string
}

export type ValidationResponse = {
  success: boolean,
  errors?: unknown[] | null | undefined
}

export type JsonApiResponse = {
  success: boolean,
  extractedData: Invoice,
  validation: {
    mathChecks: MathChecks,
    warnings?: string[]
  }
}


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

