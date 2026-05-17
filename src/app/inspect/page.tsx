"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { oracleConnector } from "@/lib/oracle/mock-oracle-connector";
import { getPublishedForms, getSubmissions } from "@/lib/storage";
import type { FormDefinition, InspectionSubmission, PendingInspectionReceipt } from "@/lib/types";

export default function InspectPage() {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [pendingInspections, setPendingInspections] = useState<PendingInspectionReceipt[]>([]);
  const [submissions, setSubmissions] = useState<InspectionSubmission[]>([]);

  useEffect(() => {
    setForms(getPublishedForms());
    oracleConnector.getPendingInspections().then(setPendingInspections);
    setSubmissions(getSubmissions());
  }, []);

  function formForInspection(inspection: PendingInspectionReceipt) {
    return forms.find((form) => form.collectionPlanId === inspection.collectionPlanId) ?? forms[0];
  }

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold text-slate-950">Inspector Entry</h1>
      <p className="mt-2 text-muted-foreground">Choose a published form, select a pending inspection, or review prior inspection results.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{forms.length === 0 ? <Card className="md:col-span-2"><CardContent className="p-8 text-center"><ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 font-semibold text-slate-950">No published forms yet</h2><p className="mt-2 text-sm text-muted-foreground">Publish a form in Admin before starting inspection entry.</p><Link href="/admin/forms/new" className="mt-4 inline-flex"><Button>Create a Form</Button></Link></CardContent></Card> : forms.map((form) => <Card key={form.id}><CardHeader><h2 className="font-semibold">{form.name}</h2></CardHeader><CardContent className="flex flex-col gap-4"><div className="text-sm text-muted-foreground">Collection Plan: {form.collectionPlanName}</div><div className="text-sm text-muted-foreground">{form.sections.reduce((count, section) => count + section.fields.length, 0)} configured fields</div><Link href={`/inspect/${form.id}`}><Button>Start Inspection <ArrowRight className="h-4 w-4" /></Button></Link></CardContent></Card>)}</div>
      <Card className="mt-6"><CardHeader><h2 className="font-semibold">Awaiting Inspection</h2></CardHeader><CardContent><div className="overflow-hidden rounded-md border border-border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Part Number</th><th className="px-4 py-3">Qty Awaiting</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-border">{pendingInspections.map((inspection) => { const form = formForInspection(inspection); return <tr key={inspection.receiptNumber}><td className="px-4 py-3 font-medium">{inspection.receiptNumber}</td><td className="px-4 py-3">{inspection.receiptDate}</td><td className="px-4 py-3">{inspection.supplier}</td><td className="px-4 py-3">{inspection.item}</td><td className="px-4 py-3">{inspection.quantityPendingInspection}</td><td className="px-4 py-3 text-right">{form ? <Link href={`/inspect/${form.id}?receipt=${encodeURIComponent(inspection.receiptNumber)}`}><Button variant="secondary">Inspect</Button></Link> : <span className="text-xs text-muted-foreground">Publish a form first</span>}</td></tr>; })}</tbody></table></div></CardContent></Card>
      <Card className="mt-6"><CardHeader><h2 className="font-semibold">Inspection Results</h2></CardHeader><CardContent>{submissions.length === 0 ? <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No submitted inspections yet.</div> : <div className="overflow-hidden rounded-md border border-border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Form</th><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Part Number</th><th className="px-4 py-3">Result</th></tr></thead><tbody className="divide-y divide-border">{submissions.map((submission) => <tr key={submission.id}><td className="px-4 py-3 text-muted-foreground">{new Date(submission.submittedAt).toLocaleString()}</td><td className="px-4 py-3"><Link href={`/inspection-record/${submission.id}`} className="font-medium text-primary hover:underline">{submission.formName}</Link></td><td className="px-4 py-3">{submission.receipt.receiptNumber}</td><td className="px-4 py-3">{submission.receipt.supplier}</td><td className="px-4 py-3">{submission.receipt.item}</td><td className="px-4 py-3 font-medium">{String(submission.values.inspection_result_action ?? "Submitted")}</td></tr>)}</tbody></table></div>}</CardContent></Card>
    </PageShell>
  );
}
