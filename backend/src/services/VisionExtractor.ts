import Anthropic from "@anthropic-ai/sdk";
import { getBase64File } from "./FileProcessor.js";
import 'dotenv/config'
import { getSchema } from "./schema.js";
import { exit } from "node:process";

// Most of these types aren't really needed
type Token = {
    input: number,
    output: number
}

type Role = 'user' | 'assistant'

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp"

type TextBlock = {
    type: "text",
    content: string
}

type ImageBlock = {
    type: "image",
    source: {
        type: string,
        media_type: MediaType,
        data: string
    }
}

type Message = {
    role: Role,
    content: string | [],
}

interface UserMessage extends Message {
    timestamp: string
}

interface ResponseMessage extends UserMessage {
    tokens: Token,
    cost: number
}

interface ApiResponse {
    id: string,
    usage: {
        input_tokens: number,
        output_tokens: number
    }
}

type ParseData = {
    file: Express.Multer.File,
    options: {
        extractLineItems: boolean,
        extractTax: boolean,
        validateTotals: boolean,
        confidenceThreshold: boolean
    }
}


const systemPrompt = `
You are a JSON extraction API. Your output is piped directly into JSON.parse(). 
Any character outside of the JSON object will cause a fatal error. 
Your response MUST start with { and end with }. 
No backticks. No \`\`\`json. No commentary before or after.
`
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

`
const invoiceSchema = getSchema()

/*
// Construct multi-schema output
const typeInvoice = {
    required: invoiceSchema.required,
    additionalProperties: invoiceSchema.additionalProperties,
    properties: invoiceSchema.properties
};

(typeInvoice.properties as any)['type'] = { type: "string", enum: ["invoice"] }

const typeUnknown = {
    properties: {
        type: { type: "string", enum: ["unknown"] },
        success: { type: "boolean", enum: [false] },
        error: { type: "string" },
        message: { type: "string" },
        confidence: { type: "number" }
    },
    required: ["type", "success", "error", "message"],
    additionalProperties: false
};

const multiSchema = { type: "object", anyOf: <any>[] }

multiSchema.anyOf.push(typeInvoice)
multiSchema.anyOf.push(typeUnknown)
*/

export async function extractDataFromImage(parseData: ParseData) {
    
    // console.dir(multiSchema, {depth: 6})
    
    // return new Promise((resolveOuter) => {
    //         resolveOuter(
    //             new Promise((resolveInner) => {
    //             setTimeout(resolveInner, 1000);
    //             }),
    //         );
    //     });
    
    // const anthropic = new Anthropic({
    //     apiKey: process.env.ANTHROPIC_API_KEY
    // });

    const anthropic = new Anthropic()

    const imageData = await getBase64File(parseData.file.path)

    if (!imageData) {
        return false
    }

    // console.log('imageData: ', imageData)
    
    const message = await anthropic.messages.create({
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
                            media_type: <MediaType>parseData.file.mimetype,
                            data: imageData // Base64-encoded image data as string
                        }
                    },
                    {
                        type: "text",
                        text: extractionPrompt
                    }
                ]
            }
        ],
        system: systemPrompt,
        output_config: {
            format: {
                type: "json_schema",
                schema: invoiceSchema
            }
        }
    })
  
    return message
}

/*
Output returned on non-invoice image (face pic):
{
    "vendor": {
        "name": "Unknown",
        "address": null,
        "phone": null,
        "email": null,
        "taxId": null,
        "confidence": 0.05
    },
    "invoice": {
        "number": "316",
        "date": "2024-01-01",
        "dueDate": null,
        "poNumber": null,
        "confidence": 0.1
    },
    "totals": {
        "total": 0.43,
        "currency": "USD",
        "confidence": 0.1
    }
}




{
  type: 'object',
  oneOf: [
    {
      required: [ 'vendor', 'invoice', 'totals' ],
      additionalProperties: false,
      properties: {
        vendor: {
          type: 'object',
          required: [ 'name' ],
          properties: {
            name: { type: 'string' },
            address: { type: [Array] },
            phone: { type: [Array] },
            email: { type: [Array], format: 'email' },
            taxId: { type: [Array] },
            confidence: { type: 'number' }
          },
          additionalProperties: false
        },
        invoice: {
          type: 'object',
          required: [ 'number', 'date' ],
          properties: {
            number: { type: 'string' },
            date: { type: 'string', format: 'date' },
            dueDate: { type: [Array], format: 'date' },
            poNumber: { type: [Array] },
            confidence: { type: 'number' }
          },
          additionalProperties: false
        },
        customer: {
          type: 'object',
          required: [ 'name' ],
          properties: {
            name: { type: 'string' },
            address: { type: [Array] },
            phone: { type: [Array] },
            email: { type: [Array], format: 'email' },
            confidence: { type: 'number' }
          },
          additionalProperties: false
        },
        lineItems: {
          type: 'array',
          items: {
            type: 'object',
            required: [ 'description', 'amount' ],
            properties: {
              description: [Object],
              quantity: [Object],
              unitPrice: [Object],
              amount: [Object],
              confidence: [Object]
            },
            additionalProperties: false
          }
        },
        totals: {
          type: 'object',
          required: [ 'total' ],
          properties: {
            subtotal: { type: 'number' },
            taxRate: { type: [Array] },
            taxAmount: { type: [Array] },
            total: { type: 'number' },
            currency: { type: 'string', pattern: '^[A-Z]{3}$' },
            confidence: { type: 'number' }
          },
          additionalProperties: false
        },
        type: { type: 'string', enum: [ 'invoice' ] }
      }
    },
    {
      properties: {
        type: { type: 'string', enum: [ 'unknown' ] },
        success: { type: 'boolean', enum: [ false ] },
        error: { type: 'string' },
        message: { type: 'string' }
      },
      required: [ 'type', 'success', 'error', 'message' ],
      additionalProperties: false
    }
  ]
}


*/
