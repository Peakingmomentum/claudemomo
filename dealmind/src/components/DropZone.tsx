'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Props {
  fileType: string;
  label?: string;
  onUploaded?: (storagePath: string, fileName: string) => void;
}

export function DropZone({ fileType, label = 'Drop files or click to upload', onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const supabase = createSupabaseBrowserClient();

  async function upload(files: FileList | File[]) {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const file of Array.from(files)) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('knowledge').upload(path, file);
        if (error) {
          console.error(error);
          continue;
        }
        await supabase.from('knowledge_files').insert({
          user_id: user.id,
          file_name: file.name,
          file_type: fileType,
          storage_path: path
        });
        setUploaded(u => [...u, file.name]);
        onUploaded?.(path, file.name);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <label
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files) upload(e.dataTransfer.files);
      }}
      style={{
        display: 'block',
        padding: 24,
        border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 16,
        background: dragging ? 'rgba(90,141,238,0.08)' : 'var(--surface)',
        textAlign: 'center',
        cursor: 'pointer',
        color: 'var(--muted)'
      }}
    >
      <input
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && upload(e.target.files)}
      />
      {uploading ? 'Uploading…' : label}
      {uploaded.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--success)' }}>
          ✓ {uploaded.length} uploaded
        </div>
      )}
    </label>
  );
}
