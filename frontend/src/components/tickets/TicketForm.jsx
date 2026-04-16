import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TICKET_CATEGORY, TICKET_CONTACT_METHODS, TICKET_PRIORITY } from '@/services/ticketsApi';

const defaultState = {
  title: '',
  category: 'OTHER',
  description: '',
  priority: 'MEDIUM',
  preferredContactMethod: 'EMAIL',
  preferredContactDetails: '',
  locationOrResource: '',
};

export default function TicketForm({
  initial = defaultState,
  onSubmit,
  submitLabel = 'Submit ticket',
  disabled = false,
  extraBelow,
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({ ...defaultState, ...initial });
  }, [initial]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.title?.trim()) next.title = 'Title is required';
    if (!form.description?.trim()) next.description = 'Description is required';
    if (!form.category) next.category = 'Category is required';
    if (!form.priority) next.priority = 'Priority is required';
    if (!form.preferredContactMethod) next.preferredContactMethod = 'Contact method is required';
    if (form.preferredContactMethod !== 'ANY' && !form.preferredContactDetails?.trim()) {
      next.preferredContactDetails = 'Contact details are required for the selected method';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit?.({
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      priority: form.priority,
      preferredContactMethod: form.preferredContactMethod,
      preferredContactDetails: form.preferredContactDetails?.trim() || undefined,
      locationOrResource: form.locationOrResource?.trim() || undefined,
    });
  };

  const methodLabel =
    form.preferredContactMethod === 'ANY' ? 'Preferred contact details (optional)' : 'Preferred contact details';

  const methodPlaceholderByType = {
    EMAIL: 'e.g. student@campus.edu',
    PHONE: 'e.g. +94 77 123 4567',
    WHATSAPP: 'e.g. +94 77 123 4567',
    TEAMS: 'e.g. your Teams username',
    ANY: 'Phone, email, or any contact you check often',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="tf-title">Title</Label>
        <Input
          id="tf-title"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          disabled={disabled}
          className="mt-1"
          maxLength={255}
          placeholder="Short summary of the issue"
        />
        {errors.title ? <p className="mt-1 text-xs text-destructive">{errors.title}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="tf-cat">Category</Label>
          <select
            id="tf-cat"
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            disabled={disabled}
          >
            {TICKET_CATEGORY.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category ? <p className="mt-1 text-xs text-destructive">{errors.category}</p> : null}
        </div>
        <div>
          <Label htmlFor="tf-pr">Priority</Label>
          <select
            id="tf-pr"
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={form.priority}
            onChange={(e) => setField('priority', e.target.value)}
            disabled={disabled}
          >
            {TICKET_PRIORITY.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.priority ? <p className="mt-1 text-xs text-destructive">{errors.priority}</p> : null}
        </div>
      </div>
      <div>
        <Label htmlFor="tf-desc">Description</Label>
        <textarea
          id="tf-desc"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          disabled={disabled}
          rows={5}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
          maxLength={4000}
          placeholder="What happened, when it started, and how it affects your work."
        />
        {errors.description ? <p className="mt-1 text-xs text-destructive">{errors.description}</p> : null}
      </div>
      <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Contact and location</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Help support reach you faster.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="tf-contact-method">Preferred contact method</Label>
            <select
              id="tf-contact-method"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={form.preferredContactMethod}
              onChange={(e) => setField('preferredContactMethod', e.target.value)}
              disabled={disabled}
            >
              {TICKET_CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace('_', ' ')}
                </option>
              ))}
            </select>
            {errors.preferredContactMethod ? (
              <p className="mt-1 text-xs text-destructive">{errors.preferredContactMethod}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="tf-contact">{methodLabel}</Label>
            <Input
              id="tf-contact"
              value={form.preferredContactDetails}
              onChange={(e) => setField('preferredContactDetails', e.target.value)}
              disabled={disabled}
              className="mt-1"
              maxLength={500}
              placeholder={methodPlaceholderByType[form.preferredContactMethod] || 'Contact details'}
            />
            {errors.preferredContactDetails ? (
              <p className="mt-1 text-xs text-destructive">{errors.preferredContactDetails}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="tf-loc">Location / resource</Label>
          <Input
            id="tf-loc"
            value={form.locationOrResource}
            onChange={(e) => setField('locationOrResource', e.target.value)}
            disabled={disabled}
            className="mt-1"
            maxLength={500}
            placeholder="Room, lab, building, asset tag..."
          />
        </div>
      </div>
      {extraBelow}
      <Button type="submit" disabled={disabled} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
