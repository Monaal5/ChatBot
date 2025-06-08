'use client';

import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export function DocumentUpload({ companyId }: { companyId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      toast.success('Document uploaded and processed successfully!');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Failed to upload document', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept=".pdf,.docx,.csv,.txt,.md"
          className="hidden"
          disabled={isUploading}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
        <p className="text-sm text-muted-foreground">
          PDF, DOCX, CSV, TXT files supported
        </p>
      </div>
    </div>
  );
}