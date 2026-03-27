import { str } from "ajv";
import { getSchema } from "./schema.js";


const invoiceSchema = getSchema(true)

export const checkSchema = () => {
  console.dir(invoiceSchema, {depth: 4})
}

