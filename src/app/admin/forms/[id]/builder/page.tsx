"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff, FileText, Heading1, Minus, Save, Trash2, Type } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { oracleConnector } from "@/lib/oracle/mock-oracle-connector";
import { defaultPaperLayout, getForm, normalizeFormDefinition, saveForm } from "@/lib/storage";
import type { CollectionPlanField, FormBlock, FormDefinition, FormFieldConfig, PaperLayout, PaperSize } from "@/lib/types";
import { cn } from "@/lib/utils";

const paperSizes: Record<PaperSize, { label: string; widthIn: number; heightIn: number }> = {
  letter: { label: "Letter 8.5 x 11", widthIn: 8.5, heightIn: 11 },
  legal: { label: "Legal 8.5 x 14", widthIn: 8.5, heightIn: 14 },
  a4: { label: "A4 8.27 x 11.69", widthIn: 8.27, heightIn: 11.69 },
  custom: { label: "Custom", widthIn: 8.5, heightIn: 11 }
};

type LayoutPatch = Partial<Omit<PaperLayout, "margins">> & { margins?: Partial<PaperLayout["margins"]> };

export default function FormBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [availableFields, setAvailableFields] = useState<CollectionPlanField[]>([]);
  const [selectedCell, setSelectedCell] = useState({ row: 1, column: 1 });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  useEffect(() => {
    const stored = getForm(params.id);
    if (!stored) {
      router.replace("/admin/forms");
      return;
    }
    const normalized = normalizeFormDefinition(stored);
    setForm(normalized);
    oracleConnector.getCollectionPlanFields(normalized.collectionPlanId).then(setAvailableFields);
  }, [params.id, router]);

  const selectedBlock = useMemo(() => form?.blocks?.find((block) => block.id === selectedBlockId) ?? null, [form, selectedBlockId]);
  if (!form || !form.layout || !form.blocks) return null;

  function updateForm(updater: (current: FormDefinition) => FormDefinition) {
    setForm((current) => (current ? normalizeFormDefinition(updater(current)) : current));
  }

  function updateLayout(patch: LayoutPatch) {
    updateForm((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      layout: { ...(current.layout ?? defaultPaperLayout), ...patch, margins: { ...(current.layout ?? defaultPaperLayout).margins, ...patch.margins } }
    }));
  }

  function changePaperSize(size: PaperSize) {
    const preset = paperSizes[size];
    updateLayout({ paperSize: size, widthIn: size === "custom" ? form.layout?.widthIn ?? preset.widthIn : preset.widthIn, heightIn: size === "custom" ? form.layout?.heightIn ?? preset.heightIn : preset.heightIn });
  }

  function addOracleField(sourceField: CollectionPlanField) {
    addBlock({
      id: crypto.randomUUID(),
      type: "oracleField",
      row: selectedCell.row,
      column: selectedCell.column,
      rowSpan: 1,
      columnSpan: 2,
      field: { id: crypto.randomUUID(), sourceFieldId: sourceField.id, displayLabel: sourceField.label, type: sourceField.type, required: sourceField.required, readOnly: Boolean(sourceField.readOnly), visible: true, options: sourceField.options, decimalPrecision: sourceField.type === "number" ? 0 : undefined }
    });
  }

  function addStaticBlock(type: FormBlock["type"]) {
    addBlock({
      id: crypto.randomUUID(),
      type,
      row: selectedCell.row,
      column: selectedCell.column,
      rowSpan: 1,
      columnSpan: type === "sectionHeading" || type === "divider" ? form.layout?.columns ?? 4 : 2,
      text: type === "sectionHeading" ? "Section Heading" : type === "staticText" ? "Static text" : ""
    });
  }

  function addBlock(block: FormBlock) {
    updateForm((current) => ({ ...current, updatedAt: new Date().toISOString(), blocks: [...(current.blocks ?? []), block] }));
    setSelectedBlockId(block.id);
  }

  function updateBlock(patch: Partial<FormBlock>) {
    if (!selectedBlock) return;
    updateForm((current) => ({ ...current, updatedAt: new Date().toISOString(), blocks: (current.blocks ?? []).map((block) => (block.id === selectedBlock.id ? { ...block, ...patch } : block)) }));
  }

  function updateSelectedField(patch: Partial<FormFieldConfig>) {
    if (!selectedBlock?.field) return;
    updateBlock({ field: { ...selectedBlock.field, ...patch } });
  }

  function removeSelectedBlock() {
    if (!selectedBlock) return;
    updateForm((current) => ({ ...current, updatedAt: new Date().toISOString(), blocks: (current.blocks ?? []).filter((block) => block.id !== selectedBlock.id) }));
    setSelectedBlockId(null);
  }

  function save(status: "draft" | "published") {
    const next = normalizeFormDefinition({ ...form, status, updatedAt: new Date().toISOString(), publishedAt: status === "published" ? new Date().toISOString() : form.publishedAt });
    saveForm(next);
    setForm(next);
  }

  return (
    <PageShell>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link href="/admin/forms" className="text-sm text-primary hover:underline">Back to forms</Link>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{form.name}</h1>
          <p className="mt-1 text-muted-foreground">Build a printable, grid-based inspection form from Oracle fields and static layout blocks.</p>
        </div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => save("draft")}><Save className="h-4 w-4" /> Save Draft</Button><Button onClick={() => save("published")}>Publish Form</Button></div>
      </div>
      <div className="grid gap-5 2xl:grid-cols-[300px_1fr_360px]">
        <Card><CardHeader><h2 className="font-semibold">Add Blocks</h2></CardHeader><CardContent className="grid gap-5"><div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Static Layout</h3><div className="grid gap-2"><Button variant="secondary" onClick={() => addStaticBlock("sectionHeading")}><Heading1 className="h-4 w-4" /> Heading</Button><Button variant="secondary" onClick={() => addStaticBlock("staticText")}><Type className="h-4 w-4" /> Static Text</Button><Button variant="secondary" onClick={() => addStaticBlock("divider")}><Minus className="h-4 w-4" /> Divider</Button><Button variant="secondary" onClick={() => addStaticBlock("spacer")}><FileText className="h-4 w-4" /> Spacer</Button></div></div><div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Oracle Fields</h3><div className="grid gap-2">{availableFields.map((field) => <button key={field.id} onClick={() => addOracleField(field)} className="rounded-md border border-border bg-white p-3 text-left shadow-sm transition hover:border-primary hover:bg-sky-50"><span className="block text-sm font-medium">{field.label}</span><span className="text-xs text-muted-foreground">{field.type}</span></button>)}</div></div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between"><h2 className="font-semibold">Paper Layout Canvas</h2><div className="text-xs text-muted-foreground">Selected cell: R{selectedCell.row} C{selectedCell.column}</div></CardHeader><CardContent className="overflow-auto bg-slate-100"><PaperCanvas form={form} selectedCell={selectedCell} selectedBlockId={selectedBlockId} onSelectCell={setSelectedCell} onSelectBlock={setSelectedBlockId} /></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Layout & Formatting</h2></CardHeader><CardContent className="grid gap-5"><LayoutSettings layout={form.layout} onChange={updateLayout} onPaperSizeChange={changePaperSize} /><BlockSettings block={selectedBlock} onChange={updateBlock} onFieldChange={updateSelectedField} onRemove={removeSelectedBlock} maxRows={form.layout.rows} maxColumns={form.layout.columns} /></CardContent></Card>
      </div>
    </PageShell>
  );
}

