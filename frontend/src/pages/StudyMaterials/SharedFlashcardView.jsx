import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, BookOpen, Share2 } from "lucide-react";

export default function SharedFlashcardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedMaterial = async () => {
      try {
        const res = await axios.get(`/api/study/shared/${id}`);
        setMaterial(res.data.data);
        setCards(res.data.data.flashcards || []);
      } catch (err) {
        console.error("Failed to load shared flashcards", err);
        setError("This flashcard set is not available or has been removed.");
      } finally {
        setLoading(false);
      }
    };
    fetchSharedMaterial();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error || !material || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Flashcards Unavailable</h2>
          <p className="text-slate-500 text-sm mb-6">
            {error || "These flashcards are not available or may have been removed."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Header */}
        <div className="text-center mb-8 shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-4">
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Shared Flashcards</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{material.title}</h1>
          {material.description && (
            <p className="text-sm text-slate-500 max-w-lg mx-auto">{material.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
            >
              <Shuffle className="w-3 h-3" /> Shuffle
            </button>
          </div>
        </div>

        {/* Card Container */}
        <div className="flex-1 flex flex-col justify-center perspective-[1000px]">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative w-full max-w-2xl mx-auto h-[320px] md:h-[380px] cursor-pointer transition-transform duration-500 preserve-3d"
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
          <div className="flex justify-center items-center gap-6 mt-10 shrink-0">
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

        {/* Footer */}
        <div className="text-center py-6 mt-8 border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium">
            Shared via <span className="text-indigo-500 font-bold">UniTask</span> — Smart Campus Management
          </p>
        </div>
      </div>
    </div>
  );
}
