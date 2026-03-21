import express from "express";
// import multer, { type Multer } from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet'
import cors from 'cors'
import { parseRouter } from "./routes/parse.js";

import { str } from "ajv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const app = express()

// Security first
app.use(helmet())
app.use(cors()) // cors options: { origin: config.ALLOWED_ORIGINS }


app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/parse', parseRouter)

