// Contains router and controller for parse feature
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer, { type Multer } from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import util from 'node:util'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const upload = multer({ dest: path.join(__dirname, 'uploads/')}) 

export const parseRouter = Router()


parseRouter.post('/', upload.single('uploaded-file'), uploadHandler)


async function uploadHandler(req: Request, res: Response, next: NextFunction) {
    // Receive upload, hand off data to appropriate service(s), and create response
    try {
        // Let's try dumping the value of res to screen
        res.send(`<body style="background:#242020;color:#fff;font-size:16px"><pre>${util.format('%o', res)}</pre></body>`)
    } catch (err) {
        next(err) // Pass all errors to error handler
    }
}

