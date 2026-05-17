"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { oracleConnector } from "@/lib/oracle/mock-oracle-connector";
import { deleteForm, getForms } from "@/lib/storage";
import type { CollectionPlan, FormDefinition, PendingInspectionInput, PendingInspectionReceipt } from "@/lib/types";

export default function AdminFormsPage() {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [plans, setPlans] = useState<CollectionPlan[]>([]);
  const [pendingInspections, setPendingInspections] = useState<PendingInspectionReceipt[]>([]);
  const [newInspection, setNewInspection] = useState<PendingInspectionInput>({ receiptNumber: "", receiptDate: new Date().toISOString().slice(0, 10), supplier: "", item: "", quantityPendingInspection: 0 });

  useEffect(() => {
    oracleConnector.getCollectionPlans().then(setPlans);
    setForms(getForms());
    refreshPending();
    const refresh = () => setForms(getForms());
    const refreshPendingListener = () => refreshPending();
    window.addEventListener("forms-updated", refresh);
    window.addEventListener("pending-inspections-updated", refreshPendingListener);
    return () => { window.removeEventListener("forms-updated", refresh); window.removeEventListener("pending-inspections-updated", refreshPendingListener); };
  }, []);

  async function refreshPending() { setPendingInspections(await oracleConnector.getPendingInspections()); }

  function handleDeleteForm(id: string) {
    if (!window.confirm("Delete this form? Existing inspection submissions will be left intact.")) return;
    deleteForm(id);
    setForms(getForms());
  }

  async function addPendingInspection(event: FormEvent) {
    event.preventDefault();
    if (!newInspection.receiptNumber.trim()) return;
    await oracleConnector.addPendingInspection(newInspection);
    setNewInspection({ receiptNumber: "", receiptDate: new Date().toISOString().slice(0, 10), supplier: "", item: "", quantityPendingInspection: 0 });
    refreshPending();
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-semibold text-slate-950">Admin Forms</h1><p className="mt-2 text-muted-foreground">Mock Oracle collection plans and locally saved form definitions.</p></div><Link href="/admin/forms/new"><Button><Plus className="h-4 w-4" /> New Form</Button></Link></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]"><Card><CardHeader><h2 className="font-semibold">Oracle Collection Plans</h2></CardHeader><CardContent className="grid gap-3">{plans.map((plan) => <div key={plan.id} className="rounded-md border border-border p-4"><div className="font-medium">{plan.name}</div><div className="mt-1 text-sm text-muted-foreground">{plan.description}</div></div>)}</CardContent></Card><Card><CardHeader><h2 className="font-semibold">Existing Forms</h2></CardHeader><CardContent>{forms.length === 0 ? <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No forms yet. Create a form from a collection plan to start the workflow.</div> : <div className="overflow-hidden rounded-md border border-border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-border">{forms.map((form) => <tr key={form.id}><td className="px-4 py-3 font-medium"><Link className="text-primary hover:underline" href={`/admin/forms/${form.id}/builder`}>{form.name}</Link></td><td className="px-4 py-3">{form.collectionPlanName}</td><td className="px-4 py-3"><span className="rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">{form.status}</span></td><td className="px-4 py-3 text-muted-foreground">{new Date(form.updatedAt).toLocaleString()}</td><td className="px-4 py-3 text-right"><Button variant="ghost" onClick={() => handleDeleteForm(form.id)} aria-label={`Delete ${form.name}`}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div>}</CardContent></Card></div>
      <Card className="mt-6"><CardHeader><h2 className="font-semibold">Pending Inspections</h2></CardHeader><CardContent className="grid gap-5"><form onSubmit={addPendingInspection} className="grid gap-3 lg:grid-cols-[1fr_160px_1fr_1fr_150px_auto]"><Input placeholder="Receipt number" value={newInspection.receiptNumber} onChange={(event) => setNewInspection((current) => ({ ...current, receiptNumber: event.target.value }))} /><Input type="date" value={newInspection.receiptDate} onChange={(event) => setNewInspection((current) => ({ ...current, receiptDate: event.target.value }))} /><Input placeholder="Supplier" value={newInspection.supplier} onChange={(event) => setNewInspection((current) => ({ ...current, supplier: event.target.value }))} /><Input placeholder="Part number" value={newInspection.item} onChange={(event) => setNewInspection((current) => ({ ...current, item: event.target.value }))} /><Input type="number" placeholder="Quantity" value={newInspection.quantityPendingInspection} onChange={(event) => setNewInspection((current) => ({ ...current, quantityPendingInspection: Number(event.target.value) }))} /><Button type="submit"><Plus className="h-4 w-4" /> Add</Button></form><div className="overflow-hidden rounded-md border border-border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Part Number</th><th className="px-4 py-3">Qty Awaiting</th></tr></thead><tbody className="divide-y divide-border">{pendingInspections.map((inspection) => <tr key={inspection.receiptNumber}><td className="px-4 py-3 font-medium">{inspection.receiptNumber}</td><td className="px-4 py-3">{inspection.receiptDate}</td><td className="px-4 py-3">{inspection.supplier}</td><td className="px-4 py-3">{inspection.item}</td><td className="px-4 py-3">{inspection.quantityPendingInspection}</td></tr>)}</tbody></table></div></CardContent></Card>
    </PageShell>
  );
}
