"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { oracleConnector } from "@/lib/oracle/mock-oracle-connector";
import { getForms } from "@/lib/storage";
import type { CollectionPlan, FormDefinition } from "@/lib/types";

export default function AdminFormsPage() {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [plans, setPlans] = useState<CollectionPlan[]>([]);

  useEffect(() => {
    oracleConnector.getCollectionPlans().then(setPlans);
    setForms(getForms());
    const refresh = () => setForms(getForms());
    window.addEventListener("forms-updated", refresh);
    return () => window.removeEventListener("forms-updated", refresh);
  }, []);

  return (
    <PageShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Admin Forms</h1>
          <p className="mt-2 text-muted-foreground">Mock Oracle collection plans and locally saved form definitions.</p>
        </div>
        <Link href="/admin/forms/new">
          <Button>
            <Plus className="h-4 w-4" /> New Form
          </Button>
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Oracle Collection Plans</h2>
          </CardHeader>
          <CardContent className="grid gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-md border border-border p-4">
                <div className="font-medium">{plan.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{plan.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Existing Forms</h2>
          </CardHeader>
          <CardContent>
            {forms.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No forms yet. Create a form from a collection plan to start the workflow.
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {forms.map((form) => (
                      <tr key={form.id}>
                        <td className="px-4 py-3 font-medium">
                          <Link className="text-primary hover:underline" href={`/admin/forms/${form.id}/builder`}>
                            {form.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{form.collectionPlanName}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                            {form.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(form.updatedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
