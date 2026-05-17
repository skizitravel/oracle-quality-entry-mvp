"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { getForm, saveSubmission } from "@/lib/storage";
import type { FormDefinition, FormFieldConfig, PendingInspectionReceipt } from "@/lib/types";
import { todayIsoDate } from "@/lib/utils";

export default function InspectionRuntimePage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [receiptNumber, setReceiptNumber] = useState("R-100245");
  const [receipt, setReceipt] = useState<PendingInspectionReceipt | null>(null);
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
    setForm(stored);
  }, [params.formId, router]);

  const visibleFields = useMemo(() => form?.sections.flatMap((section) => section.fields.filter((field) => field.visible)) ?? [], [form]);

  if (!form) return null;

  async function loadReceipt() {
    setLoading(true);
    setMessage(null);
    setReceipt(null);
    setErrors({});
    const found = await oracleConnector.getPendingInspectionByReceiptNumber(receiptNumber);
    setLoading(false);

    if (!found || found.collectionPlanId !== form.collectionPlanId) {
      setMessage("No pending inspection receipt found for this form.");
      return;
    }

    setReceipt(found);
    setValues((current) => ({
      ...current,
      uom_name: found.uom,
      transaction_date: todayIsoDate(),
      quantity_inspected: found.quantityPendingInspection
    }));
  }

  function buildSchema(fields: FormFieldConfig[]) {
    return z.object(
      Object.fromEntries(
        fields.map((field) => {
          if (field.type === "number") {
            const numberSchema = z.preprocess(
              (value) => (value === "" ? undefined : value),
              field.required
                ? z.coerce.number({
                    invalid_type_error: `${field.displayLabel} must be a number.`,
                    required_error: `${field.displayLabel} is required.`
                  })
                : z.coerce.number({ invalid_type_error: `${field.displayLabel} must be a number.` }).optional()
            );
            return [field.sourceFieldId, numberSchema];
          }

          const textSchema = z.preprocess(
            (value) => (value === "" ? undefined : value),
            field.required ? z.string({ required_error: `${field.displayLabel} is required.` }) : z.string().optional()
          );
          return [field.sourceFieldId, textSchema];
        })
      )
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!receipt) return;

    const schema = buildSchema(visibleFields);
    const result = schema.safeParse(values);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    const submitted = await oracleConnector.submitInspectionResult({
      formId: form.id,
      receipt,
      values: result.data
    });
    const finalSubmission = { ...submitted, formName: form.name };
    saveSubmission(finalSubmission);
    router.push(`/inspection-record/${finalSubmission.id}`);
  }

  return (
    <PageShell>
      <Link href="/inspect" className="text-sm text-primary hover:underline">
        Back to published forms
      </Link>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">{form.name}</h1>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold">Load Pending Receipt</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input value={receiptNumber} onChange={(event) => setReceiptNumber(event.target.value)} placeholder="Receipt number" />
            <Button onClick={loadReceipt} disabled={loading || !receiptNumber.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Load Receipt
            </Button>
          </div>
          {message ? <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</div> : null}
        </CardContent>
      </Card>

      {receipt ? (
        <form onSubmit={submit} className="mt-6 grid gap-6">
          <ReceiptSummary receipt={receipt} />
          {form.sections.map((section) => {
            const fields = section.fields.filter((field) => field.visible);
            if (fields.length === 0) return null;
            return (
              <Card key={section.id}>
                <CardHeader>
                  <h2 className="font-semibold">{section.title}</h2>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {fields.map((field) => (
                    <FieldControl
                      key={field.id}
                      field={field}
                      value={values[field.sourceFieldId]}
                      error={errors[field.sourceFieldId]}
                      onChange={(value) => setValues((current) => ({ ...current, [field.sourceFieldId]: value }))}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
          <div className="flex justify-end">
            <Button type="submit">Submit Inspection</Button>
          </div>
        </form>
      ) : null}
    </PageShell>
  );
}
