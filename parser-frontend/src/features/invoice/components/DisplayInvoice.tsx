export default function DisplayInvoice({ invoiceData }: { invoiceData: any }) {
  return (
    <div>
      <h2>Invoice Data</h2>
      <pre>{JSON.stringify(invoiceData, null, 2)}</pre>
    </div>
  );
}
