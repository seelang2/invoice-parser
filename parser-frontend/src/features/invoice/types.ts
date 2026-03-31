type Vendor = {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
  confidence?: number;
};

type InvoiceInfo = {
  number: string;
  date: string;
  dueDate?: string | null;
  poNumber?: string | null;
  confidence?: number;
};

type Customer = {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  confidence?: number;
};

type LineItem = {
  description: string;
  quantity?: number | null;
  unitPrice?: number | null;
  amount: number;
  confidence?: number;
};

type Totals = {
  subtotal?: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  total: number;
  currency?: string;
  confidence?: number;
};

export type Invoice = {
  imageType: "invoice" | "unknown";
  typeConfidence: number;
  errorCode:
    | "NONE"
    | "LOW_CONFIDENCE"
    | "POOR_IMAGE_QUALITY"
    | "NOT_AN_INVOICE"
    | "MULTIPLE_INVOICES";
  vendor: Vendor;
  invoice: InvoiceInfo;
  customer: Customer;
  lineItems?: LineItem[];
  totals: Totals;
};

type MathChecks = {
  lineItemsMatchSubtotal: boolean;
  expectedSubtotal: number;
  extractedSubtotal: number;
  difference: number;
};

export interface ParserApiResponse {
  success: boolean;
  requestId: string;
  // On success
  extractedData?: Invoice;
  validation?: {
    mathChecks: MathChecks;
    warnings?: string[];
  };
  // On error
  error?: string;
  message?: string;
  details?: {
    typeConfidence: number;
    suggestions?: string[];
  };
}
