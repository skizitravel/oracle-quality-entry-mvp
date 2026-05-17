import type {
  CollectionPlan,
  CollectionPlanField,
  InspectionPayload,
  InspectionSubmission,
  PendingInspectionReceipt
} from "@/lib/types";

// Boundary for Oracle EBS access. UI code depends on this contract so the mock
// connector can later be replaced by a VisionEbsConnector without rewriting pages.
export interface OracleConnector {
  getCollectionPlans(): Promise<CollectionPlan[]>;
  getCollectionPlanFields(planId: string): Promise<CollectionPlanField[]>;
  getPendingInspectionByReceiptNumber(receiptNumber: string): Promise<PendingInspectionReceipt | null>;
  submitInspectionResult(payload: InspectionPayload): Promise<InspectionSubmission>;
}
