import type { FormDefinition, InspectionSubmission } from "@/lib/types";

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
  return readJson<FormDefinition[]>(FORMS_KEY, []);
}

export function getForm(id: string) {
  return getForms().find((form) => form.id === id) ?? null;
}

export function saveForm(form: FormDefinition) {
  const forms = getForms();
  const index = forms.findIndex((item) => item.id === form.id);
  const next = index >= 0 ? forms.map((item) => (item.id === form.id ? form : item)) : [form, ...forms];
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
