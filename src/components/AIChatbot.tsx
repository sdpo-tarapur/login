import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles, Key, Settings, Trash2 } from 'lucide-react';

interface AIChatbotProps {
  cases: any[];
  landDisputes: any[];
  udCases: any[];
  ios: any[];
  dailyReports: any[];
  currentRole: string;
  activePS: string | null;
  onViewCase: (c: any) => void;
  isEmbeddedTab?: boolean;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({
  cases,
  landDisputes,
  udCases,
  ios,
  dailyReports,
  currentRole,
  activePS,
  isEmbeddedTab = false,
}) => {
  // Toggle state for floating button vs open chat box
  const [isOpen, setIsOpen] = useState(isEmbeddedTab);

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_custom_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(!apiKey);
  const [tempKey, setTempKey] = useState<string>('');

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Jai Hind! I am your AI Assistant. I have access to your database (${cases.length} FIRs, ${ios.length} IOs) and general web knowledge. Ask me anything!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempKey.trim()) return;
    localStorage.setItem('gemini_custom_api_key', tempKey.trim());
    setApiKey(tempKey.trim());
    setShowKeyInput(false);
    setTempKey('');
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_custom_api_key');
    setApiKey('');
    setShowKeyInput(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    const userQuery = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const dbContext = `
        Database Context for Police Subdivision:
        - Total FIR Cases: ${cases.length}
        - Active Investigating Officers (IOs): ${ios.length}
        - Land Disputes: ${landDisputes.length}
        - UD Cases: ${udCases.length}
        - Daily Reports: ${dailyReports.length}
        - Current User Role: ${currentRole}
        - Active Police Station Filter: ${activePS || 'All'}
      `;

      // Using the correct, supported stable model endpoint: gemini-2.0-flash
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert AI intelligence assistant for the Police Subdivision Portal. Use the following live database context if the user asks about internal records, or answer freely using general knowledge if they ask about anything else from the internet:\n\n${dbContext}\n\nUser Question: ${userQuery}`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `API error status: ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
      
      setMessages((prev) => [...prev, { sender: 'ai', text: replyText }]);
    } catch (err: any) {
      console.error('API Error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `❌ Error: ${err?.message || 'Check your API key or network connection.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // If embedded in a page tab, render directly without floating button wrapper
  if (isEmbeddedTab) {
    return renderChatBox();
  }

  return (
    <>
      {/* Floating Chat Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 group"
          title="Open AI Assistant"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold text-xs">
            AI Assistant
          </span>
        </button>
      )}

      {/* Floating Chat Box Window */}
      {isOpen && renderChatBox()}
    </>
  );

  function renderChatBox() {
    return (
      <div className={isEmbeddedTab ? 'w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-[550px]' : 'fixed bottom-6 right-6 z-50 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[520px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200'}>
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-white">Subdivision AI Assistant</h3>
              <p className="text-[10px] text-slate-400">
                {apiKey ? '🟢 Connected (Gemini 2.0 Flash)' : '🔴 API Key Required'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
              title="Configure API Key"
            >
              <Settings className="w-4 h-4" />
            </button>
            {!isEmbeddedTab && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* API Key Configuration Overlay */}
        {showKeyInput && (
          <form onSubmit={handleSaveKey} className="bg-blue-50 dark:bg-blue-950/80 p-3 border-b border-blue-200 dark:border-blue-900 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                <Key className="w-3.5 h-3.5" /> Enter Free Gemini API Key
              </span>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-red-500 hover:underline text-[10px] flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" /> Clear Key
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Get a free key instantly from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google AI Studio</a>.
            </p>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="Paste your free API key here..."
              className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
            />
            <div className="flex justify-end gap-2">
              {apiKey && (
                <button
                  type="button"
                  onClick={() => setShowKeyInput(false)}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold text-[10px]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] shadow-sm"
              >
                Save & Connect
              </button>
            </div>
          </form>
        )}

        {/* Chat Messages */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3 rounded-xl max-w-[85%] whitespace-pre-line leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-blue-600 dark:text-blue-400 text-[11px] italic animate-pulse flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Thinking...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={apiKey ? 'Ask about database or internet questions...' : 'Click ⚙️ to enter free API key'}
            disabled={!apiKey}
            className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!apiKey || loading}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }
};
