import { Button } from '../ui/button';
import { FileText, Trash2 } from 'lucide-react';

export function DocumentList({ documents }: { documents: any[] }) {
  return (
    <div className="border rounded-lg divide-y">
      {documents.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No documents uploaded yet
        </div>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{doc.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))
      )}
    </div>
  );
}