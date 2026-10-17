// FILE: frontend/src/components/ResourceSummaryBadge.jsx
import { useState } from 'react';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import ResourceSummaryModal from './ResourceSummaryModal';

/**
 * ResourceSummaryBadge
 * Compact inline component that sits inside each resource card.
 * Shows 4 possible states: none, generated, failed, pending.
 */
export default function ResourceSummaryBadge({
  groupId,
  resourceId,
  resourceType,
  existingSummary,
  resourceTitle,
  resourceUrl,
  onSummaryGenerated
}) {
  // Normalize: treat empty objects or summaries without a valid status as null
  const [summaryData, setSummaryData] = useState(
    existingSummary && existingSummary.status ? existingSummary : null
  );
  const [modalOpen, setModalOpen] = useState(false);

  const status = summaryData?.status || null;

  const handleModalClose = () => setModalOpen(false);

  const handleSummaryGenerated = (newSummary) => {
    setSummaryData(newSummary);
    onSummaryGenerated?.(newSummary);
  };

  return (
    <>
      {/* ─── STATE D: Pending ─── */}
      {status === 'pending' && (
        <div className="mt-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium animate-pulse">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            Generating…
          </span>
        </div>
      )}

      {/* ─── STATE B: Generated ─── */}
      {status === 'generated' && (
        <div className="mt-2 mb-1 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-[11px] font-semibold">
              <CheckCircle size={11} />
              AI Summary
            </span>
            {summaryData?.text && (
              <span className="text-xs text-gray-500 line-clamp-1 max-w-[160px]">
                {summaryData.text.length > 60
                  ? summaryData.text.slice(0, 60) + '…'
                  : summaryData.text}
              </span>
            )}
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs text-green-600 underline underline-offset-2 hover:text-green-800 w-fit transition-colors"
          >
            View full summary
          </button>
        </div>
      )}

      {/* ─── STATE C: Failed ─── */}
      {status === 'failed' && (
        <div className="mt-2 mb-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[11px] font-medium">
            <AlertCircle size={11} />
            Summary unavailable
          </span>
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs text-green-600 underline underline-offset-2 hover:text-green-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── STATE A: No summary yet ─── */}
      {!status && (
        <div className="mt-2 mb-1">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-green-300 text-green-600 rounded-full text-xs font-medium hover:bg-green-50 transition-colors"
          >
            <Sparkles size={12} />
            Summarize with AI
          </button>
        </div>
      )}

      {/* ─── Modal ─── */}
      {modalOpen && (
        <ResourceSummaryModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          groupId={groupId}
          resourceId={resourceId}
          resourceType={resourceType}
          resourceTitle={resourceTitle}
          resourceUrl={resourceUrl}
          existingSummary={summaryData}
          onSummaryGenerated={handleSummaryGenerated}
        />
      )}
    </>
  );
}
