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
- Unit of measure
- Unit price
- Line total
- Confidence

5. TOTALS:
- Subtotal (sum of line items)
- Tax
- Total (sum of subtotal and tax)
- Confidence

6. PAYMENT TERMS:
- Terms (e.g. "Net 30", "Due on Receipt")

7. NOTES:
- Any additional notes or payment instructions

Return in this exact JSON structure:
{
	"extractedData": {
	"vendor": { "name": string, "address": string, ... },
	"invoice": { "number": string, "date": string, ... },
	"lineItems": [ { "description": string, ... } ],
	"totals": { "subtotal": number, ... }
	},
	"validation": {
		"mathchecks": {
			"lineItemsMatchSubtotal": boolean,
			"taxCalculationCorrect": boolean,
			"totalCalculationCorrect": boolean
		}
	}
}

`


export async function extractDataFromImage(parseData: ParseData): Promise<string | boolean | JSON> {
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
        max_tokens: 1024,
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
        system: systemPrompt
    });
  
    console.log(message);

    // Temp for dev and testing
    const content = parseContent(message.content)

    // Need to confirm data is JSON, and validates against scheme
    // If it fails, we retry

    return content
}

// TODO: Find more accurate type than any
function parseContent(content: any[]): string {
    let contentText = content.filter(block => block.type === 'text')
    return contentText.pop()?.text || '(No text content in response)'
}


