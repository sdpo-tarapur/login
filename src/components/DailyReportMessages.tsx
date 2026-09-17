import React, { useState } from 'react';
import { UserMessage, UserAccount, UserRole } from '../types';
import {
  Mail,
  Send,
  Trash2,
  CheckCheck,
  Clock,
  AlertCircle,
  User,
  Shield,
  Search,
  MessageSquare,
  Building2,
  Inbox,
  ArrowUpRight,
} from 'lucide-react';
import { formatReadableDate } from '../utils/helpers';

interface DailyReportMessagesProps {
  messages: UserMessage[];
  currentUserAccount: UserAccount | null;
  currentRole: UserRole;
  userAccounts: UserAccount[];
  onSendMessage: (msg: Omit<UserMessage, 'id' | 'createdAt'>) => void;
  onDeleteMessage?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  isReadOnly?: boolean;
}

export const DailyReportMessages: React.FC<DailyReportMessagesProps> = ({
  messages,
  currentUserAccount,
  currentRole,
  userAccounts,
  onSendMessage,
  onDeleteMessage,
  onMarkAsRead,
  isReadOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [recipientUserId, setRecipientUserId] = useState<string>('ALL');
  const [subject, setSubject] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Directive'>('Routine');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const currentUserId = currentUserAccount?.userId || currentRole;
  const currentUserName = currentUserAccount?.officerName || currentRole;

  // Filter messages for Inbox (addressed to current user or ALL)
  const inboxMessages = messages.filter((m) => {
    const isRecipient =
      m.recipientUserId === 'ALL' ||
      m.recipientUserId === currentUserId ||
      m.recipientUserId === currentRole;
    return isRecipient;
  });

  // Filter messages for Sent
  const sentMessages = messages.filter((m) => {
    return m.senderUserId === currentUserId || m.senderRole === currentRole;
  });

  const unreadInboxCount = inboxMessages.filter(
    (m) => !m.readBy?.includes(currentUserId)
  ).length;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !messageText.trim()) return;

    let recipientName = 'All Stations & Desks';
    if (recipientUserId !== 'ALL') {
      const match = userAccounts.find((a) => a.userId === recipientUserId);
      if (match) {
        recipientName = `${match.officerName} (${match.role})`;
      } else {
        recipientName = recipientUserId;
      }
    }

    onSendMessage({
      senderUserId: currentUserId,
      senderName: currentUserName,
      senderRole: currentRole,
      recipientUserId,
      recipientName,
      subject: subject.trim(),
      messageText: messageText.trim(),
      priority,
      readBy: [currentUserId],
    });

    setSubject('');
    setMessageText('');
    setPriority('Routine');
    setActiveTab('sent');
  };

  const displayedList = activeTab === 'inbox' ? inboxMessages : sentMessages;
  const filteredList = displayedList.filter((m) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      (m.subject || '').toLowerCase().includes(q) ||
      (m.messageText || '').toLowerCase().includes(q) ||
      (m.senderName || '').toLowerCase().includes(q) ||
      (m.recipientName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm">
              Subdivision Inter-Desk Messages & Directives
            </h3>
            <p className="text-[11px] text-slate-400">
              Transmit urgent instructions, duty dispatches, and daily operational notes between desks
            </p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition ${
              activeTab === 'inbox'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Inbox</span>
            {unreadInboxCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-black">
                {unreadInboxCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition ${
              activeTab === 'sent'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Sent ({sentMessages.length})</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setActiveTab('compose')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition ${
                activeTab === 'compose'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose Message</span>
            </button>
          )}
        </div>
      </div>

      {/* Compose View */}
      {activeTab === 'compose' && (
        <form onSubmit={handleSend} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Recipient Desk / Officer *
              </label>
              <select
                value={recipientUserId}
                onChange={(e) => setRecipientUserId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
              >
                <option value="ALL">📢 Broadcast to All Stations (Subdivision General)</option>
                <optgroup label="Official Police Stations">
                  <option value="sho.tarapur">SHO Tarapur Police Station</option>
                  <option value="sho.asarganj">SHO Asarganj Police Station</option>
                  <option value="sho.sangrampur">SHO Sangrampur Police Station</option>
                  <option value="sho.harpur">SHO Harpur Police Station</option>
                </optgroup>
                <optgroup label="Supervisory Officers">
                  <option value="sdpo.tarapur">SDPO Tarapur (Subdivision Police Officer)</option>
                  <option value="ci.tarapur">Circle Inspector (CI) Tarapur</option>
                </optgroup>
                <optgroup label="Desk Operators">
                  <option value="op.tarapur">Daily Report Operator Tarapur</option>
                  <option value="op.subdivision">Subdivision HQ Desk Operator</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority Level *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'Routine' | 'Urgent' | 'Directive')}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
              >
                <option value="Routine">Routine Operational Note</option>
                <option value="Urgent">Urgent Inter-Station Directive</option>
                <option value="Directive">Directive / Flash Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subject / Topic *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Immediate checking of vehicles on SH-22 border"
              required
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Message Body *
            </label>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter instructions, dispatch remarks, or briefing details..."
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-sm flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </div>
        </form>
      )}

      {/* Inbox & Sent List View */}
      {activeTab !== 'compose' && (
        <div className="p-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search messages by subject, officer, or content..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-xs">
                {activeTab === 'inbox' ? 'No messages in your inbox' : 'No sent messages recorded'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredList.map((msg) => {
                const isUnread = !msg.readBy?.includes(currentUserId);
                const isSender = msg.senderUserId === currentUserId;

                return (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-xl border transition space-y-2 ${
                      isUnread
                        ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {msg.priority === 'Directive' && (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] tracking-wider uppercase animate-pulse">
                            Directive
                          </span>
                        )}
                        {msg.priority === 'Urgent' && (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px] tracking-wider uppercase">
                            Urgent
                          </span>
                        )}
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          {msg.subject}
                        </h4>
                      </div>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatReadableDate(msg.createdAt || '')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {msg.messageText}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span>
                          From: <strong>{msg.senderName}</strong> ({msg.senderRole})
                        </span>
                        <span>•</span>
                        <span>
                          To: <strong>{msg.recipientName}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUnread && onMarkAsRead && (
                          <button
                            onClick={() => onMarkAsRead(msg.id)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark Read</span>
                          </button>
                        )}

                        {!isReadOnly && (
                          <button
                            onClick={() => {
                              setRecipientUserId(msg.senderUserId);
                              setSubject(`Re: ${msg.subject}`);
                              setActiveTab('compose');
                            }}
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold"
                          >
                            Reply
                          </button>
                        )}

                        {!isReadOnly && (isSender || currentRole === 'SDPO') && onDeleteMessage && (
                          <button
                            onClick={() => onDeleteMessage(msg.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="Delete Message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
