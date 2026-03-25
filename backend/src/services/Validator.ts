import { str } from "ajv";




// JSON Schema for Validation (per project specification)
const invoiceSchema = {
  type: "object",
  required: ["vendor", "invoice", "totals"],
  properties: {
    vendor: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 1 },
        address: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        email: { type: ["string", "null"], format: "email" },
        taxId: { type: ["string", "null"] },
        confidence: { type: "number", minimum: 0, maximum: 1 }
      }
    },
    invoice: {
      type: "object",
      required: ["number", "date"],
      properties: {
        number: { type: "string", minLength: 1 },
        date: { type: "string", format: "date" },
        dueDate: { type: ["string", "null"], format: "date" },
        poNumber: { type: ["string", "null"] }
      }
    },
    lineItems: {
      type: "array",
      items: {
        type: "object",
        required: ["description", "amount"],
        properties: {
          description: { type: "string" },
          quantity: { type: ["number", "null"] },
          unitPrice: { type: ["number", "null"] },
          amount: { type: "number", minimum: 0 }
        }
      }
    },
    totals: {
      type: "object",
      required: ["total"],
      properties: {
        subtotal: { type: "number", minimum: 0 },
        taxRate: { type: ["number", "null"], minimum: 0, maximum: 1 },
        taxAmount: { type: ["number", "null"], minimum: 0 },
        total: { type: "number", minimum: 0 },
        currency: { type: "string", pattern: "^[A-Z]{3}$" }
      }
    }
  }
};


