import express from "express";
// import multer, { type Multer } from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet'
import cors from 'cors'
import { parseRouter } from "./routes/parse.js";
import { errorHandler, notFoundHandler } from "./errors.js";
import { randomBytes } from 'node:crypto'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const app = express()

// Security first
app.use(helmet())
app.use(cors()) // cors options: { origin: config.ALLOWED_ORIGINS }

// Generate a request ID and attach to response.locals
app.use((req, res, next) => {
  res.locals.requestId = randomBytes(32).toString('base64')
  next()
})

app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/parse', parseRouter)

app.use(notFoundHandler) // Route 404s require separate handler as Express doesn't treat them as traditional errors
app.use(errorHandler) // Error handlers go at end; first specific handlers, then catchall
