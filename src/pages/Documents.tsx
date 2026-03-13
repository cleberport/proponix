import { FileText } from 'lucide-react';

const Documents = () => {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Documents</h1>
        <p className="text-sm text-muted-foreground">Your generated documents</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-20">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Generated PDFs will appear here</p>
      </div>
    </div>
  );
};

export default Documents;
