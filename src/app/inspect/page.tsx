"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPublishedForms } from "@/lib/storage";
import type { FormDefinition } from "@/lib/types";

export default function InspectPage() {
  const [forms, setForms] = useState<FormDefinition[]>([]);

  useEffect(() => {
    setForms(getPublishedForms());
  }, []);

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold text-slate-950">Inspector Entry</h1>
      <p className="mt-2 text-muted-foreground">Choose a published inspection form, then load a pending receipt.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {forms.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="p-8 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 font-semibold text-slate-950">No published forms yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">Publish a form in Admin before starting inspection entry.</p>
              <Link href="/admin/forms/new" className="mt-4 inline-flex">
                <Button>Create a Form</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          forms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <h2 className="font-semibold">{form.name}</h2>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="text-sm text-muted-foreground">Collection Plan: {form.collectionPlanName}</div>
                <div className="text-sm text-muted-foreground">{form.sections.reduce((count, section) => count + section.fields.length, 0)} configured fields</div>
                <Link href={`/inspect/${form.id}`}>
                  <Button>
                    Start Inspection <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageShell>
  );
}
