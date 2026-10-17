// FILE: frontend/src/components/ResourceSummaryModal.jsx
import { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  BookOpen,
  Copy,
  RefreshCw,
  X,
  AlertTriangle,
  FileText,
  Link,
  CheckCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';

const LOADING_MESSAGES = [
  'Reading resource metadata…',
  'Analyzing content type…',
  'Crafting your summary…',
  'Almost done…'
];

/**
 * ResourceSummaryModal
 * Full modal with AI summary generation and display.
 */
export default function ResourceSummaryModal({
  isOpen,
  onClose,
  groupId,
  resourceId,
  resourceType,
  resourceTitle,
  resourceUrl,
  existingSummary,
  onSummaryGenerated
}) {
  const [summaryState, setSummaryState] = useState(existingSummary || null);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [showGenerate, setShowGenerate] = useState(
    !existingSummary || !existingSummary?.status || existingSummary?.status === 'failed'
  );

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  // ESC key close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [loading, onClose]);

  if (!isOpen) return null;

  // ── Parse 3 sentences from summary text ─────────────────────────────────
  const parseSentences = (text = '') => {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return [
      sentences[0] || '',
      sentences[1] || '',
      sentences.slice(2).join(' ') || ''
    ];
  };

  // ── Generate AI Summary ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setLoadingMsgIdx(0);
    try {
      const res = await api.post(
        `/groups/${groupId}/resources/${resourceId}/summarize`
      );
      const newSummary = {
        text: res.data.data.summary,
        generatedAt: res.data.data.generatedAt,
        status: 'generated',
        cached: res.data.data.cached,
        fallback: res.data.data.fallback
      };
      setSummaryState(newSummary);
      setShowGenerate(false);
      onSummaryGenerated?.(newSummary);
      toast.success('Summary generated!');
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to generate summary';
      toast.error(msg);
      setError(msg);
      setSummaryState({ status: 'failed' });
    } finally {
      setLoading(false);
    }
  };

  // ── Copy summary ─────────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!summaryState?.text) return;
    try {
      await navigator.clipboard.writeText(summaryState.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const [s1, s2, s3] = parseSentences(summaryState?.text || '');

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-sm">AI Resource Summary</h2>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">
                {resourceTitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40 shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* ─── Loading State ─── */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="relative">
                <Loader2 size={40} className="text-green-500 animate-spin" />
              </div>
              <p className="text-sm text-slate-500 font-medium animate-pulse">
                {LOADING_MESSAGES[loadingMsgIdx]}
              </p>
            </div>
          )}

          {/* ─── Generate / Retry State ─── */}
          {!loading && (showGenerate || summaryState?.status === 'failed') && (
            <>
              {/* Resource Info Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {resourceType === 'file' ? (
                    <FileText size={18} className="text-slate-500" />
                  ) : (
                    <Link size={18} className="text-indigo-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{resourceTitle}</p>
                  {resourceType === 'link' && resourceUrl && (
                    <a
                      href={
                        resourceUrl.startsWith('http')
                          ? resourceUrl
                          : `https://${resourceUrl}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-500 hover:underline truncate block"
                    >
                      {resourceUrl.length > 50
                        ? resourceUrl.slice(0, 50) + '…'
                        : resourceUrl}
                    </a>
                  )}
                  {resourceType === 'file' && (
                    <p className="text-xs text-slate-500 truncate">{resourceUrl}</p>
                  )}
                </div>
              </div>

              {/* Info notice */}
              <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                {resourceType === 'link'
                  ? 'AI will analyze the title, URL, and tags to generate a summary of this resource.'
                  : 'AI will analyze the filename, title, and tags to generate a summary. File content is not read.'}
              </p>

              {/* Error card */}
              {(summaryState?.status === 'failed' || error) && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Previous attempt failed</p>
                    {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Generate AI Summary
              </button>
            </>
          )}

          {/* ─── Summary Display ─── */}
          {!loading && (summaryState?.status === 'generated') && !showGenerate && (
            <>
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 space-y-3">
                {/* Summary header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-green-600" />
                    <span className="text-sm font-bold text-green-800">AI Generated Summary</span>
                  </div>
                  {summaryState?.generatedAt && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatDistanceToNow(new Date(summaryState.generatedAt), {
                        addSuffix: true
                      })}
                    </span>
                  )}
                </div>

                {/* Full text */}
                <p className="text-sm text-slate-700 leading-relaxed">
                  {summaryState.text}
                </p>

                {/* 3-sentence breakdown */}
                {(s1 || s2 || s3) && (
                  <div className="space-y-1.5 pt-2 border-t border-green-100">
                    {s1 && (
                      <div className="flex gap-2 items-start text-xs text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1" />
                        {s1}
                      </div>
                    )}
                    {s2 && (
                      <div className="flex gap-2 items-start text-xs text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-1" />
                        {s2}
                      </div>
                    )}
                    {s3 && (
                      <div className="flex gap-2 items-start text-xs text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 mt-1" />
                        {s3}
                      </div>
                    )}
                  </div>
                )}

                {/* Notices */}
                {summaryState?.cached && (
                  <p className="text-[10px] text-gray-400 italic">
                    Summary retrieved from cache
                  </p>
                )}
                {summaryState?.fallback && (
                  <div className="flex items-center gap-1.5 text-[11px] text-orange-600 bg-orange-50 border border-orange-100 rounded px-2 py-1">
                    <AlertTriangle size={12} />
                    AI was unavailable — this is an auto-generated summary
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowGenerate(true);
                    setSummaryState(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw size={13} />
                  Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle size={13} className="text-green-500" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      Copy Summary
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
