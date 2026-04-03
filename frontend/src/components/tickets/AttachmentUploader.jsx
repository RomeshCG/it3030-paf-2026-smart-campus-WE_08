import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const MAX_FILES = 3;
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp';

function isLikelyImageFile(file) {
  if (file?.type?.startsWith('image/')) return true;
  const n = (file?.name || '').toLowerCase();
  return /\.(jpe?g|png|gif|webp)$/i.test(n);
}

function PreviewThumb({ file, disabled, onRemove }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <li className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        disabled={disabled}
        className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white disabled:opacity-50"
        onClick={onRemove}
      >
        ×
      </button>
    </li>
  );
}

export default function AttachmentUploader({
  files,
  onChange,
  disabled = false,
  previews = true,
  idPrefix = 'att',
}) {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState('');

  const addFiles = (list) => {
    setLocalError('');
    const incoming = Array.from(list || []).filter((f) => isLikelyImageFile(f));
    if (!incoming.length) {
      setLocalError('Only image files are allowed.');
      return;
    }
    const merged = [...files, ...incoming].slice(0, MAX_FILES);
    if (files.length + incoming.length > MAX_FILES) {
      setLocalError(`You can attach at most ${MAX_FILES} images.`);
    }
    onChange?.(merged);
  };

  const removeAt = (index) => {
    onChange?.(files.filter((_, i) => i !== index));
    setLocalError('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Label htmlFor={`${idPrefix}-file`}>Images (max {MAX_FILES})</Label>
        <input
          ref={inputRef}
          id={`${idPrefix}-file`}
          type="file"
          accept={ACCEPT}
          multiple
          disabled={disabled || files.length >= MAX_FILES}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || files.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
        >
          Choose images
        </Button>
      </div>
      {localError ? <p className="text-xs text-destructive">{localError}</p> : null}
      {previews && files.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {files.map((file, i) => (
            <PreviewThumb
              key={`${file.name}-${i}-${file.lastModified}`}
              file={file}
              disabled={disabled}
              onRemove={() => removeAt(i)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
