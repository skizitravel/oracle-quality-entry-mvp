import type { OracleConnector } from "@/lib/oracle/oracle-connector";
import type {
  CollectionPlan,
  CollectionPlanField,
  InspectionPayload,
  InspectionSubmission,
  PendingInspectionInput,
  PendingInspectionReceipt
} from "@/lib/types";
import { getPendingInspections, savePendingInspection } from "@/lib/storage";

const plans: CollectionPlan[] = [
  {
    id: "incoming-tubing",
    name: "Incoming Tubing Inspection",
    description: "Receiving inspection collection plan for medical tubing components."
  }
];

const fields: CollectionPlanField[] = [
  {
    id: "inspection_result_action",
    planId: "incoming-tubing",
    label: "Inspection Result",
    type: "dropdown",
    required: true,
    options: ["Accept", "Reject"]
  },
  {
    id: "quantity_inspected",
    planId: "incoming-tubing",
    label: "Quantity Inspected",
    type: "number",
    required: true
  },
  {
    id: "uom_name",
    planId: "incoming-tubing",
    label: "UOM",
    type: "text",
    required: true,
    readOnly: true
  },
  {
    id: "transaction_date",
    planId: "incoming-tubing",
    label: "Inspection Date",
    type: "date",
    required: true
  },
  {
    id: "supplier_lot_number",
    planId: "incoming-tubing",
    label: "Supplier Lot Number",
    type: "text",
    required: false
  },
  {
    id: "visual_inspection_result",
    planId: "incoming-tubing",
    label: "Visual Inspection Result",
    type: "dropdown",
    required: true,
    options: ["Pass", "Fail"]
  },
  {
    id: "outer_diameter",
    planId: "incoming-tubing",
    label: "Outer Diameter",
    type: "number",
    required: false
  },
  {
    id: "comments",
    planId: "incoming-tubing",
    label: "Comments",
    type: "textarea",
    required: false
  }
];

const receipt: PendingInspectionReceipt = {
  receiptNumber: "R-100245",
  receiptDate: "2026-05-16",
  poNumber: "PO-77821",
  supplier: "Vision Components Inc.",
  item: "TUBE-001",
  itemDescription: "Medical tubing component",
  quantityPendingInspection: 500,
  uom: "EA",
  collectionPlanId: "incoming-tubing",
  collectionPlanName: "Incoming Tubing Inspection"
};

export class MockOracleConnector implements OracleConnector {
  async getCollectionPlans() {
    return plans;
  }

  async getCollectionPlanFields(planId: string) {
    return fields.filter((field) => field.planId === planId);
  }

  async getPendingInspections() {
    return typeof window === "undefined" ? [receipt] : getPendingInspections();
  }

  async addPendingInspection(payload: PendingInspectionInput) {
    return savePendingInspection(payload);
  }

  async getPendingInspectionByReceiptNumber(receiptNumber: string) {
    const normalized = receiptNumber.trim().toUpperCase();
    return (await this.getPendingInspections()).find((item) => item.receiptNumber === normalized) ?? null;
  }

  async submitInspectionResult(payload: InspectionPayload): Promise<InspectionSubmission> {
    return {
      id: crypto.randomUUID(),
      formId: payload.formId,
      formName: "Incoming Tubing Inspection",
      collectionPlanName: payload.receipt.collectionPlanName,
      submittedAt: new Date().toISOString(),
      receipt: payload.receipt,
      values: payload.values
    };
  }
}

export const oracleConnector: OracleConnector = new MockOracleConnector();
