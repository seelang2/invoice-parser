

// TODO Add missing notes field to schema
const invoiceSchema = {
  type: "object",
  required: ["vendor", "invoice", "totals"],
  additionalProperties: false,
  properties: {
    vendor: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        address: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        email: { type: ["string", "null"], format: "email" },
        taxId: { type: ["string", "null"] },
        confidence: { type: "number" }
      },
      additionalProperties: false
    },
    invoice: {
      type: "object",
      required: ["number", "date"],
      properties: {
        number: { type: "string" },
        date: { type: "string", format: "date" },
        dueDate: { type: ["string", "null"], format: "date" },
        poNumber: { type: ["string", "null"] },
        confidence: { type: "number" }
      },
      additionalProperties: false
    },
    customer: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        address: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        email: { type: ["string", "null"], format: "email" },
        confidence: { type: "number" }
      },
      additionalProperties: false
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
          amount: { type: "number" },
          confidence: { type: "number" }
        },
        additionalProperties: false
      }
    },
    totals: {
      type: "object",
      required: ["total"],
      properties: {
        subtotal: { type: "number" },
        taxRate: { type: ["number", "null"] },
        taxAmount: { type: ["number", "null"] },
        total: { type: "number" },
        currency: { type: "string", pattern: "^[A-Z]{3}$" },
        confidence: { type: "number" }
      },
      additionalProperties: false
    }
  }
};


// Original JSON Schema for Validation (per project specification)
const invoiceSchema2 = {
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

export function getSchema(addConstraints = false) {
    if (!addConstraints) return invoiceSchema;

    const tmpSchema = structuredClone(invoiceSchema); // NEED the semicolon at end of statement or TS throws error (WTF)
    (tmpSchema.properties.vendor.properties.name as any)['minLength'] = 1;
    (tmpSchema.properties.vendor.properties.confidence as any)['minimum'] = 0;
    (tmpSchema.properties.vendor.properties.confidence as any)['maximum'] = 1;

    (tmpSchema.properties.invoice.properties.number as any)['minLength'] = 1;
    (tmpSchema.properties.invoice.properties.confidence as any)['minimum'] = 0;
    (tmpSchema.properties.invoice.properties.confidence as any)['maximum'] = 1;

    (tmpSchema.properties.customer.properties.name as any)['minLength'] = 1;
    (tmpSchema.properties.customer.properties.confidence as any)['minimum'] = 0;
    (tmpSchema.properties.customer.properties.confidence as any)['maximum'] = 1;

    (tmpSchema.properties.lineItems.items.properties.amount as any)['minimum'] = 0;
    (tmpSchema.properties.lineItems.items.properties.confidence as any)['minimum'] = 0;
    (tmpSchema.properties.lineItems.items.properties.confidence as any)['maximum'] = 1;

    (tmpSchema.properties.totals.properties.subtotal as any)['minimum'] = 0;
    (tmpSchema.properties.totals.properties.taxAmount as any)['minimum'] = 0;
    (tmpSchema.properties.totals.properties.total as any)['minimum'] = 0;
    (tmpSchema.properties.totals.properties.taxRate as any)['minimum'] = 0;
    (tmpSchema.properties.totals.properties.taxRate as any)['maximum'] = 1;
    (tmpSchema.properties.totals.properties.confidence as any)['minimum'] = 0;
    (tmpSchema.properties.totals.properties.confidence as any)['maximum'] = 1;

    return tmpSchema;

}

