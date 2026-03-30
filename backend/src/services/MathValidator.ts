import type { Invoice, MathChecks } from "../types/types.js";

/*

// NON-ERROR - not part of error handling
// Input: Invoice where totals don't add up correctly
// Output: (Note the overall wrapper)
{
  "success": true,
  "extractedData": { ... },
  "validation": {
    "mathChecks": {
      "lineItemsMatchSubtotal": false,
      "expectedSubtotal": 7200.00,
      "extractedSubtotal": 7150.00,
      "difference": 50.00
    },
    "warnings": [
      "Subtotal does not match sum of line items. Possible OCR error or mistake in original invoice."
    ]
  }
}

*/

export function checkMath(invoice: Invoice): MathChecks {
  // do maths
  let lineItemsMatchSubtotal: boolean,
    expectedSubtotal: number,
    extractedSubtotal: number,
    difference: number;

  lineItemsMatchSubtotal = false;
  expectedSubtotal = extractedSubtotal = difference = 0;

  extractedSubtotal = invoice.totals?.subtotal ? invoice.totals?.subtotal : 0;

  return {
    lineItemsMatchSubtotal: lineItemsMatchSubtotal,
    expectedSubtotal: expectedSubtotal,
    extractedSubtotal: extractedSubtotal,
    difference: difference,
  };
}
