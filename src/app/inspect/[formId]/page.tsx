"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { Loader2, Search } from "lucide-react";
import { FieldControl } from "@/components/field-control";
import { PageShell } from "@/components/page-shell";
import { ReceiptSummary } from "@/components/receipt-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { oracleConnector } from "@/lib/oracle/mock-oracle-connector";
import { defaultPaperLayout, getForm, normalizeFormDefinition, saveSubmission } from "@/lib/storage";
import type { FormBlock, FormDefinition, FormFieldConfig, PendingInspectionReceipt } from "@/lib/types";
import { cn, todayIsoDate } from "@/lib/utils";

export default function InspectionRuntimePage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [receiptNumber, setReceiptNumber] = useState("R-100245");
  const [receipt, setReceipt] = useState<PendingInspectionReceipt | null>(null);
  const [pendingInspections, setPendingInspections] = useState<PendingInspectionReceipt[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = getForm(params.formId);
    if (!stored || stored.status !== "published") {
      router.replace("/inspect");
      return;
    }
    setForm(normalizeFormDefinition(stored));
    oracleConnector.getPendingInspections().then(setPendingInspections);
    const requestedReceipt = new URLSearchParams(window.location.search).get("receipt");
    if (requestedReceipt) setReceiptNumber(requestedReceipt);
  }, [params.formId, router]);

  useEffect(() => {
    const requestedReceipt = new URLSearchParams(window.location.search).get("receipt");
    if (form && requestedReceipt && !receipt) loadReceipt(requestedReceipt);
  }, [form, receipt]);

  const visibleFieldBlocks = useMemo(() => form?.blocks?.filter((block) => block.type === "oracleField" && block.field?.visible) ?? [], [form]);
  const visibleFields = useMemo(() => visibleFieldBlocks.flatMap((block) => (block.field ? [block.field] : [])), [visibleFieldBlocks]);

  if (!form) return null;

  async function loadReceipt(nextReceiptNumber = receiptNumber) {
    setLoading(true);
    setMessage(null);
    setReceipt(null);
    setErrors({});
    const found = await oracleConnector.getPendingInspectionByReceiptNumber(nextReceiptNumber);
    setLoading(false);
    if (!found || found.collectionPlanId !== form.collectionPlanId) {
      setMessage("No pending inspection receipt found for this form.");
      return;
    }
    setReceipt(found);
    setReceiptNumber(found.receiptNumber);
    setValues((current) => ({ ...current, uom_name: found.uom, transaction_date: todayIsoDate(), quantity_inspected: found.quantityPendingInspection }));
  }

  function buildSchema(fields: FormFieldConfig[]) {
    return z.object(Object.fromEntries(fields.map((field) => {
      if (field.type === "number") {
        let numeric = z.coerce.number({ invalid_type_error: `${field.displayLabel} must be a number.`, required_error: `${field.displayLabel} is required.` });
        if (typeof field.minValue === "number") numeric = numeric.min(field.minValue, `${field.displayLabel} must be at least ${field.minValue}.`);
        if (typeof field.maxValue === "number") numeric = numeric.max(field.maxValue, `${field.displayLabel} must be no more than ${field.maxValue}.`);
        let numericSchema: z.ZodType<number> = numeric;
        if (typeof field.decimalPrecision === "number") numericSchema = numericSchema.refine((value) => countDecimals(value) <= field.decimalPrecision!, `${field.displayLabel} allows ${field.decimalPrecision} decimal places.`);
        return [field.sourceFieldId, z.preprocess((value) => (value === "" ? undefined : value), field.required ? numericSchema : numericSchema.optional())];
      }
      let baseString = z.string({ required_error: `${field.displayLabel} is required.` });
      if (typeof field.maxLength === "number") baseString = baseString.max(field.maxLength, `${field.displayLabel} must be ${field.maxLength} characters or fewer.`);
      let stringSchema: z.ZodType<string> = baseString;
      if (field.type === "date") stringSchema = stringSchema.refine((value) => !Number.isNaN(Date.parse(value)), `${field.displayLabel} must be a valid date.`);
      if (field.type === "dropdown" && field.options?.length) stringSchema = stringSchema.refine((value) => Boolean(field.options?.includes(value)), `${field.displayLabel} must be one of the configured options.`);
      return [field.sourceFieldId, z.preprocess((value) => (value === "" ? undefined : value), field.required ? stringSchema : stringSchema.optional())];
    })));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!receipt) return;
    const result = buildSchema(visibleFields).safeParse(values);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) nextErrors[String(issue.path[0])] = issue.message;
      setErrors(nextErrors);
      return;
    }
    const submitted = await oracleConnector.submitInspectionResult({ formId: form.id, receipt, values: result.data });
    const finalSubmission = { ...submitted, formName: form.name };
    saveSubmission(finalSubmission);
    router.push(`/inspection-record/${finalSubmission.id}`);
  }

  return <PageShell><Link href="/inspect" className="text-sm text-primary hover:underline">Back to published forms</Link><h1 className="mt-2 text-3xl font-semibold text-slate-950">{form.name}</h1><Card className="mt-6"><CardHeader><h2 className="font-semibold">Load Pending Receipt</h2></CardHeader><CardContent><div className="flex flex-col gap-3 sm:flex-row"><Input value={receiptNumber} onChange={(event) => setReceiptNumber(event.target.value)} placeholder="Receipt number" /><Button onClick={() => loadReceipt()} disabled={loading || !receiptNumber.trim()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Load Receipt</Button></div>{message ? <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</div> : null}</CardContent></Card>{receipt ? <form onSubmit={submit} className="mt-6 grid gap-6"><ReceiptSummary receipt={receipt} /><RuntimePaperForm form={form} values={values} errors={errors} onChange={(field, value) => setValues((current) => ({ ...current, [field.sourceFieldId]: value }))} /><div className="flex justify-end"><Button type="submit">Submit Inspection</Button></div></form> : null}<Card className="mt-6"><CardHeader><h2 className="font-semibold">Awaiting Inspection</h2></CardHeader><CardContent><div className="overflow-hidden rounded-md border border-border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Part Number</th><th className="px-4 py-3">Qty Awaiting</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-border">{pendingInspections.map((inspection) => <tr key={inspection.receiptNumber}><td className="px-4 py-3 font-medium">{inspection.receiptNumber}</td><td className="px-4 py-3">{inspection.receiptDate}</td><td className="px-4 py-3">{inspection.supplier}</td><td className="px-4 py-3">{inspection.item}</td><td className="px-4 py-3">{inspection.quantityPendingInspection}</td><td className="px-4 py-3 text-right"><Button variant="secondary" onClick={() => loadReceipt(inspection.receiptNumber)}>Load</Button></td></tr>)}</tbody></table></div></CardContent></Card></PageShell>;
}

