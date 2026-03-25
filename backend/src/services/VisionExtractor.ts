import Anthropic from "@anthropic-ai/sdk";
import { getBase64File } from "./FileProcessor.js";
import 'dotenv/config'

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
- Fo not infer, estimate, or fabricate values.
- Output valid JSON only. Do not include any commentary, explanation, or markdown code fences.
- Include a "confidence" score (0-1) for each major section
- Validate that subtotal + tax = total
- Ensure line items sum to subtotal

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

`
// TODO Add missing notes field to schema
const invoiceSchema = {
  type: "object",
  required: ["vendor", "invoice", "totals"],
  additionalProperties: false,
  properties: {
    vendor: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        address: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        email: { type: ["string", "null"], format: "email" },
        taxId: { type: ["string", "null"] },
        confidence: { type: "number" }
      },
      additionalProperties: false
    },
    invoice: {
      type: "object",
      required: ["number", "date"],
      properties: {
        number: { type: "string" },
        date: { type: "string", format: "date" },
        dueDate: { type: ["string", "null"], format: "date" },
        poNumber: { type: ["string", "null"] },
        confidence: { type: "number" }
      },
      additionalProperties: false
    },
    customer: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        address: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        email: { type: ["string", "null"], format: "email" },
        confidence: { type: "number" }
      },
      additionalProperties: false
    },
    lineItems: {
      type: "array",
      items: {
        type: "object",
        required: ["description", "amount"],
        properties: {
          description: { type: "string" },
          quantity: { type: ["number", "null"] },
          unitPrice: { type: ["number", "null"] },
          amount: { type: "number" },
          confidence: { type: "number" }
        },
        additionalProperties: false
      }
    },
    totals: {
      type: "object",
      required: ["total"],
      properties: {
        subtotal: { type: "number" },
        taxRate: { type: ["number", "null"] },
        taxAmount: { type: ["number", "null"] },
        total: { type: "number" },
        currency: { type: "string", pattern: "^[A-Z]{3}$" },
        confidence: { type: "number" }
      },
      additionalProperties: false
    }
  }
};



export async function extractDataFromImage(parseData: ParseData) {
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


