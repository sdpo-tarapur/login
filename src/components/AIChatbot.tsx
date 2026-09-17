import React, { useState, useRef, useEffect } from 'react';
import { FIRCase, LandDispute, UDCase, InvestigatingOfficer, DailyCrimeReport, UserRole, PoliceStationName } from '../types';
import { Bot, Send, User, X, Maximize2, Minimize2, Sparkles, RefreshCw, Copy, Check, Shield, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import Markdown from 'react-markdown';

interface AIChatbotProps {
  cases: FIRCase[];
  landDisputes: LandDispute[];
  udCases: UDCase[];
  ios: InvestigatingOfficer[];
  dailyReports: DailyCrimeReport[];
  currentRole: UserRole;
  activePS: PoliceStationName | null;
  onViewCase?: (c: FIRCase) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isEmbeddedTab?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Show all murder cases pending for supervision',
  'Which cases are pending at a particular IO?',
  'List all FIR cases exceeding 60/90 days deadline',
  'Summary of pending land disputes in Tarapur PS',
  'List all Unnatural Death (UD) cases',
  'Show SR vs Non-SR case breakdown by Police Station',
];

export const AIChatbot: React.FC<AIChatbotProps> = ({
  cases,
  landDisputes,
  udCases,
  ios,
  dailyReports,
  currentRole,
  activePS,
  onViewCase,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  isEmbeddedTab = false,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isOpen = isEmbeddedTab ? true : (externalIsOpen !== undefined ? externalIsOpen : internalIsOpen);
  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const initialGreeting: Message = {
    id: '1',
    role: 'assistant',
    content: `Hello! I am **Tarapur AI Assistant**, powered by Gemini API.

I have direct access to your **SDPO Tarapur Police Portal Database** (${cases.length} FIRs, ${landDisputes.length} Land Disputes, ${udCases.length} UD Cases, ${ios.length} IOs).

**How can I assist you today?**
You can ask me questions like:
- *"Show all murder cases pending for supervision"*
- *"Which cases are pending with IO SI Ramesh Kumar?"*
- *"List cases exceeding 60/90 days deadline without CCTNS upload"*
- *"Provide a summary of land disputes in Tarapur PS"*`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          portalContext: {
            cases,
            landDisputes,
            udCases,
            ios,
            dailyReports,
            userRole: currentRole,
            userPS: activePS,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to contact AI Assistant.');
      }

      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Error:** ${err.message || 'Unable to connect to AI Chatbot service. Please ensure GEMINI_API_KEY is configured in Settings.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([initialGreeting]);
  };

  // Render floating button if not open & not embedded
  if (!isOpen && !isEmbeddedTab) {
    return (
      <button
        onClick={() => setInternalIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2.5 group transition-all duration-300 hover:scale-105 active:scale-95 border border-purple-400/30"
        title="Open AI Chatbot Assistant"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-purple-200 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <span className="font-bold text-sm pr-1 hidden sm:inline-block">AI Assistant</span>
      </button>
    );
  }

  const containerClasses = isEmbeddedTab
    ? 'w-full h-[calc(100vh-12rem)] min-h-[550px] bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col'
    : isExpanded
    ? 'fixed inset-4 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col'
    : 'fixed bottom-4 right-4 z-50 w-full max-w-lg h-[620px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col';

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white rounded-t-2xl flex items-center justify-between border-b border-purple-800/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-400/30 text-purple-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide">SDPO Tarapur AI Assistant</h3>
              <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Gemini 3.6
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80 font-medium">
              Live Database Knowledge • {cases.length} FIRs Loaded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            className="p-1.5 hover:bg-white/10 rounded-lg text-purple-200 hover:text-white transition"
            title="Reset Chat History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {!isEmbeddedTab && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-purple-200 hover:text-white transition hidden sm:block"
                title={isExpanded ? 'Restore Size' : 'Maximize Window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-rose-500/20 rounded-lg text-purple-200 hover:text-rose-300 transition"
                title="Close AI Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Database Context Indicator Bar */}
      <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Role: <strong>{currentRole}</strong></span>
          <span>•</span>
          <span>PS: <strong>{activePS || 'All Subdivision'}</strong></span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span>FIRs: <strong>{cases.length}</strong></span>
          <span>Disputes: <strong>{landDisputes.length}</strong></span>
          <span>UD: <strong>{udCases.length}</strong></span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-700 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div>
                  <div className="markdown-body dark:prose-invert">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 transition"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                  <span className="block mt-1 text-[10px] text-purple-200/80 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 font-semibold">
              <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
              <span>Analyzing Police Database & Generating AI Response...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-3 py-2 bg-slate-100/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span>Quick Prompts:</span>
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="text-[11px] bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-slate-700 dark:text-slate-300 font-medium px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 transition shadow-2xs disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask AI anything about murder cases, IO workload, 60/90-day deadlines..."
          disabled={loading}
          className="flex-1 bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 disabled:opacity-50 font-medium"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-2.5 rounded-xl transition shadow-sm shrink-0 flex items-center justify-center"
          title="Send Question"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
