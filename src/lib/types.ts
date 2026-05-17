export type FieldType = "text" | "number" | "date" | "dropdown" | "textarea";

export interface CollectionPlan {
  id: string;
  name: string;
  description: string;
}

export interface CollectionPlanField {
  id: string;
  planId: string;
  label: string;
  type: FieldType;
  required: boolean;
  readOnly?: boolean;
  options?: string[];
}

export interface FormFieldConfig {
  id: string;
  sourceFieldId: string;
  displayLabel: string;
  type: FieldType;
  required: boolean;
  readOnly: boolean;
  visible: boolean;
  options?: string[];
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormFieldConfig[];
}

export interface FormDefinition {
  id: string;
  name: string;
  collectionPlanId: string;
  collectionPlanName: string;
  status: "draft" | "published";
  sections: FormSection[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PendingInspectionReceipt {
  receiptNumber: string;
  poNumber: string;
  supplier: string;
  item: string;
  itemDescription: string;
  quantityPendingInspection: number;
  uom: string;
  collectionPlanId: string;
  collectionPlanName: string;
}

export interface InspectionSubmission {
  id: string;
  formId: string;
  formName: string;
  collectionPlanName: string;
  submittedAt: string;
  receipt: PendingInspectionReceipt;
  values: Record<string, string | number>;
}

export interface InspectionPayload {
  formId: string;
  receipt: PendingInspectionReceipt;
  values: Record<string, string | number>;
}
