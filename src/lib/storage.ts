import type { FormBlock, FormDefinition, FormSection, InspectionSubmission, PaperLayout } from "@/lib/types";

const FORMS_KEY = "oracle-quality-mvp.forms";
const SUBMISSIONS_KEY = "oracle-quality-mvp.submissions";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getForms() {
  return readJson<FormDefinition[]>(FORMS_KEY, []).map(normalizeFormDefinition);
}

export function getForm(id: string) {
  return getForms().find((form) => form.id === id) ?? null;
}

export function saveForm(form: FormDefinition) {
  const normalized = normalizeFormDefinition(form);
  const forms = getForms();
  const index = forms.findIndex((item) => item.id === form.id);
  const next = index >= 0 ? forms.map((item) => (item.id === form.id ? normalized : item)) : [normalized, ...forms];
  writeJson(FORMS_KEY, next);
  window.dispatchEvent(new Event("forms-updated"));
}

export function getPublishedForms() {
  return getForms().filter((form) => form.status === "published");
}

export function getSubmissions() {
  return readJson<InspectionSubmission[]>(SUBMISSIONS_KEY, []);
}

export function getSubmission(id: string) {
  return getSubmissions().find((submission) => submission.id === id) ?? null;
}

export function saveSubmission(submission: InspectionSubmission) {
  writeJson(SUBMISSIONS_KEY, [submission, ...getSubmissions()]);
}

export const defaultPaperLayout: PaperLayout = {
  paperSize: "letter",
  orientation: "portrait",
  widthIn: 8.5,
  heightIn: 11,
  margins: {
    top: 0.5,
    right: 0.5,
    bottom: 0.5,
    left: 0.5
  },
  heading: "Incoming Inspection Record",
  rows: 12,
  columns: 4
};

export function normalizeFormDefinition(form: FormDefinition): FormDefinition {
  const layout = {
    ...defaultPaperLayout,
    ...form.layout,
    margins: {
      ...defaultPaperLayout.margins,
      ...form.layout?.margins
    }
  };

  const blocks = form.blocks && form.blocks.length > 0 ? form.blocks : sectionsToBlocks(form.sections);

  return {
    ...form,
    layout,
    blocks,
    sections: blocksToSections(blocks, form.sections)
  };
}

function sectionsToBlocks(sections: FormSection[]): FormBlock[] {
  const blocks: FormBlock[] = [];
  let row = 1;

  for (const section of sections) {
    blocks.push({
      id: `heading-${section.id}`,
      type: "sectionHeading",
      row,
      column: 1,
      rowSpan: 1,
      columnSpan: 4,
      text: section.title
    });
    row += 1;

    section.fields.forEach((field, index) => {
      blocks.push({
        id: field.id,
        type: "oracleField",
        row: row + Math.floor(index / 2),
        column: index % 2 === 0 ? 1 : 3,
        rowSpan: 1,
        columnSpan: 2,
        field
      });
    });
    row += Math.max(1, Math.ceil(section.fields.length / 2));
  }

  return blocks;
}

export function blocksToSections(blocks: FormBlock[], fallback: FormSection[] = []): FormSection[] {
  const fields = blocks.flatMap((block) => (block.type === "oracleField" && block.field ? [block.field] : []));
  return [
    {
      id: fallback[0]?.id ?? "paper-grid-fields",
      title: fallback[0]?.title ?? "Inspection Fields",
      fields
    }
  ];
}
