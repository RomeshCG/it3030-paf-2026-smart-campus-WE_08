import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Own comment: match authorId to currentUserId when present; else fall back to display name.
 */
export default function CommentSection({
  comments = [],
  currentUserId,
  currentUserName,
  isAdmin,
  onAdd,
  onUpdate,
  onDelete,
  disabled = false,
  isUser,
}) {
  const [newMsg, setNewMsg] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const t = newMsg.trim();
    if (!t) return;
    onAdd?.(t);
    setNewMsg('');
  };

  const content = (
    <>
      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Write a comment…"
          disabled={disabled}
          maxLength={4000}
          className={isUser ? "form-control flex-1" : "flex-1"}
        />
        {isUser ? (
          <button type="submit" disabled={disabled || !newMsg.trim()} className="btn btn-primary">
            Add comment
          </button>
        ) : (
          <Button type="submit" disabled={disabled || !newMsg.trim()}>
            Add comment
          </Button>
        )}
      </form>
      <ul className="space-y-3">
        {comments.length === 0 ? (
          <li className={`text-sm ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-500'}`}>No comments yet.</li>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isAdmin={isAdmin}
              disabled={disabled}
              editingId={editingId}
              editText={editText}
              setEditingId={setEditingId}
              setEditText={setEditText}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isUser={isUser}
            />
          ))
        )}
      </ul>
    </>
  );

  if (isUser) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
        <CardDescription>Discuss updates with support staff.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {content}
      </CardContent>
    </Card>
  );
}

function CommentItem({
  comment: c,
  currentUserId,
  currentUserName,
  isAdmin,
  disabled,
  editingId,
  editText,
  setEditingId,
  setEditText,
  onUpdate,
  onDelete,
  isUser,
}) {
  const isAuthor =
    (currentUserId != null && c.authorId === currentUserId) ||
    (!!currentUserName &&
      !!c.authorName &&
      c.authorName.trim() === currentUserName.trim());
  const isEditing = editingId === c.id;

  return (
    <li className={isUser ? "rounded-lg border border-[var(--glass-border)] bg-[rgba(0,0,0,0.2)] p-3" : "rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${isUser ? 'text-[var(--text-primary)]' : 'text-slate-900 dark:text-slate-100'}`}>{c.authorName}</p>
          <p className={`text-xs ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-500'}`}>
            {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
            {c.updatedAt && c.updatedAt !== c.createdAt ? ' · edited' : ''}
          </p>
        </div>
        <div className="flex gap-1">
          {isAuthor ? (
            isUser ? (
              <button
                type="button"
                className="btn btn-secondary text-xs px-2 py-1 h-auto"
                disabled={disabled}
                onClick={() => {
                  setEditingId(isEditing ? null : c.id);
                  setEditText(c.message);
                }}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  setEditingId(isEditing ? null : c.id);
                  setEditText(c.message);
                }}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )
          ) : null}
          {(isAuthor || isAdmin) && (
            isUser ? (
              <button
                type="button"
                className="btn btn-secondary text-xs px-2 py-1 h-auto text-[var(--danger)] border-[var(--danger)]"
                disabled={disabled}
                onClick={() => {
                  if (window.confirm('Delete this comment?')) onDelete?.(c.id);
                }}
              >
                Delete
              </button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={disabled}
                onClick={() => {
                  if (window.confirm('Delete this comment?')) onDelete?.(c.id);
                }}
              >
                Delete
              </Button>
            )
          )}
        </div>
      </div>
      {isEditing ? (
        <div className="mt-2 space-y-2">
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={4000}
            disabled={disabled}
            className={isUser ? "form-control" : ""}
          />
          {isUser ? (
            <button
              type="button"
              className="btn btn-primary text-xs"
              disabled={disabled || !editText.trim()}
              onClick={() => {
                onUpdate?.(c.id, editText.trim());
                setEditingId(null);
              }}
            >
              Save
            </button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={disabled || !editText.trim()}
              onClick={() => {
                onUpdate?.(c.id, editText.trim());
                setEditingId(null);
              }}
            >
              Save
            </Button>
          )}
        </div>
      ) : (
        <p className={`mt-2 whitespace-pre-wrap text-sm ${isUser ? 'text-[var(--text-primary)]' : 'text-slate-700 dark:text-slate-300'}`}>{c.message}</p>
      )}
    </li>
  );
}
