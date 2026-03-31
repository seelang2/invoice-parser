import React, { useState, type SetStateAction, type Dispatch } from "react";
import type { Invoice, ParserApiResponse } from "../types";

export default function InvoiceSection() {
  const [parserApiResponse, setParserApiResponse] = useState({
    success: false,
    requestId: "no request",
  } as Partial<ParserApiResponse>);

  let displaySection;
  if (parserApiResponse.requestId === "no request") {
    displaySection = <UploadForm updateResponse={setParserApiResponse} />;
  } else if (parserApiResponse.success) {
    displaySection = (
      <DisplayInvoice
        invoiceData={parserApiResponse.extractedData as Invoice}
      />
    );
  } else {
    displaySection = <UploadForm updateResponse={setParserApiResponse} />;
  }

  return (
    <div className="invoice">
      <h1>Invoice</h1>
      {parserApiResponse.success === false &&
      parserApiResponse.requestId !== "no request" ? (
        <DisplayError response={parserApiResponse} />
      ) : (
        ""
      )}
      {displaySection}
    </div>
  );
}

function DisplayError({ response }: { response: Partial<ParserApiResponse> }) {
  return (
    <div>
      <h2>Error</h2>
      <p>Request ID: {response.requestId}</p>
      <p>Success: {response.success ? "Yes" : "No"}</p>
      <p>
        Message: {response.message || "No additional information provided."}
      </p>
    </div>
  );
}

function DisplayInvoice({ invoiceData }: { invoiceData: Invoice }) {
  return (
    <div>
      <h2>Invoice Data</h2>
      <pre>{JSON.stringify(invoiceData, null, 2)}</pre>
    </div>
  );
}

// Note how the prop updateInvoiceData is typed to match the state updater function for invoiceData, ensuring type safety when updating the state with new invoice data.
function UploadForm({
  updateResponse: updateInvoiceData,
}: {
  updateResponse: Dispatch<SetStateAction<Partial<ParserApiResponse>>>;
}) {
  async function handleUpload(e: React.MouseEvent<HTMLButtonElement>) {
    const form = document.querySelector("#uploadform") as HTMLFormElement;
    e.preventDefault(); // Prevent the default form submission behavior
    const formData = new FormData(form);

    formData.append("CustomField", "This is some extra data");

    const response = await fetch("http://localhost:80/api/parse", {
      method: "POST",
      body: formData,
    });

    const responseData = await response.json();

    // console.log(responseData);

    // Simulate file upload and processing
    const dataJSON =
      '{"extractedData":{"vendor":{"name":"TechCorp Solutions Inc.","address":"1200 Innovation Drive, Suite 400, San Francisco, CA 94107","telephone":"(415) 555-0192","email":"billing@techcorp.io","taxId":"47-2398104","confidence":0.98},"invoice":{"number":"INV-2024-0087","date":"2024-11-15","dueDate":"2024-12-15","purchaseOrderNumber":null,"confidence":0.99},"customer":{"name":"Meridian Digital Agency","address":"88 Commerce Blvd, Floor 12, New York, NY 10013","attention":"Accounts Payable","email":"ap@meridiandigital.com","phone":null,"confidence":0.98},"lineItems":[{"description":"Cloud Infrastructure Setup - AWS architecture design & deployment","quantity":1,"unitOfMeasure":"each","unitPrice":4500.00,"lineTotal":4500.00,"confidence":0.99},{"description":"API Development - RESTful API endpoints (32 hrs @ $175/hr)","quantity":32,"unitOfMeasure":"hrs","unitPrice":175.00,"lineTotal":5600.00,"confidence":0.99},{"description":"Monthly SaaS License - TechCorp Platform — Enterprise Tier","quantity":1,"unitOfMeasure":"each","unitPrice":2200.00,"lineTotal":2200.00,"confidence":0.99},{"description":"DevOps Consultation - CI/CD pipeline review & optimization (8 hrs)","quantity":8,"unitOfMeasure":"hrs","unitPrice":195.00,"lineTotal":1560.00,"confidence":0.99},{"description":"Priority Support Add-on - 24/7 SLA — November 2024","quantity":1,"unitOfMeasure":"each","unitPrice":350.00,"lineTotal":350.00,"confidence":0.99}],"totals":{"subtotal":14210.00,"discount":710.50,"discountDescription":"Discount (5%)","tax":1158.34,"taxDescription":"Tax (8.625% CA)","total":14657.84,"confidence":0.99},"paymentTerms":{"terms":"Net 30","latePaymentPolicy":"Late payments subject to 1.5% monthly interest.","instructions":"Please include invoice number in payment reference."},"notes":{"contactEmail":"billing@techcorp.io","wireTransfer":{"bank":"Bank of America","routingNumber":"121000358","accountNumber":"4872-0039-1102","achZelle":"billing@techcorp.io"}}},"validation":{"mathchecks":{"lineItemsMatchSubtotal":true,"taxCalculationCorrect":true,"totalCalculationCorrect":true}}}';

    updateInvoiceData(responseData);
  }

  return (
    <div>
      <h2>Upload Invoice</h2>
      <form id="uploadform" method="post" encType="multipart/form-data">
        <input type="file" name="uploaded-file" accept=".pdf,.jpg,.png" />
        <input type="hidden" name="paramOptionOne" value="one" />
        <input type="hidden" name="paramOptionTwo" value="two" />
        <input type="hidden" name="paramOptionThree" value="three" />
        <button onClick={handleUpload}>Upload</button>
      </form>
    </div>
  );
}
