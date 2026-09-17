import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, Key, Settings, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

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
  // API Key state (saved in localStorage so you only enter it once)
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_custom_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(!apiKey);
  const [tempKey, setTempKey] = useState<string>('');

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Jai Hind! I am your live Gemini-powered AI Assistant for the Tarapur Police Subdivision Portal. I have full context of your database (${cases.length} FIRs, ${ios.length} IOs, ${dailyReports.length} Daily Reports). Ask me anything!`,
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
      // Initialize Google Gen AI SDK with the user's provided API key
      const ai = new GoogleGenAI({ apiKey });

      // Compile database context for Gemini
      const dbContext = `
        Database Context:
        - Total FIR Cases: ${cases.length}
        - Investigating Officers (IOs): ${ios.length}
        - Land Disputes: ${landDisputes.length}
        - Unnatural Death (UD) Cases: ${udCases.length}
        - Daily Crime Reports logged: ${dailyReports.length}
        - Current User Role: ${currentRole}
        - Active Police Station Filter: ${activePS || 'All Stations'}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert AI intelligence assistant for the Tarapur Police Subdivision Portal (Bihar Police). Use the following live database summary and context to answer the user's question accurately, professionally, and concisely:\n${dbContext}\n\nUser Question: ${userQuery}`
              }
            ]
          }
        ]
      });

      const replyText = response.text || 'Received empty response from Gemini AI.';
      setMessages((prev) => [...prev, { sender: 'ai', text: replyText }]);
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `❌ Error communicating with Gemini API: ${err?.message || 'Invalid API Key or network issue.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = isEmbeddedTab
    ? 'w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4'
    : 'fixed bottom-4 right-4 z-50 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[600px] overflow-hidden';

  return (
    <div className={containerStyle}>
      {/* Header */}
      <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-white">Gemini AI Subdivision Assistant</h3>
            <p className="text-[10px] text-slate-400">
              {apiKey ? '🟢 Connected to Gemini 2.5 Flash' : '🔴 API Key Required'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
            title="Configure Gemini API Key"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* API Key Input Overlay / Banner */}
      {showKeyInput && (
        <form onSubmit={handleSaveKey} className="bg-blue-50 dark:bg-blue-950/60 p-3 border-b border-blue-200 dark:border-blue-900 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> Enter Your Gemini API Key
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
          <input
            type="password"
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            placeholder="Paste your Gemini API key here..."
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

      {/* Chat History */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs max-h-[380px]">
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
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> Gemini is thinking and analyzing database...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={apiKey ? 'Ask Gemini anything about cases, IOs, or reports...' : 'Click settings (⚙️) to enter API key first'}
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
};
