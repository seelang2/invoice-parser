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
                        text: "Describe this image."
                    }
                ]
            }
        ]
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


