// import _Ajv from "ajv";
import { Ajv } from "ajv";
// import type { JSONSchemaType } from "ajv";
// import _addFormats from "ajv-formats";
// import addFormats from 'ajv-formats'
import { getSchema } from "./schema.js";
import { exit } from "node:process";
// Only seems to work in CJS-style require(), not ES module
// const Ajv = require("ajv")
// const addFormats = require("ajv-formats")
import formatsPlugin from "ajv-formats";
import type { Invoice, ValidationResponse } from "../types/types.js";

// @See https://stackoverflow.com/questions/75228565/error-ts2351-this-expression-is-not-constructable-ajv-with-typescript
// const Ajv = _Ajv as unknown as typeof _Ajv.default;
const ajv = new Ajv({ allErrors: true });
// ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
// const addFormats = _addFormats as unknown as typeof _addFormats.default
// addFormats(ajv);
// @See https://github.com/ajv-validator/ajv-formats/issues/85#issuecomment-2949033319
formatsPlugin.default(ajv);

const invoiceSchema = getSchema(true);

// console.dir(JSON.parse(JSON.stringify(invoiceSchema)), {depth: 8})
// console.log(JSON.stringify(invoiceSchema))
// exit()

// const schemaJSON = `{"type":"object","required":["imageType","vendor","invoice","totals"],"additionalProperties":false,"properties":{"imageType":{"type":"string","enum":["invoice","unknown"]},"typeConfidence":{"type":"number"},"errorCode":{"type":"string","enum":["NONE","LOW_CONFIDENCE","POOR_IMAGE_QUALITY","NOT_AN_INVOICE","MULTIPLE_INVOICES"]},"vendor":{"type":"object","required":["name"],"properties":{"name":{"type":"string","minLength":1},"address":{"type":["string","null"]},"phone":{"type":["string","null"]},"email":{"type":["string","null"],"format":"email"},"taxId":{"type":["string","null"]},"confidence":{"type":"number","minimum":0,"maximum":1}},"additionalProperties":false},"invoice":{"type":"object","required":["number","date"],"properties":{"number":{"type":"string","minLength":1},"date":{"type":"string","format":"date"},"dueDate":{"type":["string","null"],"format":"date"},"poNumber":{"type":["string","null"]},"confidence":{"type":"number","minimum":0,"maximum":1}},"additionalProperties":false},"customer":{"type":"object","required":["name"],"properties":{"name":{"type":"string","minLength":1},"address":{"type":["string","null"]},"phone":{"type":["string","null"]},"email":{"type":["string","null"],"format":"email"},"confidence":{"type":"number","minimum":0,"maximum":1}},"additionalProperties":false},"lineItems":{"type":"array","items":{"type":"object","required":["description","amount"],"properties":{"description":{"type":"string"},"quantity":{"type":["number","null"]},"unitPrice":{"type":["number","null"]},"amount":{"type":"number","minimum":0},"confidence":{"type":"number","minimum":0,"maximum":1}},"additionalProperties":false}},"totals":{"type":"object","required":["total"],"properties":{"subtotal":{"type":"number","minimum":0},"taxRate":{"type":["number","null"],"minimum":0,"maximum":1},"taxAmount":{"type":["number","null"],"minimum":0},"total":{"type":"number","minimum":0},"currency":{"type":"string","pattern":"^[A-Z]{3}$"},"confidence":{"type":"number","minimum":0,"maximum":1}},"additionalProperties":false}}}`
// const testData = `{"imageType":"invoice","typeConfidence":0.99,"errorCode":"NONE","vendor":{"name":"Nexbridge Consulting Ltd.","address":"14 Finsbury Square, London EC2A 1HP, United Kingdom","phone":"+44 20 7946 0812","email":"accounts@nexbridge.co.uk","taxId":"GB 289 4471 63","confidence":0.97},"invoice":{"number":"VAT/2024/NOV/0341","date":"2024-11-18","dueDate":"2024-12-18","poNumber":"PO-SG-88-2024","confidence":0.97},"customer":{"name":"SingaTech Global Pte. Ltd.","address":"One Raffles Quay, North Tower #24-01, Singapore 048583","phone":null,"email":null,"confidence":0.95},"lineItems":[{"description":"Financial Risk Assessment - APAC market entry – 3 jurisdictions","quantity":1,"unitPrice":8500,"amount":8500,"confidence":0.96},{"description":"Regulatory Compliance Audit - MAS framework alignment review","quantity":1,"unitPrice":6200,"amount":6200,"confidence":0.96},{"description":"Senior Consultant Days (9 days) - On-site Singapore engagement","quantity":9,"unitPrice":1400,"amount":12600,"confidence":0.96},{"description":"Travel & Subsistence Reimbursement - Flights, hotel, per diems – receipts ref. EXP-341","quantity":1,"unitPrice":3847.5,"amount":3847.5,"confidence":0.95},{"description":"Written Report & Deliverables Pack - Executive summary + full annexures","quantity":1,"unitPrice":1800,"amount":1800,"confidence":0.96}],"totals":{"subtotal":32947.5,"taxRate":null,"taxAmount":3300,"total":36247.5,"currency":"GBP","confidence":0.98}}`
// const testData2 = '{"imageType":"invoice","typeConfidence":0.99,"errorCode":"NONE","vendor":{"name":"Nexbridge Consulting Ltd.","address":"14 Finsbury Square, London EC2A 1HP, United Kingdom","phone":"+44 20 7946 0812","email":"accounts@nexbridge.co.uk","taxId":"GB 289 4471 63","confidence":0.97},"invoice":{"number":"VAT/2024/NOV/0341","date":"2024-11-18","dueDate":"2024-12-18","poNumber":"PO-SG-88-2024","confidence":0.97},"customer":{"name":"SingaTech Global Pte. Ltd.","address":"One Raffles Quay, North Tower #24-01, Singapore 048583","phone":null,"email":null,"confidence":0.95},"lineItems":[{"description":"Financial Risk Assessment - APAC market entry – 3 jurisdictions","quantity":1,"unitPrice":8500,"amount":8500,"confidence":0.96},{"description":"Regulatory Compliance Audit - MAS framework alignment review","quantity":1,"unitPrice":6200,"amount":6200,"confidence":0.96},{"description":"Senior Consultant Days (9 days) - On-site Singapore engagement","quantity":9,"unitPrice":1400,"amount":12600,"confidence":0.96},{"description":"Travel & Subsistence Reimbursement - Flights, hotel, per diems – receipts ref. EXP-341","quantity":1,"unitPrice":3847.5,"amount":3847.5,"confidence":0.95},{"description":"Written Report & Deliverables Pack - Executive summary + full annexures","quantity":1,"unitPrice":1800,"amount":1800,"confidence":0.96}],"totals":{"subtotal":32947.5,"taxRate":null,"taxAmount":3300,"total":36247.5,"currency":"GBP","confidence":0.98}}'

// const validate = ajv.compile(invoiceSchema)
// const valid = validate(JSON.parse(testData2))

// console.log(valid)
// console.dir(validate.errors, {depth: 8})

// console.dir(JSON.parse(testData2), {depth: 8})

// export const checkSchema = () => {
//   console.dir(invoiceSchema, {depth: 4})
// }

// 'ErrorObject<string, Record<string, any>, unknown>[] | null | undefined'

export function validateJson(data: Invoice): ValidationResponse {
  const validate = ajv.compile(invoiceSchema);
  const valid = validate(data);
  return valid
    ? { success: valid }
    : { success: valid, errors: validate.errors };
}
