export type FieldType = "text" | "number" | "date" | "dropdown" | "textarea";
export type PaperSize = "letter" | "legal" | "a4" | "custom";
export type PaperOrientation = "portrait" | "landscape";
export type FormBlockType = "oracleField" | "staticText" | "sectionHeading" | "divider" | "spacer";

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
  [key: string]: unknown;
  id: string;
  sourceFieldId: string;
  displayLabel: string;
  type: FieldType;
  required: boolean;
  readOnly: boolean;
  visible: boolean;
  options?: string[];
  placeholder?: string;
  maxLength?: number;
  decimalPrecision?: number;
  minValue?: number;
  maxValue?: number;
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
  layout?: PaperLayout;
  blocks?: FormBlock[];
  sections: FormSection[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PaperLayout {
  paperSize: PaperSize;
  orientation: PaperOrientation;
  widthIn: number;
  heightIn: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  heading: string;
  rows: number;
  columns: number;
  rowHeightPx: number;
  columnWidthPx: number;
}

export interface FormBlock {
  id: string;
  type: FormBlockType;
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
  label?: string;
  text?: string;
  field?: FormFieldConfig;
}

export interface PendingInspectionReceipt {
  receiptNumber: string;
  receiptDate: string;
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

export type PendingInspectionInput = Omit<
  PendingInspectionReceipt,
  "poNumber" | "itemDescription" | "uom" | "collectionPlanId" | "collectionPlanName"
> &
  Partial<Pick<PendingInspectionReceipt, "poNumber" | "itemDescription" | "uom" | "collectionPlanId" | "collectionPlanName">>;
