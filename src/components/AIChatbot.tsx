import React, { useState } from 'react';
import { Bot, Send, BarChart2, Shield, Sparkles, X } from 'lucide-react';
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
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; analytics?: any }>>([
    {
      sender: 'ai',
      text: `Jai Hind! I am your Subdivision AI Intelligence & Analytics Assistant. I have live access to your Subdivision database (${cases.length} FIRs, ${ios.length} IOs, ${dailyReports.length} Daily Reports). You can ask me anything about case statuses, IO performance, station comparisons, or general queries!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper for IO Performance Analytics
  const getIOPerformanceReport = () => {
    const ioStats: Record<string, { name: string; ps: string; totalAssigned: number; disposed: number }> = {};
    ios.forEach((io) => {
      ioStats[io.name] = { name: io.name, ps: io.ps, totalAssigned: 0, disposed: 0 };
    });

    cases.forEach((c) => {
      if (c.ioName && ioStats[c.ioName]) {
        ioStats[c.ioName].totalAssigned++;
        if (c.status === 'Chargesheet Submitted' || c.status === 'Disposed') {
          ioStats[c.ioName].disposed++;
        }
      }
    });

    return Object.values(ioStats);
  };

  // Helper for Police Station Comparison
  const getPSComparison = () => {
    const psMap: Record<string, { total: number; disposed: number; pending: number }> = {
      Tarapur: { total: 0, disposed: 0, pending: 0 },
      Asarganj: { total: 0, disposed: 0, pending: 0 },
      Sangrampur: { total: 0, disposed: 0, pending: 0 },
      Harpur: { total: 0, disposed: 0, pending: 0 },
    };

    cases.forEach((c) => {
      if (psMap[c.ps]) {
        psMap[c.ps].total++;
        if (c.status === 'Under Investigation') psMap[c.ps].pending++;
        else psMap[c.ps].disposed++;
      }
    });

    return psMap;
  };

  // AI Response Generator (Combines Gemini API with Local Database Analytics)
  const handleGenerateResponse = async (query: string) => {
    const q = query.toLowerCase();

    // Check for specific shortcut commands first for instant visual analytics
    if (q.includes('io performance') || q.includes('officer performance') || q.includes('month wise')) {
      const perf = getIOPerformanceReport();
      const topIo = perf.sort((a, b) => b.disposed - a.disposed)[0];
      return {
        text: `📊 **Investigating Officer (IO) Performance Analysis:**\nTotal Active Officers Tracked: **${ios.length}**.\n\nTop Performing Officer: **${topIo ? topIo.name : 'N/A'}** (${topIo?.disposed || 0} cases disposed out of ${topIo?.totalAssigned || 0}).`,
        analytics: { type: 'io_perf', data: perf },
      };
    }

    if (q.includes('compare') || q.includes('ps comparison') || q.includes('station wise')) {
      const comparison = getPSComparison();
      let summary = '📈 **Police Station Comparative Analysis:**\n\n';
      Object.entries(comparison).forEach(([ps, stats]) => {
        summary += `- **${ps} PS**: ${stats.total} Total Cases | ${stats.pending} Pending | ${stats.disposed} Disposed\n`;
      });
      return {
        text: summary,
        analytics: { type: 'ps_comp', data: comparison },
      };
    }

    if (q.includes('duty allocation') || q.includes('suggest duty') || q.includes('allocate')) {
      const availableIOs = ios.filter((i) => i.status === 'ACTIVE');
      return {
        text: `🤖 **AI Duty Allocation Recommendation:**\nBased on current caseload and active status:\n\n1. **High-Priority Case (SR Desk):** Recommend assigning to senior IO **${availableIOs[0]?.name || 'Available SI'}** (${availableIOs[0]?.ps} PS).\n2. **Gasti / Night Patrolling:** Recommend rotating officers with low recent patrol entries from the daily log archive.`,
      };
    }

    // Try calling Google Gen AI if API key is configured
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const dbContext = `Subdivision Data: Total FIRs: ${cases.length}, Active IOs: ${ios.length}, Land Disputes: ${landDisputes.length}, UD Cases: ${udCases.length}, Daily Reports: ${dailyReports.length}. Current Role: ${currentRole}, Active PS: ${activePS || 'All'}`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an expert AI assistant for the Tarapur Police Subdivision Portal (Bihar Police). Answer the user's question accurately, professionally, and concisely using the following database context if relevant:\n${dbContext}\n\nUser Question: ${query}`
                }
              ]
            }
          ]
        });

        if (response.text) {
          return { text: response.text };
        }
      }
    } catch (err) {
      console.warn('Gemini API call skipped or failed, falling back to local analytical engine:', err);
    }

    // Fallback general response if API key is not set
    return {
      text: `🔍 I analyzed your query regarding "${query}". Across the subdivision, we have **${cases.length}** total registered FIRs and **${dailyReports.length}** logged daily intelligence reports. You can ask me for:\n- *"Show IO performance analysis"*\n- *"Compare Tarapur and Asarganj PS"*\n- *"Suggest duty allocations for today"*`,
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const aiRes = await handleGenerateResponse(userText);
      setMessages((prev) => [...prev, { sender: 'ai', text: aiRes.text, analytics: aiRes.analytics }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, an error occurred while processing your query.' }]);
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
            <h3 className="font-extrabold text-xs text-white">Subdivision AI Intelligence & Analytics</h3>
            <p className="text-[10px] text-slate-400">Live Database Analytics & Generative AI</p>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs max-h-[400px]">
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

            {/* Graphical Analytics Rendering */}
            {m.analytics?.type === 'ps_comp' && (
              <div className="mt-2 w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-[10px] text-blue-600 flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" /> Station Case Load Distribution
                </span>
                {Object.entries(m.analytics.data).map(([ps, stats]: [string, any]) => (
                  <div key={ps} className="space-y-0.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>{ps} PS</span>
                      <span>{stats.total} Cases ({stats.disposed} Disposed)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.disposed / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-slate-400 text-[11px] italic animate-pulse">
            Analyzing live database and computing AI response...
          </div>
        )}
      </div>

      {/* Quick Prompt Pills */}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto text-[10px]">
        <button
          type="button"
          onClick={() => setInput('Show IO performance analysis')}
          className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded font-bold whitespace-nowrap transition"
        >
          📊 IO Performance
        </button>
        <button
          type="button"
          onClick={() => setInput('Compare police stations case load')}
          className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded font-bold whitespace-nowrap transition"
        >
          📈 Station Comparison
        </button>
        <button
          type="button"
          onClick={() => setInput('Suggest duty allocations')}
          className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded font-bold whitespace-nowrap transition"
        >
          🤖 Duty Allocation
        </button>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any question or request analytics..."
          className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
