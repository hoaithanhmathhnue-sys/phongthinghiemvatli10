import React, { useState, useRef, useEffect } from "react";
import { LabId, ChatMessage } from "../types";
import { LAB_CATALOG } from "../data/labCatalog";
import { MathRenderer } from "./MathRenderer";
import { chatWithAITutor, hasConfiguredKey, getStoredProvider } from "../services/aiService";
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Lightbulb,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  StopCircle,
  AlertCircle,
  Settings
} from "lucide-react";

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLabId: LabId;
  soundEnabled: boolean;
  onOpenSettings?: () => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  currentLabId,
  soundEnabled,
  onOpenSettings,
}) => {
  const lab = LAB_CATALOG[currentLabId];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Voice Conversation States
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [autoSpeakAI, setAutoSpeakAI] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "vi-VN";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text to speech function
  const speakText = (text: string, msgId?: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    // Clean text of markdown asterisks, hashes, backticks for clean audio
    const cleanText = text
      .replace(/[*#`_~]/g, "")
      .replace(/\$\$(.*?)\$\$/g, "công thức $1")
      .replace(/\$(.*?)\$/g, "$1");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "vi-VN";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.includes("vi") || v.lang.includes("VN"));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (msgId) setActiveSpeakingId(msgId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeakingId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeakingId(null);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Trình duyệt hiện tại chưa hỗ trợ Web Speech API nhận diện giọng nói tiếng Việt. Em hãy sử dụng Chrome hoặc Edge nhé!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  };

  // Initialize greeting when lab changes
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: "welcome-msg",
      role: "assistant",
      text: `Chào em! Thầy là Trợ lý AI Sư phạm Vật lí 10. Thầy đang đồng hành cùng em trong bài thực hành "${lab?.title || 'Vật lí 10'}". Em có thể gõ câu hỏi hoặc bấm micro 🎙️ để trò chuyện trực tiếp bằng giọng nói với thầy!`,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMsg]);

    return () => {
      stopSpeaking();
    };
  }, [currentLabId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = textToSend || inputText;
    if (!content.trim() || isLoading) return;

    // Stop listening if user was speaking
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    stopSpeaking();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: content.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    try {
      // Build conversation history for API
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await chatWithAITutor({
        message: content.trim(),
        labId: currentLabId,
        history,
        currentLabContext: {
          title: lab?.title,
          lessonSGK: lab?.lessonSGK,
          formula: lab?.formula,
          principles: lab?.principles,
        },
      });

      const botReply = res.reply || "Thầy đã ghi nhận câu hỏi của em. Em hãy quan sát đồ thị và thử liên hệ với công thức bài học nhé!";
      const replyMsgId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        {
          id: replyMsgId,
          role: "assistant",
          text: botReply,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      // Auto speak response if enabled
      if (autoSpeakAI) {
        speakText(botReply, replyMsgId);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Xin lỗi em, kết nối tới dịch vụ AI đang gián đoạn. Em hãy thử lại nhé!";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: errorMsg,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col transition-all">
      {/* Drawer Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
            <Bot className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <span>Trợ Lý AI Sư Phạm Vật Lí</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-blue-900/60 border border-blue-400/30">
                Socratic
              </span>
            </h3>
            <p className="text-[11px] text-blue-100 truncate max-w-[240px]">
              {lab?.title || "Thí nghiệm Vật lí"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Toggle Auto Speak */}
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setAutoSpeakAI(!autoSpeakAI);
            }}
            title={autoSpeakAI ? "Tắt tự động đọc giọng nói" : "Bật tự động đọc giọng nói"}
            className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
              autoSpeakAI
                ? "bg-teal-500/30 text-teal-200 border border-teal-400/40"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {autoSpeakAI ? <Volume2 className="w-4 h-4 text-cyan-300" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="btn-close-ai-chat"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Warning banner if API Key is not configured */}
      {!hasConfiguredKey() && (
        <div className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Chưa cấu hình API Key cá nhân.</span>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
            >
              <Settings className="w-3 h-3" />
              <span>Cài đặt ngay</span>
            </button>
          )}
        </div>
      )}

      {/* Voice Status Bar when speaking or listening */}
      {(isListening || isSpeaking) && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-teal-500/10 border-b border-blue-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {isListening ? "Đang lắng nghe giọng nói của em..." : "Thầy đang giảng giải bằng giọng nói..."}
            </span>
          </div>
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              <StopCircle className="w-3 h-3" />
              <span>Dừng đọc</span>
            </button>
          )}
        </div>
      )}

      {/* Socratic Quick Prompts Strip */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>GỢI Ý CÂU HỎI TƯ DUY KHÁM PHÁ (SOCRATIC):</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {(lab?.socraticQuestions || []).map((q: any, idx: number) => {
            const qText = typeof q === "string" ? q : q.question || "";
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(qText)}
                className="text-[11px] text-left px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
              >
                💡 {qText}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
        {messages.map((m) => {
          const isBot = m.role === "assistant";
          const isCurrentlyPlaying = activeSpeakingId === m.id && isSpeaking;

          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isBot ? "items-start" : "items-start flex-row-reverse"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                  isBot
                    ? "bg-gradient-to-tr from-blue-600 to-teal-500 text-white"
                    : "bg-slate-700 text-white"
                }`}
              >
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm transition-all ${
                  isBot
                    ? "bg-white border border-slate-200 text-black"
                    : "bg-blue-600 text-white"
                }`}
              >
                {isBot ? (
                  <MathRenderer content={m.text} />
                ) : (
                  <div className="whitespace-pre-wrap">{m.text}</div>
                )}
                
                <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                  {isBot ? (
                    <button
                      onClick={() => {
                        if (isCurrentlyPlaying) {
                          stopSpeaking();
                        } else {
                          speakText(m.text, m.id);
                        }
                      }}
                      className={`flex items-center gap-1 font-medium px-1.5 py-0.5 rounded transition-colors ${
                        isCurrentlyPlaying
                          ? "bg-teal-500 text-white"
                          : "text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{isCurrentlyPlaying ? "Đang đọc..." : "Nghe đọc"}</span>
                    </button>
                  ) : <span />}

                  <span className={isBot ? "text-slate-400" : "text-blue-100"}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium p-2 rounded-lg bg-blue-50/50 dark:bg-slate-800/40 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span>Thầy đang phân tích dữ liệu và soạn câu trả lời...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Voice & Text */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone Speech Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? "Dừng ghi âm" : "Nói câu hỏi bằng giọng nói"}
            className={`p-2.5 rounded-xl transition-all shadow-sm ${
              isListening
                ? "bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-600 dark:text-cyan-400" />}
          </button>

          <input
            type="text"
            placeholder={isListening ? "Đang nghe giọng nói của em..." : "Gõ hoặc bấm micro 🎙️ để hỏi..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className={`flex-1 px-3 py-2 text-xs rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              isListening ? "border-rose-400 ring-2 ring-rose-300" : "border-slate-300 dark:border-slate-700"
            }`}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-40 transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>💡 Bấm 🎙️ để nói tiếng Việt tự nhiên</span>
          <span>Hỗ trợ Text-to-Speech & Web Speech API</span>
        </div>
      </div>
    </div>
  );
};
