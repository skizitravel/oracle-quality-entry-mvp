"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getForm, getSubmission } from "@/lib/storage";
import type { FormDefinition, InspectionSubmission } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function InspectionRecordPage() {
  const params = useParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<InspectionSubmission | null>(null);
  const [form, setForm] = useState<FormDefinition | null>(null);

  useEffect(() => {
    const stored = getSubmission(params.submissionId);
    setSubmission(stored);
    setForm(stored ? getForm(stored.formId) : null);
  }, [params.submissionId]);

  const result = useMemo(() => submission?.values.inspection_result_action, [submission]);

  if (!submission) {
    return (
      <PageShell>
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Inspection record not found.</CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="no-print mb-5 flex justify-between">
        <Link href="/inspect" className="text-sm text-primary hover:underline">
          Back to inspections
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      <article className="rounded-lg border border-border bg-white p-8 shadow-soft print:border-0 print:shadow-none">
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Incoming Inspection Record</h1>
            <p className="mt-2 text-sm text-muted-foreground">{submission.formName}</p>
          </div>
          <div className="rounded-md bg-accent px-4 py-3 text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">Inspection Result</div>
            <div className="mt-1 text-2xl font-semibold text-accent-foreground">{String(result ?? "Submitted")}</div>
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info label="Submission Timestamp" value={formatDateTime(submission.submittedAt)} />
          <Info label="Collection Plan" value={submission.collectionPlanName} />
          <Info label="Receipt Number" value={submission.receipt.receiptNumber} />
          <Info label="PO Number" value={submission.receipt.poNumber} />
          <Info label="Supplier" value={submission.receipt.supplier} />
          <Info label="Item" value={submission.receipt.item} />
          <Info label="Item Description" value={submission.receipt.itemDescription} />
          <Info label="Quantity Pending Inspection" value={`${submission.receipt.quantityPendingInspection} ${submission.receipt.uom}`} />
        </section>

        <section className="mt-8">
          <h2 className="border-b border-border pb-2 text-lg font-semibold">Inspection Values</h2>
          <div className="mt-4 grid gap-3">
            {form
              ? form.sections.map((section) => (
                  <div key={section.id} className="break-inside-avoid">
                    <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h3>
                    <div className="mt-2 grid gap-2">
                      {section.fields
                        .filter((field) => field.visible)
                        .map((field) => (
                          <Info key={field.id} label={field.displayLabel} value={submission.values[field.sourceFieldId] ?? ""} />
                        ))}
                    </div>
                  </div>
                ))
              : Object.entries(submission.values).map(([key, value]) => <Info key={key} label={key} value={value} />)}
          </div>
        </section>
      </article>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid grid-cols-[220px_1fr] gap-3 rounded-md border border-border px-3 py-2 text-sm">
      <div className="font-medium text-muted-foreground">{label}</div>
      <div className="font-medium text-slate-950">{String(value)}</div>
    </div>
  );
}
