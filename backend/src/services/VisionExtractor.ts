import Anthropic from "@anthropic-ai/sdk";
// import type { AnthropicError } from "@anthropic-ai/sdk";
import "dotenv/config";
import { getSchema } from "./schema.js";
import { exit } from "node:process";
import type {
  AnthropicError,
  AnthropicRetryOptions,
  Invoice,
  MediaType,
} from "../types/types.js";
import {
  AppError,
  LowConfidenceError,
  MultipleInvoicesError,
  NotFoundError,
  NotInvoiceError,
  PoorImageQualityError,
  ServiceUnavailableError,
} from "../errors.js";

const systemPrompt = `
You are a JSON extraction API. Your output is piped directly into JSON.parse(). 
Any character outside of the JSON object will cause a fatal error. 
Your response MUST start with { and end with }. 
No backticks. No \`\`\`json. No commentary before or after.
`;
/*
NOTE: Inconsistency issues
The prompt template and schema as presented in the project specifications conflict 
with each other. The JSON structure in the prompt doesn't match the schema. Likewise,
the prompt indicates to add a confidence score to each major section, but the field 
is only present in the vendor object in the schema.

Resolution actions:
Explicitly added confidence as field to extract in each section in both prompt and schema
Ensured fields indicated in prompt match schema
Added customer property to schema
Removed the JSON structure specified in the prompt
Added output_format to the messages.create input

Additional required modifications:
Per SDK:
Added additionalProperties: false to each object in schema (including root object)
Removed unsupported constraints minimum, maximum, minLength, maxLength

output_config doesn't support oneOf or anyOf (allegedly with type property)
So schema was changed: Added imageType, typeConfidence, and errorCode fields

*/

const extractionPrompt = `
Extract the requested fields from the attached image. Follow these rules exactly:
- Extract only what is explicitly stated in the image.
- If a field is not present, output null for that field.
- Do not infer, estimate, or fabricate values.
- Output valid JSON only. Do not include any commentary, explanation, or markdown code fences.
- Include a "confidence" score (0-1) for each major section.
- Ensure line items sum to subtotal.
- If you are not confident whether this is an invoice, set imageType to 'unknown'.


<instructions>
    First, classify the image.

    If the image is an invoice:
        Set imageType to 'invoice'.
        Set the errorCode field to the most fitting answer.
        Extract fields per the schema below. Apply normalization rules where specified:
        1. VENDOR INFORMATION:
        - Company name
        - Full address
        - Telephone number
        - Email
        - Tax ID or VAT number
        - Confidence

        2. INVOICE DETAILS:
        - Invoice number
        - Invoice date: ISO 8601 format
        - Due date: ISO 8601 format
        - Purchase order number (if present)
        - Confidence

        3. CUSTOMER DETAILS:
        - Customer name
        - Customer full address
        - Customer contact info (phone, email)
        - Confidence

        4. LINE ITEMS (each line item should include):
        - Description
        - Quantity
        - Unit price
        - Line total
        - Confidence

        5. TOTALS:
        - Subtotal (sum of line items)
        - Tax rate
        - Tax amount
        - Total (sum of subtotal and tax)
        - Currency
        - Confidence

        6. NOTES:
        - Any additional notes or payment instructions
        
        7. Set the 'typeConfidence' score according to how confident you are that this is an invoice.

    If the image does not appear to be an invoice:
        Set imageType to 'Unknown'.
        Set the 'typeConfidence' score according to how confident you are that this is not an invoice.
        Set the errorCode field to the most fitting answer.
        Set the remaining required fields to 'Unknown' or 0 as required by type.
</instructions>
`;

