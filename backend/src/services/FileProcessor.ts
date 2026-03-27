import fs from "node:fs/promises";
import { extractDataFromImage } from "../services/VisionExtractor.js";
import { checkSchema } from "../services/Validator.js";
import util from "node:util";
import type { MediaType, ParseData } from "../types/types.js";
import { NotFoundError, ServiceUnavailableError } from "../errors.js";

export async function processFileUpload(parseData: ParseData): Promise<string> {
  const {
    extractLineItems = true,
    extractTax = true,
    validateTotals = true,
    confidenceThreshold = 0.9,
  } = parseData.options as any;

  // Check image and resize if necessary
  
  const imageData = await getBase64File(parseData.file.path);
  if (!imageData) { throw new NotFoundError }

  const response = await extractDataFromImage(imageData, parseData.file.mimetype as MediaType); // Error passed automatically

  // This shouldn't run if the API throws an error, but it's a necessary guard rail for TS
  if (!response) {
    throw new ServiceUnavailableError();
  }

  console.log('API Response:', response)

  // validate JSON

  // checkSchema()

  // validate math

  return response;
}

async function getBase64File(path: string): Promise<string> {
  try {
    const rawFileData = await fs.readFile(path);
    return rawFileData.toString("base64");
  } catch (err) {
        throw err
  }
}