function PaperCanvas({ form, selectedCell, selectedBlockId, onSelectCell, onSelectBlock }: { form: FormDefinition; selectedCell: { row: number; column: number }; selectedBlockId: string | null; onSelectCell: (cell: { row: number; column: number }) => void; onSelectBlock: (id: string) => void }) {
  const layout = form.layout ?? defaultPaperLayout;
  const width = layout.orientation === "portrait" ? layout.widthIn : layout.heightIn;
  const height = layout.orientation === "portrait" ? layout.heightIn : layout.widthIn;
  const scale = 72;
  return <div className="relative mx-auto bg-white shadow-lg" style={{ width: width * scale, minHeight: height * scale, paddingTop: layout.margins.top * scale, paddingRight: layout.margins.right * scale, paddingBottom: layout.margins.bottom * scale, paddingLeft: layout.margins.left * scale }}><div className="mb-4 border-b border-slate-300 pb-3 text-center text-xl font-semibold">{layout.heading}</div><div className="relative grid" style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(120px, 1fr))`, gridAutoRows: "64px" }}>{Array.from({ length: layout.rows * layout.columns }, (_, index) => { const row = Math.floor(index / layout.columns) + 1; const column = (index % layout.columns) + 1; const selected = selectedCell.row === row && selectedCell.column === column; return <button key={`${row}-${column}`} type="button" onClick={() => onSelectCell({ row, column })} className={cn("border border-slate-200 bg-white/40 text-[10px] text-slate-300", selected && "bg-sky-50 ring-2 ring-primary")} style={{ gridRow: row, gridColumn: column }}>{row}:{column}</button>; })}{(form.blocks ?? []).map((block) => <button key={block.id} type="button" onClick={() => onSelectBlock(block.id)} className={cn("z-10 overflow-hidden border border-slate-400 bg-white px-2 py-1 text-left text-sm shadow-sm", selectedBlockId === block.id && "border-primary ring-2 ring-sky-200")} style={{ gridRow: `${block.row} / span ${block.rowSpan}`, gridColumn: `${block.column} / span ${block.columnSpan}` }}><GridBlockPreview block={block} /></button>)}</div></div>;
}

function GridBlockPreview({ block }: { block: FormBlock }) {
  if (block.type === "oracleField" && block.field) return <span className="block"><span className="text-xs font-semibold text-slate-700">{block.field.displayLabel}</span><span className="mt-1 block h-7 rounded border border-slate-300 bg-slate-50 text-xs text-muted-foreground">{block.field.type}{block.field.required ? " - required" : ""}</span></span>;
  if (block.type === "sectionHeading") return <span className="block border-b border-slate-400 text-base font-semibold">{block.text}</span>;
  if (block.type === "divider") return <span className="mt-4 block border-t-2 border-slate-500" />;
  if (block.type === "spacer") return <span className="block text-xs text-muted-foreground">Spacer</span>;
  return <span className="block text-sm text-slate-700">{block.text}</span>;
}

function LayoutSettings({ layout, onChange, onPaperSizeChange }: { layout: PaperLayout; onChange: (patch: LayoutPatch) => void; onPaperSizeChange: (size: PaperSize) => void }) {
  return <section className="grid gap-3 border-b border-border pb-5"><h3 className="text-sm font-semibold">Page Setup</h3><label className="grid gap-1.5 text-sm font-medium">Heading<Input value={layout.heading} onChange={(event) => onChange({ heading: event.target.value })} /></label><div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-sm font-medium">Paper Size<Select value={layout.paperSize} onChange={(event) => onPaperSizeChange(event.target.value as PaperSize)}>{Object.entries(paperSizes).map(([value, paper]) => <option key={value} value={value}>{paper.label}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Orientation<Select value={layout.orientation} onChange={(event) => onChange({ orientation: event.target.value as PaperLayout["orientation"] })}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></Select></label></div>{layout.paperSize === "custom" ? <div className="grid grid-cols-2 gap-3"><NumberInput label="Width" value={layout.widthIn} onChange={(value) => onChange({ widthIn: value })} /><NumberInput label="Height" value={layout.heightIn} onChange={(value) => onChange({ heightIn: value })} /></div> : null}<div className="grid grid-cols-2 gap-3"><NumberInput label="Rows" value={layout.rows} onChange={(value) => onChange({ rows: Math.max(1, Math.round(value)) })} /><NumberInput label="Columns" value={layout.columns} onChange={(value) => onChange({ columns: Math.max(1, Math.round(value)) })} /></div><div className="grid grid-cols-2 gap-3"><NumberInput label="Top Margin" value={layout.margins.top} onChange={(value) => onChange({ margins: { top: value } })} /><NumberInput label="Right Margin" value={layout.margins.right} onChange={(value) => onChange({ margins: { right: value } })} /><NumberInput label="Bottom Margin" value={layout.margins.bottom} onChange={(value) => onChange({ margins: { bottom: value } })} /><NumberInput label="Left Margin" value={layout.margins.left} onChange={(value) => onChange({ margins: { left: value } })} /></div></section>;
}

function BlockSettings({ block, onChange, onFieldChange, onRemove, maxRows, maxColumns }: { block: FormBlock | null; onChange: (patch: Partial<FormBlock>) => void; onFieldChange: (patch: Partial<FormFieldConfig>) => void; onRemove: () => void; maxRows: number; maxColumns: number }) {
  if (!block) return <div className="rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Select a page block to edit placement and formatting.</div>;
  return <section className="grid gap-4"><h3 className="text-sm font-semibold">Selected Block</h3><div className="grid grid-cols-2 gap-3"><NumberInput label="Row" value={block.row} onChange={(value) => onChange({ row: clamp(Math.round(value), 1, maxRows) })} /><NumberInput label="Column" value={block.column} onChange={(value) => onChange({ column: clamp(Math.round(value), 1, maxColumns) })} /><NumberInput label="Row Span" value={block.rowSpan} onChange={(value) => onChange({ rowSpan: Math.max(1, Math.round(value)) })} /><NumberInput label="Column Span" value={block.columnSpan} onChange={(value) => onChange({ columnSpan: Math.max(1, Math.round(value)) })} /></div>{block.type === "oracleField" && block.field ? <OracleFieldSettings field={block.field} onChange={onFieldChange} /> : block.type === "staticText" || block.type === "sectionHeading" ? <label className="grid gap-1.5 text-sm font-medium">Text<Textarea value={block.text ?? ""} onChange={(event) => onChange({ text: event.target.value })} /></label> : null}<Button variant="danger" onClick={onRemove}><Trash2 className="h-4 w-4" /> Remove Block</Button></section>;
}

function OracleFieldSettings({ field, onChange }: { field: FormFieldConfig; onChange: (patch: Partial<FormFieldConfig>) => void }) {
  return <div className="grid gap-3"><label className="grid gap-1.5 text-sm font-medium">Display Label<Input value={field.displayLabel} onChange={(event) => onChange({ displayLabel: event.target.value })} /></label><div className="grid gap-2">{(["required", "readOnly", "visible"] as const).map((key) => <label key={key} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"><span>{key === "readOnly" ? "Read-only" : key[0].toUpperCase() + key.slice(1)}</span><input type="checkbox" checked={Boolean(field[key])} onChange={(event) => onChange({ [key]: event.target.checked })} /></label>)}</div>{(field.type === "text" || field.type === "textarea") && <div className="grid gap-3"><label className="grid gap-1.5 text-sm font-medium">Placeholder<Input value={field.placeholder ?? ""} onChange={(event) => onChange({ placeholder: event.target.value })} /></label><NumberInput label="Max Length" value={field.maxLength ?? 0} onChange={(value) => onChange({ maxLength: value > 0 ? Math.round(value) : undefined })} /></div>}{field.type === "dropdown" && <label className="grid gap-1.5 text-sm font-medium">Dropdown Options<Textarea value={(field.options ?? []).join("\n")} onChange={(event) => onChange({ options: event.target.value.split("\n").map((option) => option.trim()).filter(Boolean) })} /></label>}{field.type === "number" && <div className="grid grid-cols-2 gap-3"><NumberInput label="Decimals" value={field.decimalPrecision ?? 0} onChange={(value) => onChange({ decimalPrecision: Math.max(0, Math.round(value)) })} /><NumberInput label="Min Value" value={field.minValue ?? 0} onChange={(value) => onChange({ minValue: value })} /><NumberInput label="Max Value" value={field.maxValue ?? 0} onChange={(value) => onChange({ maxValue: value })} /></div>}{field.visible ? <Eye className="h-4 w-4 text-emerald-700" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}</div>;
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<Input type="number" step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
