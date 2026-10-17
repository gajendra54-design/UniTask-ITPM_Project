import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Download, X, QrCode, Copy, Check, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function FlashcardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfTitleError, setPdfTitleError] = useState("");
  const [generatePdfLoading, setGeneratePdfLoading] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const res = await api.get(`/study/${id}`);
        setMaterial(res.data.data);
        setCards(res.data.data.flashcards || []);
      } catch (err) {
        console.error("Failed to load study material", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [id]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : prev));
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }, 150);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const closePDFModal = () => {
    setIsPDFModalOpen(false);
    setPdfTitle("");
    setPdfTitleError("");
  };

  const getShareUrl = () => {
    return `${window.location.origin}/shared/flashcards/${id}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Create a higher-quality export
    const exportCanvas = document.createElement("canvas");
    const size = 1024;
    const padding = 80;
    exportCanvas.width = size + padding * 2;
    exportCanvas.height = size + padding * 2 + 100;
    const ctx = exportCanvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw QR code
    ctx.drawImage(canvas, padding, padding, size, size);

    // Draw title below QR
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.textAlign = "center";
    const title = material?.title || "Flashcards";
    const truncatedTitle = title.length > 40 ? title.substring(0, 37) + "..." : title;
    ctx.fillText(truncatedTitle, exportCanvas.width / 2, size + padding + 50);

    ctx.fillStyle = "#64748b";
    ctx.font = "24px Arial, sans-serif";
    ctx.fillText("Scan to view flashcards", exportCanvas.width / 2, size + padding + 85);

    // Download
    const link = document.createElement("a");
    link.download = `${material?.title || "flashcards"}-qrcode.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  const generatePDF = () => {
    // Validation
    if (!pdfTitle.trim()) {
      setPdfTitleError("Please enter a title for the PDF");
      return;
    }

    setPdfTitleError("");
    setGeneratePdfLoading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      // Add title
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text(pdfTitle, margin, margin + 10);

      // Add metadata
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`Total Cards: ${cards.length}`, margin, margin + 18);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, margin + 24);

      // Add separator line
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, margin + 28, pageWidth - margin, margin + 28);

      let yPosition = margin + 35;

      // Add flashcards
      cards.forEach((card, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Card number
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.setTextColor(79, 70, 229); // Indigo color
        doc.text(`Card ${index + 1}`, margin, yPosition);
        yPosition += 6;

        // Question label
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Question:", margin, yPosition);
        yPosition += 5;

        // Question text (wrapped)
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        const questionLines = doc.splitTextToSize(card.question, contentWidth - 10);
        doc.text(questionLines, margin + 10, yPosition);
        yPosition += questionLines.length * 5 + 3;

        // Answer label
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.text("Answer:", margin, yPosition);
        yPosition += 5;

        // Answer text (wrapped)
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        const answerLines = doc.splitTextToSize(card.answer, contentWidth - 10);
        doc.text(answerLines, margin + 10, yPosition);
        yPosition += answerLines.length * 5 + 8;

        // Separator line between cards
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;
      });

      // Save the PDF
      doc.save(`${pdfTitle}.pdf`);
      closePDFModal();
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPdfTitleError("Error generating PDF. Please try again.");
    } finally {
      setGeneratePdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!material || cards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Flashcards not found.</p>
        <button onClick={() => navigate("/study-materials")} className="mt-4 text-indigo-600 font-medium">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/study-materials")} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 line-clamp-1">{material.title}</h1>
            <p className="text-xs text-slate-500 font-medium">
              Card {currentIndex + 1} of {cards.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShuffle}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
          >
            <Shuffle className="w-4 h-4" /> <span className="hidden sm:inline">Shuffle</span>
          </button>
          <button 
            onClick={() => setIsPDFModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button 
            onClick={() => setIsQRModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" /> <span className="hidden sm:inline">Share QR</span>
          </button>
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex flex-col justify-center perspective-[1000px]">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full max-w-2xl mx-auto h-[350px] md:h-[400px] cursor-pointer transition-transform duration-500 preserve-3d"
          style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front (Question) */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center p-8 md:p-12 backface-hidden">
            <div className="absolute top-6 left-6 flex items-center gap-1.5 text-indigo-600 font-bold tracking-widest text-xs uppercase opacity-80">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Question
            </div>
            <h2 className="text-2xl md:text-3xl font-medium text-slate-800 text-center leading-relaxed">
              {cards[currentIndex].question}
            </h2>
            <div className="absolute bottom-6 flex items-center gap-1.5 text-slate-400 text-sm font-medium">
              <RotateCcw className="w-4 h-4" /> Click to flip
            </div>
          </div>

          {/* Back (Answer) */}
          <div 
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl shadow-xl shadow-indigo-500/30 flex flex-col items-center justify-center p-8 md:p-12 backface-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
             <div className="absolute top-6 left-6 flex items-center gap-1.5 text-white font-bold tracking-widest text-xs uppercase opacity-80">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              Answer
            </div>
            <div className="w-full max-h-full overflow-y-auto custom-scrollbar flex items-center justify-center">
              <p className="text-xl md:text-2xl font-medium text-white text-center leading-relaxed">
                {cards[currentIndex].answer}
              </p>
            </div>
             <div className="absolute bottom-6 flex items-center gap-1.5 text-indigo-200 text-sm font-medium">
              <RotateCcw className="w-4 h-4" /> Click to flip back
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-center items-center gap-6 mt-12 shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-md border border-slate-100 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-md border border-slate-100 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* PDF Export Modal */}
      {isPDFModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Export Flashcards as PDF</h2>
              <button
                onClick={closePDFModal}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  PDF Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pdfTitle}
                  onChange={(e) => {
                    setPdfTitle(e.target.value);
                    if (pdfTitleError) setPdfTitleError("");
                  }}
                  placeholder="e.g., Biology Flashcards - Chapter 5"
                  className={`w-full px-4 py-2.5 border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    pdfTitleError
                      ? "border-red-300 focus:ring-red-200 bg-red-50"
                      : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-300"
                  }`}
                  disabled={generatePdfLoading}
                />
              </div>

              {/* Error Message */}
              {pdfTitleError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-red-600">!</span>
                  </div>
                  <p className="text-sm text-red-700 font-medium">{pdfTitleError}</p>
                </div>
              )}

              {/* Info Box */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">📊 Preview:</span> Your PDF will contain all {cards.length} flashcards with questions and answers.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closePDFModal}
                disabled={generatePdfLoading}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={generatePDF}
                disabled={generatePdfLoading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generatePdfLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Share Modal */}
      {isQRModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Share Flashcards</h2>
              </div>
              <button
                onClick={() => { setIsQRModalOpen(false); setLinkCopied(false); }}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div ref={qrRef} className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-inner">
                <QRCodeCanvas
                  value={getShareUrl()}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1e1b4b"
                />
              </div>

              <p className="text-sm font-semibold text-slate-700 mt-4 text-center line-clamp-2">
                {material?.title}
              </p>
              <p className="text-xs text-slate-400 mt-1">Scan to view {cards.length} flashcards</p>
            </div>

            {/* Share URL */}
            <div className="mt-5 bg-slate-50 rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Share Link</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-600 truncate flex-1 font-mono">{getShareUrl()}</p>
                <button
                  onClick={handleCopyLink}
                  className={`shrink-0 p-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1 ${
                    linkCopied
                      ? "bg-green-100 text-green-700"
                      : "bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
                  }`}
                >
                  {linkCopied ? (
                    <><Check className="w-3 h-3" /> Copied!</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDownloadQR}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
              >
                <Download className="w-4 h-4" />
                Download QR
              </button>
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[11px] text-amber-700 leading-relaxed">
                <span className="font-bold">💡 Tip:</span> Anyone with this QR code or link can view these flashcards without logging in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
