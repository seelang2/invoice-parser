

/*

// NON-ERROR - not part of error handling
// Input: Invoice where totals don't add up correctly
// Output:
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


