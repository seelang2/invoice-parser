import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer, { type Multer } from "multer";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { NotFoundError } from "../errors.js";
import { processFileUpload } from "../services/FileProcessor.js";
import type { ParseData } from "../types/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = multer({ dest: path.join(__dirname, "uploads/") });

export const parseRouter = Router();

parseRouter.post("/", upload.single("uploaded-file"), parseHandler);

async function parseHandler(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    const error = new NotFoundError("uploaded file");
    next(error)
  } else {
    // extract options from the frontend POST
    const parseData: ParseData = {
      file: req.file,
      options: {
        extractLineItems: true,
        extractTax: true,
        validateTotals: true,
        confidenceThreshold: 90,
      },
    };

    const jsonData = await processFileUpload(parseData)

    // res.json(jsonData); // Needs to be JS object, not JSON string
    // Use below for direct JSON string output
    res
        .appendHeader('Content-Type', 'application/json')
        .end(jsonData)
  }
}

