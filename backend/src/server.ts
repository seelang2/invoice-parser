import express from "express";
import multer, { type Multer } from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet'
import cors from 'cors'
import 'dotenv/config'

import Anthropic from "@anthropic-ai/sdk";
import fs from 'node:fs/promises'
import { str } from "ajv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const app = express()

// Security first
app.use(helmet())
app.use(cors()) // cors options: { origin: config.ALLOWED_ORIGINS }

const upload = multer({ dest: path.join(__dirname, 'uploads/')}) 

app.use(express.static(path.join(__dirname, 'public')));


type File = {
    fieldname: string,
    originalname: string,
    encoding: string,
    mimetype: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
    destination: string,
    filename: string,
    path: string,
    size: number
}

async function getBase64File(path: string) {
    
    try {
        const rawFileData = await fs.readFile(path);
        // console.log('read file ', path, '=', rawFileData)
        return rawFileData.toString('base64');
    } catch(err) {
        console.error(err)
    }    
}

async function test(fileData: Express.Multer.File) {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });


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


app.post('/upload', upload.single('testing'), (req, res, next) => {
    // req.file is the `testing` file
    /*
    file: {
        fieldname: 'testing',
        originalname: '002.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: 'uploads/',
        filename: '99c6fd3433b03c70ecd08700a49604bc',
        path: 'uploads/99c6fd3433b03c70ecd08700a49604bc',
        size: 944042
    },
    */
    // req.body will hold the text fields, if there were any
    //console.dir(req)

    if (!req.file) {
        res.send('No file found.')
    } else {
        const result = test(req.file)
        if (!result) {
            res.send('Test failed.')
        }
    }



    res.send('Test succeeded.')
})
