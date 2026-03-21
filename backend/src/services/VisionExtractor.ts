import Anthropic from "@anthropic-ai/sdk";
import { getBase64File } from "./FileProcessor.js";
import 'dotenv/config'







async function test(fileData: Express.Multer.File) {
    // const anthropic = new Anthropic({
    //     apiKey: process.env.ANTHROPIC_API_KEY
    // });

    const anthropic = new Anthropic()

    const imageData = await getBase64File(fileData.path)

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
                            media_type: <"image/jpeg" | "image/png" | "image/gif" | "image/webp">fileData.mimetype,
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
    return true
}



