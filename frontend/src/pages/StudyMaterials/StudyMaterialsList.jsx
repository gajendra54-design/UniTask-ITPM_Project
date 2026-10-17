import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Book,
  FileText,
  Type,
  UploadCloud,
  X,
  Loader2,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function StudyMaterialsList() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("text"); // 'text' | 'pdf'
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // PDF Export Modal State
  const [isPDFExportModalOpen, setIsPDFExportModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfExportError, setPdfExportError] = useState("");
  const [pdfExportLoading, setpdfExportLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await api.get("/study");
      setMaterials(res.data.data);
    } catch (err) {
      console.error("Failed to load study materials", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this study material?"))
      return;
    try {
      await api.delete(`/study/${id}`);
      setMaterials(materials.filter((m) => m._id !== id));
    } catch (err) {
      console.error("Failed to delete study material", err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setText("");
    setFile(null);
    setError("");
    setValidationErrors({});
    setMode("text");
  };

  const closePDFExportModal = () => {
    setIsPDFExportModalOpen(false);
    setSelectedMaterialId("");
    setPdfTitle("");
    setPdfExportError("");
  };

  const generatePDFExport = () => {
    // Validation
    if (!selectedMaterialId.trim()) {
      setPdfExportError("Please select a flashcard set");
      return;
    }
    if (!pdfTitle.trim()) {
      setPdfExportError("Please enter a PDF title");
      return;
    }

    setPdfExportError("");
    setpdfExportLoading(true);

    try {
      // Find selected material
      const selected = materials.find((m) => m._id === selectedMaterialId);
      if (!selected || !selected.flashcards) {
        setPdfExportError("Could not load flashcard data");
        setpdfExportLoading(false);
        return;
      }

      const cards = selected.flashcards;
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
      doc.text(`Set: ${selected.title}`, margin, margin + 18);
      doc.text(`Total Cards: ${cards.length}`, margin, margin + 24);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, margin + 30);

      // Add separator line
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, margin + 34, pageWidth - margin, margin + 34);

      let yPosition = margin + 41;

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
        const questionLines = doc.splitTextToSize(
          card.question,
          contentWidth - 10
        );
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
      closePDFExportModal();
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPdfExportError("Error generating PDF. Please try again.");
    } finally {
      setpdfExportLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (
        !(
          selected.type === "application/pdf" ||
          selected.type.startsWith("image/")
        )
      ) {
        setFile(null);
        setValidationErrors({
          ...validationErrors,
          file: "Please select a valid PDF or Image file.",
        });
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        // 10MB
        setFile(null);
        setValidationErrors({
          ...validationErrors,
          file: "File size must be less than 10MB.",
        });
        return;
      }
      setFile(selected);
      setValidationErrors({ ...validationErrors, file: null });
      setError("");
    } else {
      setFile(null);
    }
  };

  const handleGenerate = async () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = "Title is required";
    }

    if (mode === "text") {
      if (!text.trim()) {
        errors.text = "Source text is required";
      } else if (text.trim().length < 20) {
        errors.text = "Source text must be at least 20 characters";
      }
    }

    if (mode === "pdf" && !file) {
      errors.file = "PDF/Image file is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setGenerating(true);
    setError("");
    setValidationErrors({});

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("sourceType", mode);

      if (mode === "text") {
        formData.append("text", text);
      } else {
        formData.append("file", file); // Sending raw file blob directly to backend
      }

      const res = await api.post("/study/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        closeModal();
        navigate(`/study-materials/${res.data.data._id}`);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate flashcards.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
          <Book className="w-6 h-6 text-indigo-600" />
          Study Materials & Flashcards
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsPDFExportModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            No study materials found. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <Card
              key={m._id}
              onClick={() => navigate(`/study-materials/${m._id}`)}
              className="group relative cursor-pointer hover:border-indigo-400 hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => deleteMaterial(m._id, e)}
                  className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-800 pr-8 line-clamp-1">
                  {m.title}
                </CardTitle>
                <p className="text-sm font-medium text-slate-500 line-clamp-2 min-h-[40px]">
                  {m.description}
                </p>
              </CardHeader>
              <CardContent className="pt-4 flex justify-between items-center border-t border-slate-50 mt-4 bg-slate-50/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="uppercase">{m.sourceType}</span>
                </div>
                <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {m.flashcards?.length} Cards
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-sm z-10">
              <h2 className="text-xl font-bold text-slate-800">
                Generate Flashcards
              </h2>
              <button
                onClick={closeModal}
                disabled={generating}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium flex items-center justify-between">
                  {error}
                  <button onClick={() => setError("")}>
                    <X className="w-4 h-4 hover:text-red-800" />
                  </button>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chapter 4: Cell Biology"
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm disabled:opacity-50 ${validationErrors.title ? "border-red-500 focus:ring-red-500" : "border-slate-200"}`}
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (validationErrors.title)
                          setValidationErrors({
                            ...validationErrors,
                            title: null,
                          });
                      }}
                      disabled={generating}
                    />
                    {validationErrors.title && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.title}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief summary..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm disabled:opacity-50"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={generating}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Input Method
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setMode("text");
                        setValidationErrors({
                          ...validationErrors,
                          file: null,
                        });
                      }}
                      disabled={generating}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${mode === "text" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"} disabled:opacity-50`}
                    >
                      <Type className="w-5 h-5 text-indigo-500" />
                      <span className="font-semibold text-sm">Raw Text</span>
                    </button>
                    <button
                      onClick={() => {
                        setMode("pdf");
                        setValidationErrors({
                          ...validationErrors,
                          text: null,
                        });
                      }}
                      disabled={generating}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${mode === "pdf" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"} disabled:opacity-50`}
                    >
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <span className="font-semibold text-sm">
                        File Upload (OCR)
                      </span>
                    </button>
                  </div>
                </div>

                {mode === "text" ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Source Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Paste your notes or lecture transcript here..."
                      className={`w-full h-40 p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none text-sm disabled:opacity-50 ${validationErrors.text ? "border-red-500 focus:ring-red-500" : "border-slate-200"}`}
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        if (validationErrors.text)
                          setValidationErrors({
                            ...validationErrors,
                            text: null,
                          });
                      }}
                      disabled={generating}
                    />
                    {validationErrors.text && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.text}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Upload File <span className="text-red-500">*</span>
                    </label>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${validationErrors.file ? "border-red-500 bg-red-50/50 hover:border-red-600" : file ? "border-indigo-500 bg-indigo-50/50" : "border-slate-300 hover:border-indigo-400 bg-slate-50"} ${generating && "opacity-50"}`}
                    >
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={generating}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      {!file ? (
                        <div className="pointer-events-none flex flex-col items-center">
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                            <UploadCloud className="w-6 h-6 text-indigo-500" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">
                            Click or drag PDF/Image file here
                          </p>
                          <p className="text-xs font-medium text-slate-400 mt-1">
                            AI OCR Extraction (Max 10MB)
                          </p>
                        </div>
                      ) : (
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-2 text-indigo-600">
                            <FileText className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-bold text-indigo-700 line-clamp-1">
                            {file.name}
                          </p>
                          <p className="text-xs font-medium text-indigo-500/80 mt-1">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {!generating && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setFile(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="absolute -top-3 -right-3 p-1 bg-white shadow-sm border border-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors z-20 pointer-events-auto"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {validationErrors.file && (
                      <p className="text-red-500 text-center text-xs mt-2">
                        {validationErrors.file}
                      </p>
                    )}
                  </div>
                )}

                {/* Progress Text Output */}
                {generating && (
                  <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      <span className="text-sm font-semibold text-indigo-800">
                        Server is performing hybrid AI Extraction...
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    onClick={closeModal}
                    disabled={generating}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                  >
                    ✨ Generate Flashcards
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      {isPDFExportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Export Flashcards as PDF</h2>
              <button
                onClick={closePDFExportModal}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Flashcard Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Flashcard Set <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => {
                    setSelectedMaterialId(e.target.value);
                    if (pdfExportError) setPdfExportError("");
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                    pdfExportError && !selectedMaterialId
                      ? "border-red-300 focus:ring-red-200 bg-red-50"
                      : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-300"
                  }`}
                  disabled={pdfExportLoading}
                >
                  <option value="">Choose a flashcard set...</option>
                  {materials.map((material) => (
                    <option key={material._id} value={material._id}>
                      {material.title} ({material.flashcards?.length || 0} cards)
                    </option>
                  ))}
                </select>
              </div>

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
                    if (pdfExportError) setPdfExportError("");
                  }}
                  placeholder="e.g., Biology Flashcards - Chapter 5"
                  className={`w-full px-4 py-2.5 border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    pdfExportError && !pdfTitle
                      ? "border-red-300 focus:ring-red-200 bg-red-50"
                      : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-300"
                  }`}
                  disabled={pdfExportLoading}
                />
              </div>

              {/* Error Message */}
              {pdfExportError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-red-600">!</span>
                  </div>
                  <p className="text-sm text-red-700 font-medium">{pdfExportError}</p>
                </div>
              )}

              {/* Info Box */}
              {selectedMaterialId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">📊 Preview:</span> Your PDF will contain all flashcards from the selected set with questions and answers.
                  </p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closePDFExportModal}
                disabled={pdfExportLoading}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={generatePDFExport}
                disabled={pdfExportLoading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {pdfExportLoading ? (
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
    </div>
  );
}
