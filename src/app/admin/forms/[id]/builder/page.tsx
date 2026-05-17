"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { oracleConnector } from "@/lib/oracle/mock-oracle-connector";
import { getForm, saveForm } from "@/lib/storage";
import type { CollectionPlanField, FormDefinition, FormFieldConfig, FormSection } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FormBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [availableFields, setAvailableFields] = useState<CollectionPlanField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<CollectionPlanField | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    const stored = getForm(params.id);
    if (!stored) {
      router.replace("/admin/forms");
      return;
    }
    setForm(stored);
    oracleConnector.getCollectionPlanFields(stored.collectionPlanId).then(setAvailableFields);
  }, [params.id, router]);

  const selected = useMemo(() => {
    if (!form || !selectedFieldId) return null;
    for (const section of form.sections) {
      const field = section.fields.find((item) => item.id === selectedFieldId);
      if (field) return field;
    }
    return null;
  }, [form, selectedFieldId]);

  if (!form) return null;

  function updateForm(updater: (current: FormDefinition) => FormDefinition) {
    setForm((current) => (current ? updater(current) : current));
  }

  function onDragStart(event: DragStartEvent) {
    const fieldId = String(event.active.id).replace("available:", "");
    setActiveField(availableFields.find((field) => field.id === fieldId) ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveField(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    if (!overId || !form) return;

    if (activeId.startsWith("available:") && overId.startsWith("section:")) {
      const sourceField = availableFields.find((field) => field.id === activeId.replace("available:", ""));
      if (!sourceField) return;
      const newField: FormFieldConfig = {
        id: crypto.randomUUID(),
        sourceFieldId: sourceField.id,
        displayLabel: sourceField.label,
        type: sourceField.type,
        required: sourceField.required,
        readOnly: Boolean(sourceField.readOnly),
        visible: true,
        options: sourceField.options
      };
      const sectionId = overId.replace("section:", "");
      updateForm((current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        sections: current.sections.map((section) =>
          section.id === sectionId ? { ...section, fields: [...section.fields, newField] } : section
        )
      }));
      setSelectedFieldId(newField.id);
      return;
    }

    if (activeId.startsWith("canvas:") && overId.startsWith("canvas:")) {
      const activeFieldId = activeId.replace("canvas:", "");
      const overFieldId = overId.replace("canvas:", "");
      updateForm((current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        sections: current.sections.map((section) => {
          const oldIndex = section.fields.findIndex((field) => field.id === activeFieldId);
          const newIndex = section.fields.findIndex((field) => field.id === overFieldId);
          return oldIndex >= 0 && newIndex >= 0 ? { ...section, fields: arrayMove(section.fields, oldIndex, newIndex) } : section;
        })
      }));
    }
  }

  function updateSelected(patch: Partial<FormFieldConfig>) {
    if (!selected) return;
    updateForm((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      sections: current.sections.map((section) => ({
        ...section,
        fields: section.fields.map((field) => (field.id === selected.id ? { ...field, ...patch } : field))
      }))
    }));
  }

  function removeSelected() {
    if (!selected) return;
    updateForm((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      sections: current.sections.map((section) => ({
        ...section,
        fields: section.fields.filter((field) => field.id !== selected.id)
      }))
    }));
    setSelectedFieldId(null);
  }

  function addSection() {
    updateForm((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      sections: [...current.sections, { id: crypto.randomUUID(), title: "New Section", fields: [] }]
    }));
  }

  function updateSection(sectionId: string, title: string) {
    updateForm((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, title } : section))
    }));
  }

  function save(status: "draft" | "published") {
    const next = {
      ...form,
      status,
      updatedAt: new Date().toISOString(),
      publishedAt: status === "published" ? new Date().toISOString() : form.publishedAt
    };
    saveForm(next);
    setForm(next);
  }

  return (
    <PageShell>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link href="/admin/forms" className="text-sm text-primary hover:underline">
            Back to forms
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{form.name}</h1>
          <p className="mt-1 text-muted-foreground">Build a shop-floor inspection form from available Oracle fields.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => save("draft")}>
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={() => save("published")}>Publish Form</Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid gap-5 xl:grid-cols-[280px_1fr_320px]">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Available Oracle Fields</h2>
            </CardHeader>
            <CardContent className="grid gap-2">
              {availableFields.map((field) => (
                <AvailableField key={field.id} field={field} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="font-semibold">Form Canvas</h2>
              <Button variant="secondary" onClick={addSection}>
                <Plus className="h-4 w-4" /> Section
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {form.sections.map((section) => (
                <CanvasSection
                  key={section.id}
                  section={section}
                  selectedFieldId={selectedFieldId}
                  onSelect={setSelectedFieldId}
                  onTitleChange={updateSection}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">Field Configuration</h2>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="grid gap-4">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Display Label
                    <Input value={selected.displayLabel} onChange={(event) => updateSelected({ displayLabel: event.target.value })} />
                  </label>
                  {(["required", "readOnly", "visible"] as const).map((key) => (
                    <label key={key} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                      <span>{key === "readOnly" ? "Read-only" : key[0].toUpperCase() + key.slice(1)}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(selected[key])}
                        onChange={(event) => updateSelected({ [key]: event.target.checked })}
                      />
                    </label>
                  ))}
                  <Button variant="danger" onClick={removeSelected}>
                    <Trash2 className="h-4 w-4" /> Remove Field
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Select a field on the canvas to edit label, visibility, required, and read-only settings.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <DragOverlay>{activeField ? <FieldPill field={activeField} floating /> : null}</DragOverlay>
      </DndContext>
    </PageShell>
  );
}

function AvailableField({ field }: { field: CollectionPlanField }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `available:${field.id}` });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} {...listeners} {...attributes}>
      <FieldPill field={field} />
    </div>
  );
}

