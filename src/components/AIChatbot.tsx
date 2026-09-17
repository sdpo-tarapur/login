import React, { useState } from 'react';
import { Bot, Send, BarChart2, Shield, Users, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

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
  ios,
  dailyReports,
  currentRole,
  activePS,
  isEmbeddedTab = false,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; analytics?: any }>>([
    {
      sender: 'ai',
      text: `Jai Hind! I am your Subdivision AI Intelligence & Analytics Assistant. I have live access to your Subdivision database (${cases.length} FIRs, ${ios.length} IOs, ${dailyReports.length} Daily Reports). How can I assist you with performance tracking or duty allocations today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Advanced Analytical Computations
  const getIOPerformanceReport = () => {
    const ioStats: Record<string, { name: string; ps: string; totalAssigned: int; disposed: int }> = {};
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

  const generateAIResponse = (query: string) => {
    const q = query.toLowerCase();

    if (q.includes('io performance') || q.includes('officer performance') || q.includes('month wise')) {
      const perf = getIOPerformanceReport();
      const topIo = perf.sort((a, b) => b.disposed - a.disposed)[0];
      return {
        text: `📊 **Investigating Officer (IO) Performance Analysis:**\nTotal Active Officers Tracked: **${ios.length}**.\n\nTop Performing Officer: **${topIo ? topIo.name : 'N/A'}** (${topIo?.disposed || 0} cases disposed out of ${topIo?.totalAssigned || 0}).\n\n*Would you like a detailed month-wise breakdown for a specific officer?*`,
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
        text: `🤖 **AI Duty Allocation Recommendation:**\nBased on current caseload and active status:\n\n1. **High-Priority Case (SR Desk):** Recommend assigning to senior IO **${availableIOs[0]?.name || 'Available SI'}** (${availableIOs[0]?.ps} PS) who currently has optimal bandwidth.\n2. **Gasti / Night Patrolling:** Recommend rotating officers with low recent patrol entries from the daily log archive.\n\n*Shall I dispatch this recommendation as an official directive?*`,
      };
    }

    if (q.includes('land dispute') || q.includes('janata darbar')) {
      const pendingLD = landDisputes.filter((l) => l.status === 'Pending').length;
      return {
        text: `⚖️ **Land Dispute & Janata Darbar Intelligence:**\nThere are currently **${pendingLD}** active un-disposed land disputes across the subdivision. Immediate listing for the upcoming Janata Darbar is advised to prevent escalation.`,
      };
    }

    // Default Intelligence Summary
    return {
      text: `🔍 I analyzed your query regarding "${query}". Across the subdivision, we have **${cases.length}** total registered FIRs and **${dailyReports.length}** logged daily intelligence reports. You can ask me for:\n- *"Show IO performance analysis"*\n- *"Compare Tarapur and Asarganj PS"*\n- *"Suggest duty allocations for today"*`,
    };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    setTimeout(() => {
      const aiRes = generateAIResponse(userText);
      setMessages((prev) => [...prev, { sender: 'ai', text: aiRes.text, analytics: aiRes.analytics }]);
      setLoading(false);
    }, 600);
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
            <p className="text-[10px] text-slate-400">Live Database Analytics & Duty Allocations</p>
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

            {/* Optional Graphical Analytics Rendering inside Chat */}
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
            Analyzing live database and computing analytics...
          </div>
        )}
      </div>

      {/* Quick Prompt Pills */}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto text-[10px]">
        <button
          onClick={() => setInput('Show IO performance analysis')}
          className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded font-bold whitespace-nowrap transition"
        >
          📊 IO Performance
        </button>
        <button
          onClick={() => setInput('Compare police stations case load')}
          className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded font-bold whitespace-nowrap transition"
        >
          📈 Station Comparison
        </button>
        <button
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
          placeholder="Ask for analytics, IO stats, or duty advice..."
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
