import { useState, useRef, useEffect } from "react";
import { Headphones, X, Send, Sparkles, Trash2, Bot, User, MessageSquarePlus, Wand2, Volume2, VolumeX } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "../../utils/api";

const AIAssignmentChatbot = () => {
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [, setIsMinimized] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  
  // Get page-specific initial message and suggestions
  const getPageContext = () => {
    const path = location.pathname;
    
    if (path.includes('/dashboard')) {
      return {
        title: "Dashboard Guide",
        initialMessage: "👋 Welcome to your Dashboard! I can help you with an overview of your assignments, deadlines, and overall progress. What would you like to know?",
        context: "dashboard",
        suggestions: ["Check my deadlines", "How's my progress?", "Explain dashboard", "Show quick actions"]
      };
    } else if (path.includes('/assignments')) {
      return {
        title: "Assignments Helper",
        initialMessage: "📚 Hi! I'm here to help you manage your assignments. I can guide you on creating new assignments, breaking them down into subtasks, and tracking progress. What do you need help with?",
        context: "assignments",
        suggestions: ["How to add task", "Explain subtasks", "Filter by priority", "AI breakdown tips"]
      };
    } else if (path.includes('/calendar')) {
      return {
        title: "Calendar Assistant",
        initialMessage: "📅 Welcome to your Study Calendar! I'm here to help you plan your study schedule, manage deadlines, and organize your tasks. How can I assist you?",
        context: "calendar",
        suggestions: ["How to add task", "What is 8h rule?", "Seed demo data", "Plan study session"]
      };
    } else if (path.includes('/smart-priority') || path.includes('/priority')) {
      return {
        title: "Priority & Tracking",
        initialMessage: "🎯 Hi! I'm your Priority Management Assistant. I can help you understand task priorities, manage your workload, and optimize your study schedule. What would you like to know?",
        context: "priority",
        suggestions: ["Priority scoring", "Managing workload", "Risk assessment", "Daily limits"]
      };
    } else if (path.includes('/groups')) {
      return {
        title: "Study Groups Guide",
        initialMessage: "👥 Welcome to Study Groups! I can help you find groups, collaborate with classmates, and manage group projects. How can I help?",
        context: "groups",
        suggestions: ["Find a group", "Create group", "Collaboration tips", "Group meetings"]
      };
    } else if (path.includes('/skills-analysis')) {
      return {
        title: "Skills Analysis Helper",
        initialMessage: "📊 Hi! I'm here to help you understand your skill development and progress. I can guide you on improving specific skills and tracking your growth. What would you like to explore?",
        context: "skills",
        suggestions: ["Track skills", "Improve consistency", "Explain charts", "Behavior analysis"]
      };
    } else if (path.includes('/study-materials')) {
      return {
        title: "Study Materials Guide",
        initialMessage: "📖 Welcome to Study Materials! I can help you create flashcards, manage study resources, and organize your learning materials. What do you need?",
        context: "study",
        suggestions: ["Create flashcards", "AI flashcards", "Organize materials", "Retention tips"]
      };
    }
    
    return {
      title: "AI Assistant",
      initialMessage: "👋 Hi! I'm your AI Assignment Guide. I'm here to help you with your academic tasks. What would you like to know?",
      context: "general",
      suggestions: ["How to use UniTask", "Study tips", "Academic help", "What can you do?"]
    };
  };

  const pageContext = getPageContext();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: pageContext.initialMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const speak = (text) => {
    if (!isTtsEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (text = null, isSpecicalAction = false) => {
    const textToSend = text || inputValue;
    if (!textToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const history = messages.slice(-5).map((msg) => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await api.post("/chatbot/ai-message", {
        message: isSpecicalAction ? `[ACTION: ANALYZE_CURRENT_PAGE] The user wants a summary and tips for the ${pageContext.context} page.` : textToSend,
        context: pageContext.context,
        history: history,
      });

      if (response.data.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          text: response.data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMessage]);
        speak(response.data.message);
      }
    } catch (err) {
      console.error("Failed to get AI response", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "bot",
          text: "I'm having trouble connecting right now. Please try again! 🔌",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    window.speechSynthesis.cancel();
    setMessages([
      {
        id: Date.now(),
        type: "bot",
        text: pageContext.initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const togglePageAnalysis = () => {
    handleSendMessage(`Analyze my current ${pageContext.context} view and give me tips.`, true);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  return (
    <div className="fixed z-50 bottom-6 right-6 flex flex-col items-end gap-4 pointer-events-none">
      {/* ── CHAT WINDOW ────────────────────────────────────────── */}
      {isOpen && (
        <div 
          className={`
            w-[380px] sm:w-[420px] h-[600px] max-h-[80vh] 
            bg-white/95 backdrop-blur-xl rounded-[24px] 
            shadow-[0_20px_50px_rgba(0,0,0,0.15)] 
            border border-slate-200/60 flex flex-col 
            overflow-hidden pointer-events-auto
            transition-all duration-500 ease-premium
            origin-bottom-right
          `}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 shrink-0 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 animate-pulse">
                <Bot className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-[15px] leading-tight">UniTask AI</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                  <span className="text-blue-100 text-[11px] font-medium tracking-wide uppercase">Active Guide • {pageContext.context}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={togglePageAnalysis}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="Analyze this page"
              >
                <Wand2 size={18} />
              </button>
              <button 
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                className={`p-2 rounded-xl transition-all ${isTtsEnabled ? 'text-white bg-white/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                title={isTtsEnabled ? "Disable Voice" : "Enable Voice"}
              >
                {isTtsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button 
                onClick={clearChat}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="Clear Chat"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* CHAT CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.type === "user" ? "items-end" : "items-start underline-none"}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1
                    ${msg.type === "user" ? "bg-blue-100 text-blue-600 border border-blue-200" : "bg-indigo-100 text-indigo-600 border border-indigo-200"}
                  `}>
                    {msg.type === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div 
                    className={`
                      px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm
                      ${msg.type === "user" 
                        ? "bg-blue-600 text-white rounded-tr-none shadow-blue-200/50" 
                        : "bg-white text-slate-700 border border-slate-200/60 rounded-tl-none"}
                    `}
                  >
                    {msg.text}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 px-10 font-medium">{msg.timestamp}</span>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                  <Bot size={14} />
                </div>
                <div className="bg-white border border-slate-200/60 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* BOTTOM ACTIONS / CHIPS */}
          <div className="p-3 border-t border-slate-100 bg-white space-y-3 shrink-0">
            {/* Suggested Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
              {pageContext.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={loading}
                  className="whitespace-nowrap px-3.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles size={12} />
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2 text-slate-700 placeholder:text-slate-400"
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputValue.trim()}
                className={`
                  p-2.5 rounded-xl transition-all flex items-center justify-center
                  ${loading || !inputValue.trim() 
                    ? 'bg-slate-200 text-slate-400' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5'}
                `}
              >
                <Send size={18} />
              </button>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 font-medium">
              UniTask AI may produce inaccurate info. Review key dates.
            </p>
          </div>
        </div>
      )}

      {/* ── TOGGLE BUTTON ────────────────────────────────────────── */}
      <div className="pointer-events-auto">
        <button
          onClick={toggleChat}
          className={`
            relative group flex items-center justify-center w-16 h-16 rounded-full 
            transition-all duration-500 shadow-2xl hover:scale-110 active:scale-95
            ${isOpen 
              ? 'bg-white text-slate-600 rotate-90 border-2 border-slate-100' 
              : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white -rotate-0 hover:shadow-blue-500/25'}
          `}
        >
          {isOpen ? (
            <X className="w-8 h-8" />
          ) : (
            <>
              <Headphones className="w-7 h-7" />
              {/* Notification Badge if needed */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-4 border-white flex items-center justify-center group-hover:animate-bounce"></div>
            </>
          )}
          
          {/* Tooltip on hover */}
          {!isOpen && (
            <div className="absolute right-full mr-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
              How can I help today? ✨
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIAssignmentChatbot;
