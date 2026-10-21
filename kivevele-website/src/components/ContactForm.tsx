import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { contact } from "../data/site";

const topics = ["Research partnership", "Consultancy", "Speaking invitation", "Graduate study", "Media", "Something else"];

type Errors = Partial<Record<"name" | "email" | "message", string>>;

export default function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", org: "", topic: topics[0], message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [opened, setOpened] = useState(false);

  const validate = (v = values): Errors => {
    const e: Errors = {};
    if (!v.name.trim()) e.name = "Add your name so he knows who is writing.";
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = "Enter an email address like name@example.com.";
    if (v.message.trim().length < 10) e.message = "Write a short message, at least a sentence.";
    return e;
  };

  const set = (k: keyof typeof values, val: string) => {
    const next = { ...values, [k]: val };
    setValues(next);
    if (errors[k as keyof Errors]) setErrors((prev) => ({ ...prev, [k]: validate(next)[k as keyof Errors] }));
  };

  const blur = (k: keyof Errors) => {
    if (values[k]) setErrors((prev) => ({ ...prev, [k]: validate()[k] }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`cf-${first}`)?.focus();
      return;
    }
    const subject = `${values.topic}: ${values.name.trim()}${values.org.trim() ? ` (${values.org.trim()})` : ""}`;
    const body = `${values.message.trim()}\n\n${values.name.trim()}\n${values.email.trim()}${values.org.trim() ? `\n${values.org.trim()}` : ""}`;
    window.location.href = `mailto:${contact.emailPrimary}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  const field = "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-ink transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100";
  const errField = "border-red-500 focus:border-red-500 focus:ring-red-100";

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl bg-white p-6 shadow-lift sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="text-sm font-semibold">Your name</label>
          <input id="cf-name" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")}
            aria-invalid={!!errors.name} aria-describedby={errors.name ? "cf-name-err" : undefined} className={`${field} ${errors.name ? errField : ""}`} />
          {errors.name && <p id="cf-name-err" className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="cf-email" className="text-sm font-semibold">Email</label>
          <input id="cf-email" type="email" autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")}
            aria-invalid={!!errors.email} aria-describedby={errors.email ? "cf-email-err" : undefined} className={`${field} ${errors.email ? errField : ""}`} />
          {errors.email && <p id="cf-email-err" className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="cf-org" className="text-sm font-semibold">Organisation <span className="font-normal text-slate-500">(optional)</span></label>
          <input id="cf-org" autoComplete="organization" value={values.org} onChange={(e) => set("org", e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="cf-topic" className="text-sm font-semibold">Topic</label>
          <select id="cf-topic" value={values.topic} onChange={(e) => set("topic", e.target.value)} className={field}>
            {topics.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="cf-message" className="text-sm font-semibold">Message</label>
          <textarea id="cf-message" rows={5} value={values.message} onChange={(e) => set("message", e.target.value)} onBlur={() => blur("message")}
            aria-invalid={!!errors.message} aria-describedby={errors.message ? "cf-message-err" : undefined} className={`${field} resize-y ${errors.message ? errField : ""}`} />
          {errors.message && <p id="cf-message-err" className="mt-1.5 text-sm text-red-600">{errors.message}</p>}
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" className="btn-teal">
          <Send size={18} aria-hidden="true" /> Send message
        </button>
        <p className="text-sm text-slate-500" aria-live="polite">
          {opened ? "Your email app should now be open with the message ready to send." : "Opens your email app with the message filled in."}
        </p>
      </div>
    </form>
  );
}
