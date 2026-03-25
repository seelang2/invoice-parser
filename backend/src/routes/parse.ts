// Contains router and controller for parse feature
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer, { type Multer } from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import util from 'node:util'
import { extractDataFromImage } from "../services/VisionExtractor.js";
import { ParseError } from "../errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const upload = multer({ dest: path.join(__dirname, 'uploads/')}) 

export const parseRouter = Router()


parseRouter.post('/', upload.single('uploaded-file'), uploadHandler)


async function uploadHandler(req: Request, res: Response, next: NextFunction) {
    // Receive upload, hand off data to appropriate service(s), and create response
    // 
    try {
        // Let's try dumping the value of res to screen
        // res.send(`<body style="background:#242020;color:#fff;font-size:16px"><pre>${util.format('%o', res)}</pre></body>`)
        // Send ok, now send to vision API
        if (!req.file) {
            res.send('No file found.')
        } else {
            const parseData = {
                file: req.file,
                options: {
                    extractLineItems: true,
                    extractTax: true,
                    validateTotals: true,
                    confidenceThreshold: true
                }
            }   
            const response = await extractDataFromImage(parseData)  // .catch((err) => {next(err)}) 

            if (!response) {
                throw new ParseError('INVALID_RESPONSE_YO')
            }

            const content = parseContent(response.content)
            
            const contentObj = JSON.parse(content)

            // validate JSON

            // validate math


            //res.send(`<body style="background:#242020;color:#fff;font-size:16px"><pre>${response}</pre></body>`)
            res.json(contentObj) // Needs to be JS object, not JSON
            // Use below for direct JSON string output
            // res
            //     .appendHeader('Content-Type', 'application/json')
            //     .end(response)

        }
    } catch (err) {
        console.log('parse:uploadHandler: Error trapped')
        next(err) // Pass all errors to error handler
    }
}


// TODO: Find more accurate type than any
function parseContent(content: any[]): string {
    let contentText = content.filter(block => block.type === 'text')
    // should add test and throw error here?
    return contentText.pop()?.text || ''
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