function RuntimePaperForm({ form, values, errors, onChange }: { form: FormDefinition; values: Record<string, string | number>; errors: Record<string, string>; onChange: (field: FormFieldConfig, value: string | number) => void }) {
  const layout = form.layout ?? defaultPaperLayout;
  const blocks = form.blocks ?? [];
  return <Card><CardHeader><h2 className="font-semibold">{layout.heading}</h2></CardHeader><CardContent className="overflow-auto bg-slate-100"><div className="mx-auto bg-white p-6 shadow-soft"><div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(${layout.columnWidthPx}px, 1fr))`, gridAutoRows: `minmax(${layout.rowHeightPx}px, auto)` }}>{blocks.map((block) => <div key={block.id} className={cn(block.type === "oracleField" && "rounded-md border border-border bg-white p-3")} style={{ gridColumn: `${block.column} / span ${Math.min(block.columnSpan, layout.columns)}`, gridRow: `${block.row} / span ${Math.max(1, block.rowSpan)}`, minHeight: block.type === "spacer" ? 24 : undefined }}><RuntimeBlock block={block} values={values} errors={errors} onChange={onChange} /></div>)}</div></div></CardContent></Card>;
}

function RuntimeBlock({ block, values, errors, onChange }: { block: FormBlock; values: Record<string, string | number>; errors: Record<string, string>; onChange: (field: FormFieldConfig, value: string | number) => void }) {
  if (block.type === "oracleField" && block.field?.visible) return <FieldControl field={block.field} value={values[block.field.sourceFieldId]} error={errors[block.field.sourceFieldId]} onChange={(value) => onChange(block.field!, value)} />;
  if (block.type === "sectionHeading") return <h3 className="border-b border-border pb-2 text-lg font-semibold">{block.text}</h3>;
  if (block.type === "divider") return <div className="my-3 border-t-2 border-slate-300" />;
  if (block.type === "staticText") return <p className="text-sm leading-6 text-slate-700">{block.text}</p>;
  return <div className="h-6" />;
}

function countDecimals(value: number) {
  if (Number.isInteger(value)) return 0;
  const [, decimals = ""] = String(value).split(".");
  return decimals.length;
}
