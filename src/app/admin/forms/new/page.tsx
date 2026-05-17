"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { oracleConnector } from "@/lib/oracle/mock-oracle-connector";
import { saveForm } from "@/lib/storage";
import type { CollectionPlan, FormDefinition } from "@/lib/types";

export default function NewFormPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<CollectionPlan[]>([]);

  useEffect(() => {
    oracleConnector.getCollectionPlans().then(setPlans);
  }, []);

  function createForm(plan: CollectionPlan) {
    const now = new Date().toISOString();
    const form: FormDefinition = {
      id: crypto.randomUUID(),
      name: plan.name,
      collectionPlanId: plan.id,
      collectionPlanName: plan.name,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      sections: [
        { id: crypto.randomUUID(), title: "Inspection Results", fields: [] },
        { id: crypto.randomUUID(), title: "Measurements", fields: [] },
        { id: crypto.randomUUID(), title: "Disposition / Notes", fields: [] }
      ]
    };
    saveForm(form);
    router.push(`/admin/forms/${form.id}/builder`);
  }

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold text-slate-950">Create Form</h1>
      <p className="mt-2 text-muted-foreground">Choose a mock Oracle collection plan to configure for inspectors.</p>

      <div className="mt-6 grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <h2 className="font-semibold">{plan.name}</h2>
            </CardHeader>
            <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-sm text-muted-foreground">{plan.description}</p>
              <Button onClick={() => createForm(plan)}>
                Use Plan <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
