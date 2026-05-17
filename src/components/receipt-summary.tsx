import type { PendingInspectionReceipt } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

export function ReceiptSummary({ receipt }: { receipt: PendingInspectionReceipt }) {
  const rows = [
    ["Receipt Number", receipt.receiptNumber],
    ["PO Number", receipt.poNumber],
    ["Supplier", receipt.supplier],
    ["Item", receipt.item],
    ["Item Description", receipt.itemDescription],
    ["Quantity Pending Inspection", receipt.quantityPendingInspection],
    ["UOM", receipt.uom]
  ];

  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-medium text-slate-950">{value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
