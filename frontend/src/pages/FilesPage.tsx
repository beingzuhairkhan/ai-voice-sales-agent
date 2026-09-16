import { RefreshCw, FileText, Image, Download, ExternalLink, FolderOpen, CheckCircle2, XCircle } from 'lucide-react';
import { useFiles } from '@/hooks/useQueries';
import { PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs, DetailField, DetailGrid } from '@/components/ui/Breadcrumbs';
import { TableSkeleton, ErrorState, EmptyState, Skeleton } from '@/components/ui/States';
import { cn, truncate } from '@/lib/utils';
import type { FileAsset } from '@/types/api';

function fileIcon(type: string) {
  if (type.includes('image')) return <Image className="w-5 h-5" />;
  if (type.includes('pdf') || type.includes('document') || type.includes('resume')) return <FileText className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
}

export function FilesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useFiles();

  const files: FileAsset[] = data ?? [];

  return (
    <div>
      <PageHeader
        title="Files / Assets"
        description="Assets included in personalized WhatsApp follow-ups after calls — developer resume and architecture/build image."
        actions={
          <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
        }
      />

      <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100 mb-4">
        <FolderOpen className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <p className="text-sm text-brand-800">
          These assets are attached to personalized WhatsApp follow-up messages after calls complete. The follow-up includes the actual conversation context, the developer's mobile number, the resume, and the architecture/build image.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load files"
          message="The backend may not expose a files endpoint, or it is unreachable."
          onRetry={() => refetch()}
        />
      ) : files.length === 0 ? (
        <EmptyState
          title="No files configured"
          message="No assets are configured in the backend yet. Once the developer resume and architecture image are added, they will appear here."
          icon={<FolderOpen className="w-6 h-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div key={file._id ?? file.id ?? file.name} className="card p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  file.available ? 'bg-brand-50 text-brand-600' : 'bg-ink-100 text-ink-400'
                )}>
                  {fileIcon(file.type ?? file.mimeType ?? '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{file.name}</p>
                  <p className="text-xs text-ink-500 capitalize mt-0.5">{file.type ?? file.mimeType ?? 'Unknown type'}</p>
                </div>
                {file.available !== undefined && (
                  file.available ? (
                    <Badge variant="success"><CheckCircle2 className="w-3 h-3" /> Available</Badge>
                  ) : (
                    <Badge variant="error"><XCircle className="w-3 h-3" /> Unavailable</Badge>
                  )
                )}
              </div>

              {file.description && (
                <p className="text-xs text-ink-500 mb-4 flex-1">{file.description}</p>
              )}

              {file.url && (
                <div className="flex items-center gap-2 mt-auto">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs flex-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview
                  </a>
                  <a
                    href={file.url}
                    download={file.name}
                    className="btn-secondary text-xs flex-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              )}

              {file.status && !file.url && (
                <p className="text-xs text-ink-400 mt-auto">Status: {file.status}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
