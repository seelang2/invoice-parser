// Contains router and controller for parse feature
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer, { type Multer } from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import util from 'node:util'
import { extractDataFromImage } from "../services/VisionExtractor.js";
import type { ParseError } from "../errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const upload = multer({ dest: path.join(__dirname, 'uploads/')}) 

export const parseRouter = Router()


parseRouter.post('/', upload.single('uploaded-file'), uploadHandler)


async function uploadHandler(req: Request, res: Response, next: NextFunction) {
    // Receive upload, hand off data to appropriate service(s), and create response
    // 
    // try {
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
            const response = await extractDataFromImage(parseData)

            //res.send(`<body style="background:#242020;color:#fff;font-size:16px"><pre>${response}</pre></body>`)
            res.json(response)

        }
    // } catch (err) {
    //     console.log('parse:uploadHandler: Error trapped')
    //     next(err) // Pass all errors to error handler
    // }
}