export async function extractDataFromImage(
  imageData: string,
  mediaType: MediaType,
  confidenceThreshold: number,
): Promise<Invoice> {
  //   if (!imageData) throw new NotFoundError("Uploaded image");

  // Build call params
  // Anthropic.Messages.MessageCreateParamsNonStreaming
  const messageCreateParams: Anthropic.Messages.MessageCreateParamsNonStreaming =
    {
      model: "claude-opus-4-6",
      max_tokens: 1536,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageData, // Base64-encoded image data as string
              },
            },
            {
              type: "text",
              text: extractionPrompt,
            },
          ],
        },
      ],
      system: systemPrompt,
      output_config: {
        format: {
          type: "json_schema",
          schema: getSchema(),
        },
      },
    };

  const response = await callAnthropicApi(messageCreateParams);

  // could check here for refusal

  const invoice = JSON.parse(parseTextContent(response.content));

  checkErrorCode(invoice, confidenceThreshold);
  return invoice;
}

function checkErrorCode(invoice: Invoice, confidenceThreshold: number) {
  switch (invoice.errorCode) {
    case "LOW_CONFIDENCE":
      throw new LowConfidenceError(undefined, {
        typeConfidence: invoice.typeConfidence,
      });
      break;
    case "POOR_IMAGE_QUALITY":
      throw new PoorImageQualityError(undefined, {
        typeConfidence: invoice.typeConfidence,
      });
      break;
    case "NOT_AN_INVOICE":
      throw new NotInvoiceError();
      break;
    case "MULTIPLE_INVOICES":
      throw new MultipleInvoicesError(undefined, {
        typeConfidence: invoice.typeConfidence,
      });
      break;
    case "NONE":
      if (invoice.imageType === "unknown") {
        // 'unknown' and NONE shouldn't exist - miscategorized
        throw new AppError(
          `Data miscategorization`,
          500,
          "INTERNAL_ERROR",
          {
            details: {
              imageType: invoice.imageType,
              typeConfidence: invoice.typeConfidence,
              errorCode: invoice.errorCode,
              vendorConfidence: invoice.vendor.confidence,
              invoiceConfidence: invoice.invoice.confidence,
              customerConfidence: invoice.customer.confidence,
              totalsConfidence: invoice.totals.confidence,
            },
          },
        );
      } else {
        // Is invoice - check confidence level
        if (invoice.typeConfidence < confidenceThreshold) {
          throw new LowConfidenceError(undefined, {
            details: {
              confidenceThreshold: confidenceThreshold,
              imageType: invoice.imageType,
              typeConfidence: invoice.typeConfidence,
              errorCode: invoice.errorCode,
              vendorConfidence: invoice.vendor.confidence,
              invoiceConfidence: invoice.invoice.confidence,
              customerConfidence: invoice.customer.confidence,
              totalsConfidence: invoice.totals.confidence,
            }
          });
        }
      }
      break;
    default:
  }
}

function parseTextContent(content: Anthropic.Messages.ContentBlock[]): string {
  // let contentText = content.filter((block) => block.type === "text");
  // should add test and throw error here?
  // return contentText.pop()?.text || "";
  return content.filter((block) => block.type === "text").pop()?.text || "";
}

