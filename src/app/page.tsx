import Link from "next/link";
import { ClipboardCheck, Settings2 } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <PageShell>
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Phase 1 prototype</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          Simpler receiving inspection entry for Oracle Quality
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Build human-friendly inspection forms from mock Oracle collection plans, then complete and print inspection
          records from a receipt number.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link href="/admin/forms">
          <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary">
            <CardContent className="p-6">
              <Settings2 className="h-9 w-9 text-primary" />
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">Admin Form Builder</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Select a collection plan, arrange Oracle fields into sections, tune labels and rules, then publish.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/inspect">
          <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary">
            <CardContent className="p-6">
              <ClipboardCheck className="h-9 w-9 text-primary" />
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">Inspector Entry</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Load receipt R-100245, complete the published inspection form, submit, and print the record.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </PageShell>
  );
}
