import fs from "node:fs/promises";
import { extractDataFromImage } from "../services/VisionExtractor.js";
// import { checkSchema } from "../services/Validator.js";
import util from "node:util";
import type { JsonApiResponse, MediaType, ParseData } from "../types/types.js";
import { NotFoundError, ServiceUnavailableError } from "../errors.js";
import { validateJson } from "./Validator.js";
import { checkMath } from "./MathValidator.js";

export async function processFileUpload(parseData: ParseData): Promise<JsonApiResponse> {
  const {
    extractLineItems = true,
    extractTax = true,
    validateTotals = true,
    confidenceThreshold = 0.9,
  } = parseData.options as any;

  // Check image and resize if necessary

  const imageData = await getBase64File(parseData.file.path);
  if (!imageData) { throw new NotFoundError }

  const invoice = await extractDataFromImage(imageData, parseData.file.mimetype as MediaType, confidenceThreshold); // Error passed automatically

  // This shouldn't run if the API throws an error, but it's a necessary guard rail for TS
  if (!invoice) {
    throw new ServiceUnavailableError();
  }


  // validate JSON
  const jsonValidationResult = validateJson(invoice)
  
  // validate math
  const mathChecks = checkMath(invoice)

  return {
    success: true,
    extractedData: invoice,
    validation: {
      mathChecks: mathChecks
    }
  };
}

async function getBase64File(path: string): Promise<string> {
  try {
    const rawFileData = await fs.readFile(path);
    return rawFileData.toString("base64");
  } catch (err) {
        throw err
  }
}

/*
{
    "imageType": "unknown",
    "typeConfidence": 0.98,
    "errorCode": "NOT_AN_INVOICE",
    "vendor": {
        "name": "Unknown",
        "address": null,
        "phone": null,
        "email": null,
        "taxId": null,
        "confidence": 0
    },
    "invoice": {
        "number": "Unknown",
        "date": "1970-01-01",
        "dueDate": null,
        "poNumber": null,
        "confidence": 0
    },
    "totals": {
        "total": 0,
        "confidence": 0
    }
}
*/