async function callAnthropicApi(
  body: Anthropic.Messages.MessageCreateParamsNonStreaming,
  options: AnthropicRetryOptions = {},
) {
  const {
    maxRetries = 4,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    requestId = crypto.randomUUID(),
  } = options;

  const client = new Anthropic();
  let lastError: AnthropicError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const attemptStartTime = Date.now();

    try {
      console.log(
        JSON.stringify({ requestId, attempt, event: "api_call_start" }),
      );

      // if (typeof prompt != "string") {
      //     throw TypeError("prompt must be a string");
      // }

      const response = await client.messages.create(body);

      console.log(
        JSON.stringify({
          requestId,
          attempt,
          event: "api_call_success",
          durationMs: Date.now() - attemptStartTime,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        }),
      );

      return response;
    } catch (error) {
      if (!(error instanceof Error)) throw error;

      const typedError = error as AnthropicError;
      lastError = typedError;
      const durationMs = Date.now() - attemptStartTime;

      console.error(
        JSON.stringify({
          requestId,
          attempt,
          event: "api_call_error",
          durationMs,
          errorStatus: typedError.status,
          errorType: typedError.error?.type,
        }),
      );

      // Fatal errors — never retry
      if ([400, 401, 403, 404].includes(typedError.status)) {
        throw typedError;
      }

      if (attempt >= maxRetries) break;

      // Honor the Retry-After header on 529 (overloaded) and 429 (rate limited)
      let delayMs;
      if (typedError.status === 429 || typedError.status === 529) {
        const retryAfter = typedError.headers?.["retry-after"];
        delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(Math.pow(2, attempt) * baseDelayMs, maxDelayMs);
      } else {
        delayMs = Math.min(Math.pow(2, attempt) * baseDelayMs, maxDelayMs);
      }

      // Add jitter: ±20% of the delay to spread out thundering herd retries
      const jitter = delayMs * 0.2 * (Math.random() * 2 - 1);
      const finalDelay = Math.max(500, delayMs + jitter);

      console.warn(
        JSON.stringify({
          requestId,
          attempt,
          event: "retry_scheduled",
          delayMs: finalDelay,
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }

  const err = new ServiceUnavailableError(
    `All attempts exhausted for request ${requestId}: ${lastError?.message}`,
    { requestId: requestId, originalError: lastError },
  );
  throw err;
}

/*

{
"model": "claude-opus-4-6",
"id": "msg_0137ugEPEedWEfrT5knpM8Sm",
"type": "message",
"role": "assistant",
"content": [
    {
        "type": "text",
        "text": "{\"vendor\":{\"name\":\"Peak Plumbing & HVAC\",\"address\":\"7723 Industrial Way, Fresno, CA 93720\",\"phone\":\"(559) 555-0317\",\"email\":\"info@peakplumbing.net\",\"taxId\":\"CA-PLM-0092847\",\"confidence\":0.97},\"invoice\":{\"number\":\"7741\",\"date\":\"2024-11-12\",\"dueDate\":\"2024-11-26\",\"poNumber\":\"WO-20241108\",\"confidence\":0.97},\"customer\":{\"name\":\"Sunrise Property Management\",\"address\":\"1450 Orchard View Dr, Suite 10, Fresno, CA 93711\",\"phone\":\"(559) 555-0481\",\"email\":\"d.kim@sunriseproperty.com\",\"confidence\":0.96},\"lineItems\":[{\"description\":\"Emergency call-out fee (after hours)\",\"quantity\":1,\"unitPrice\":150.00,\"amount\":150.00,\"confidence\":0.98},{\"description\":\"Labor — Master Plumber (Mike R.)\",\"quantity\":3.5,\"unitPrice\":95.00,\"amount\":332.50,\"confidence\":0.98},{\"description\":\"Labor — Apprentice (Dan F.)\",\"quantity\":3.5,\"unitPrice\":55.00,\"amount\":192.50,\"confidence\":0.98},{\"description\":\"Copper pipe 3/4\\\" — Type L (10 ft)\",\"quantity\":2,\"unitPrice\":28.40,\"amount\":56.80,\"confidence\":0.98},{\"description\":\"90° elbow fitting, 3/4\\\" copper (lot)\",\"quantity\":6,\"unitPrice\":4.20,\"amount\":25.20,\"confidence\":0.98},{\"description\":\"Pressure relief valve — Watts LF100XL\",\"quantity\":1,\"unitPrice\":89.00,\"amount\":89.00,\"confidence\":0.98},{\"description\":\"Water heater flush & descaling service\",\"quantity\":1,\"unitPrice\":120.00,\"amount\":120.00,\"confidence\":0.98},{\"description\":\"Miscellaneous fittings, solder, flux\",\"quantity\":1,\"unitPrice\":34.00,\"amount\":34.00,\"confidence\":0.98}],\"totals\":{\"subtotal\":1000.00,\"taxRate\":7.975,\"taxAmount\":16.32,\"total\":1016.32,\"currency\":\"USD\",\"confidence\":0.99}}"
    }
],
"stop_reason": "end_turn",
"stop_sequence": null,
"usage": {
    "input_tokens": 3042,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "cache_creation": {
        "ephemeral_5m_input_tokens": 0,
        "ephemeral_1h_input_tokens": 0
    },
    "output_tokens": 549,
    "service_tier": "standard",
    "inference_geo": "global"
    }
}
*/
