import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TICKET_CATEGORY, TICKET_PRIORITY } from '@/services/ticketsApi';

const defaultState = {
  title: '',
  category: 'OTHER',
  description: '',
  priority: 'MEDIUM',
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
      preferredContactDetails: form.preferredContactDetails?.trim() || undefined,
      locationOrResource: form.locationOrResource?.trim() || undefined,
    });
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
        />
        {errors.description ? <p className="mt-1 text-xs text-destructive">{errors.description}</p> : null}
      </div>
      <div>
        <Label htmlFor="tf-contact">Preferred contact details</Label>
        <Input
          id="tf-contact"
          value={form.preferredContactDetails}
          onChange={(e) => setField('preferredContactDetails', e.target.value)}
          disabled={disabled}
          className="mt-1"
          maxLength={500}
          placeholder="Phone, email, or preferred channel"
        />
      </div>
      <div>
        <Label htmlFor="tf-loc">Location / resource</Label>
        <Input
          id="tf-loc"
          value={form.locationOrResource}
          onChange={(e) => setField('locationOrResource', e.target.value)}
          disabled={disabled}
          className="mt-1"
          maxLength={500}
          placeholder="Room, lab, asset tag…"
        />
      </div>
      {extraBelow}
      <Button type="submit" disabled={disabled}>
        {submitLabel}
      </Button>
    </form>
  );
}