function FieldPill({ field, floating = false }: { field: CollectionPlanField; floating?: boolean }) {
  return (
    <div className={cn("cursor-grab rounded-md border border-border bg-white p-3 shadow-sm", floating && "shadow-lg")}>
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="text-sm font-medium">{field.label}</div>
          <div className="text-xs text-muted-foreground">{field.type}</div>
        </div>
      </div>
    </div>
  );
}

function CanvasSection({
  section,
  selectedFieldId,
  onSelect,
  onTitleChange
}: {
  section: FormSection;
  selectedFieldId: string | null;
  onSelect: (id: string) => void;
  onTitleChange: (sectionId: string, title: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `section:${section.id}` });

  return (
    <section ref={setNodeRef} className={cn("rounded-lg border border-border bg-slate-50 p-4", isOver && "border-primary bg-sky-50")}>
      <Input className="mb-3 bg-white font-semibold" value={section.title} onChange={(event) => onTitleChange(section.id, event.target.value)} />
      <SortableContext items={section.fields.map((field) => `canvas:${field.id}`)} strategy={verticalListSortingStrategy}>
        <div className="grid min-h-20 gap-2">
          {section.fields.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-white p-5 text-center text-sm text-muted-foreground">
              Drop fields here
            </div>
          ) : (
            section.fields.map((field) => (
              <SortableCanvasField key={field.id} field={field} selected={field.id === selectedFieldId} onSelect={onSelect} />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableCanvasField({ field, selected, onSelect }: { field: FormFieldConfig; selected: boolean; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `canvas:${field.id}` });
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => onSelect(field.id)}
      className={cn(
        "flex w-full items-center justify-between rounded-md border bg-white p-3 text-left shadow-sm",
        selected ? "border-primary ring-2 ring-sky-100" : "border-border"
      )}
    >
      <span className="flex items-center gap-2">
        <span {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </span>
        <span>
          <span className="block text-sm font-medium">{field.displayLabel}</span>
          <span className="text-xs text-muted-foreground">
            {field.type} {field.required ? "required" : "optional"} {field.readOnly ? "read-only" : ""}
          </span>
        </span>
      </span>
      {field.visible ? <Eye className="h-4 w-4 text-emerald-700" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}
