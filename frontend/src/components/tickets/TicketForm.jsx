import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Type, Tags, AlertCircle, FileText, PhoneCall, MapPin, Send, Cpu, MonitorSmartphone, Wifi, Zap, Building, Package } from 'lucide-react';
import { TICKET_CATEGORY, TICKET_CONTACT_METHODS, TICKET_PRIORITY } from '@/services/ticketsApi';

const CategoryIcon = ({ category, className }) => {
  switch(category) {
    case 'HARDWARE': return <Cpu className={className} />;
    case 'SOFTWARE': return <MonitorSmartphone className={className} />;
    case 'NETWORK': return <Wifi className={className} />;
    case 'ELECTRICAL': return <Zap className={className} />;
    case 'FACILITY': return <Building className={className} />;
    case 'OTHER': default: return <Package className={className} />;
  }
};

const CategorySelector = ({ category, setCategory, disabled }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-1.5">
      {TICKET_CATEGORY.map((c) => (
        <button
          key={c}
          type="button"
          disabled={disabled}
          onClick={() => setCategory(c)}
          className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
            category === c 
              ? 'border-[var(--accent-color)] bg-[rgba(99,102,241,0.15)] shadow-[0_0_20px_rgba(99,102,241,0.25)] transform scale-[1.02]' 
              : 'border-[var(--border-color)] bg-[rgba(0,0,0,0.3)] hover:border-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)]'
          }`}
        >
          <CategoryIcon category={c} className={`h-6 w-6 transition-colors duration-300 ${category === c ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)] opacity-70'}`} />
          <span className={`text-xs font-bold tracking-wide text-center transition-colors duration-300 ${category === c ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            {c.replace(/_/g, ' ')}
          </span>
        </button>
      ))}
    </div>
  );
};

const PrioritySelector = ({ priority, setPriority, disabled }) => {
  return (
    <div className="flex flex-wrap gap-3 mt-1.5">
      {TICKET_PRIORITY.map((p) => {
        let colorClass = '';
        if (p === 'LOW') colorClass = 'text-emerald-400 border-emerald-500/30 hover:border-emerald-500';
        if (p === 'MEDIUM') colorClass = 'text-amber-400 border-amber-500/30 hover:border-amber-500';
        if (p === 'HIGH') colorClass = 'text-rose-400 border-rose-500/30 hover:border-rose-500 hover:shadow-[0_0_10px_rgba(225,29,72,0.2)]';
        if (priority === p) {
          if (p === 'LOW') colorClass = 'text-emerald-300 border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.3)] scale-[1.05]';
          if (p === 'MEDIUM') colorClass = 'text-amber-300 border-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-[1.05]';
          if (p === 'HIGH') colorClass = 'text-rose-300 border-rose-400 bg-rose-500/20 shadow-[0_0_15px_rgba(251,113,133,0.3)] scale-[1.05]';
        }
        return (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => setPriority(p)}
            className={`px-5 py-2.5 rounded-xl border text-xs font-bold tracking-wider transition-all duration-300 ${colorClass} ${priority !== p ? 'bg-[rgba(0,0,0,0.4)] opacity-80' : ''}`}
          >
            {p}
          </button>
        )
      })}
    </div>
  );
};

const ContactMethodSelector = ({ method, setMethod, disabled }) => {
  return (
    <div className="flex flex-wrap bg-[rgba(0,0,0,0.4)] border border-[var(--glass-border)] p-1.5 rounded-xl w-full sm:w-fit mt-1.5 gap-1">
      {TICKET_CONTACT_METHODS.map((m) => (
        <button
          key={m}
          type="button"
          disabled={disabled}
          onClick={() => setMethod(m)}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
            method === m 
              ? 'bg-[var(--accent-color)] shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white border border-transparent scale-[1.02]' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] border border-transparent'
          }`}
        >
          {m.replace('_', ' ')}
        </button>
      ))}
    </div>
  );
};

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
  isUser,
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
    form.preferredContactMethod === 'ANY' ? 'Contact details (optional)' : 'Contact details';

  const methodPlaceholderByType = {
    EMAIL: 'e.g. student@campus.edu',
    PHONE: 'e.g. +94 77 123 4567',
    WHATSAPP: 'e.g. +94 77 123 4567',
    TEAMS: 'e.g. your Teams username',
    ANY: 'Phone, email, or any contact you check often',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={isUser ? "glass-section space-y-6" : "space-y-5"}>
        {isUser && <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-color)] mb-2">Core Details</h4>}
        
        <div>
          <Label htmlFor="tf-title" className={isUser ? "text-[var(--text-secondary)] flex items-center gap-2 mb-1.5" : ""}>
            {isUser && <Type className="h-4 w-4" />} Title
          </Label>
          <Input
            id="tf-title"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            disabled={disabled}
            className={isUser ? "form-control" : "mt-1"}
            maxLength={255}
            placeholder="Short summary of the issue"
          />
          {errors.title ? <p className="mt-1 text-xs text-destructive">{errors.title}</p> : null}
        </div>

        <div>
          <Label htmlFor="tf-cat" className={isUser ? "text-[var(--text-secondary)] flex items-center gap-2 mb-2" : ""}>
            {isUser && <Tags className="h-4 w-4" />} Category
          </Label>
          {isUser ? (
            <CategorySelector category={form.category} setCategory={(val) => setField('category', val)} disabled={disabled} />
          ) : (
            <select
              id="tf-cat"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              disabled={disabled}
            >
              {TICKET_CATEGORY.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          {errors.category ? <p className="mt-1 text-xs text-destructive">{errors.category}</p> : null}
        </div>

        <div>
          <Label htmlFor="tf-pr" className={isUser ? "text-[var(--text-secondary)] flex items-center gap-2 mb-2" : ""}>
            {isUser && <AlertCircle className="h-4 w-4" />} Priority
          </Label>
          {isUser ? (
            <PrioritySelector priority={form.priority} setPriority={(val) => setField('priority', val)} disabled={disabled} />
          ) : (
            <select
              id="tf-pr"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={form.priority}
              onChange={(e) => setField('priority', e.target.value)}
              disabled={disabled}
            >
              {TICKET_PRIORITY.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
          {errors.priority ? <p className="mt-1 text-xs text-destructive">{errors.priority}</p> : null}
        </div>

        <div>
          <Label htmlFor="tf-desc" className={isUser ? "text-[var(--text-secondary)] flex items-center gap-2 mb-1.5" : ""}>
            {isUser && <FileText className="h-4 w-4" />} Description
          </Label>
          <textarea
            id="tf-desc"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            disabled={disabled}
            rows={5}
            className={isUser ? "form-control w-full" : "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"}
            maxLength={4000}
            placeholder="What happened, when it started, and how it affects your work."
          />
          {errors.description ? <p className="mt-1 text-xs text-destructive">{errors.description}</p> : null}
        </div>
      </div>

      <div className={isUser ? "glass-section" : "rounded-lg border border-slate-200 p-4 dark:border-slate-800"}>
        {isUser ? (
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-color)] mb-5 mt-1">
             Context & Contact
          </h4>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Contact and location</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Help support reach you faster.</p>
          </>
        )}
        
        <div className={`space-y-5 ${!isUser ? 'mt-4 grid gap-5 sm:grid-cols-2 space-y-0' : ''}`}>
          <div>
            <Label htmlFor="tf-contact-method" className={isUser ? "text-[var(--text-secondary)] flex items-center gap-2 mb-2" : ""}>
               {isUser && <PhoneCall className="h-4 w-4" />} Preferred contact method
            </Label>
            {isUser ? (
              <ContactMethodSelector method={form.preferredContactMethod} setMethod={(val) => setField('preferredContactMethod', val)} disabled={disabled} />
            ) : (
              <select
                id="tf-contact-method"
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={form.preferredContactMethod}
                onChange={(e) => setField('preferredContactMethod', e.target.value)}
                disabled={disabled}
              >
                {TICKET_CONTACT_METHODS.map((m) => (
                  <option key={m} value={m}>{m.replace('_', ' ')}</option>
                ))}
              </select>
            )}
            {errors.preferredContactMethod ? <p className="mt-1 text-xs text-destructive">{errors.preferredContactMethod}</p> : null}
          </div>

          <div>
            <Label htmlFor="tf-contact" className={isUser ? "text-[var(--text-secondary)] flex items-center gap-2 mb-1.5" : ""}>
               {methodLabel}
            </Label>
            <Input
              id="tf-contact"
              value={form.preferredContactDetails}
              onChange={(e) => setField('preferredContactDetails', e.target.value)}
              disabled={disabled}
              className={isUser ? "form-control" : "mt-1"}
              maxLength={500}
              placeholder={methodPlaceholderByType[form.preferredContactMethod] || 'Contact details'}
            />
            {errors.preferredContactDetails ? <p className="mt-1 text-xs text-destructive">{errors.preferredContactDetails}</p> : null}
          </div>
        </div>

        <div className={isUser ? "mt-6" : "mt-5"}>
          <Label htmlFor="tf-loc" className={isUser ? "text-[var(--text-secondary)] flex items-center gap-2 mb-1.5" : ""}>
             {isUser && <MapPin className="h-4 w-4" />} Location / resource
          </Label>
          <Input
            id="tf-loc"
            value={form.locationOrResource}
            onChange={(e) => setField('locationOrResource', e.target.value)}
            disabled={disabled}
            className={isUser ? "form-control" : "mt-1"}
            maxLength={500}
            placeholder="Room, lab, building, asset tag..."
          />
        </div>
      </div>
      
      {extraBelow}
      
      <div className="pt-4">
        {isUser ? (
          <button type="submit" disabled={disabled} className="btn-glow w-full uppercase tracking-wider !py-3">
            {submitLabel} <Send className="h-5 w-5 ml-1 opacity-90" />
          </button>
        ) : (
          <Button type="submit" disabled={disabled} className="w-full sm:w-auto">
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
