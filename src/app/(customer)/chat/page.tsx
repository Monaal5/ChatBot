'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/db/supabase';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  chat_id: string;
}

interface ChatSession {
  id: string; // chat_id for grouping messages
  last_message: string;
  last_updated: string;
}

export default function CustomerChatPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Chat sessions
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  // Current chat messages for selected session
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Message input & loading
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session and chat sessions
  useEffect(() => {
    async function checkSession() {
      const session = await auth();

      if (!session?.user || session.user.role !== 'customer') {
        router.push('/login');
        return;
      }

      setUserId(session.user.id);
      setCompanyId(session.user.companyId || null);
      setSessionChecked(true);

      if (session.user.id && session.user.companyId) {
        // Load chat sessions grouped by chat_id (conversations)
        const { data, error } = await supabase
          .from('chats')
          .select('chat_id, message, created_at')
          .eq('user_id', session.user.id)
          .eq('company_id', session.user.companyId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to load chat sessions:', error);
          return;
        }

        // Group messages by chat_id and get last message & timestamp
        const grouped = data.reduce((acc: Record<string, ChatSession>, msg) => {
          const chat = acc[msg.chat_id];
          if (!chat || new Date(msg.created_at) > new Date(chat.last_updated)) {
            acc[msg.chat_id] = {
              id: msg.chat_id,
              last_message: msg.message.length > 40 ? msg.message.slice(0, 37) + '...' : msg.message,
              last_updated: msg.created_at,
            };
          }
          return acc;
        }, {});

        const sessionsArr = Object.values(grouped).sort(
          (a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        );

        setChatSessions(sessionsArr);

        // Load latest chat messages from first session, or start empty if none
        if (sessionsArr.length > 0) {
          loadChatMessages(sessionsArr[0].id, session.user.id, session.user.companyId);
        }
      }
    }
    checkSession();
  }, [router]);

  // Load chat messages for a given chat session
  async function loadChatMessages(chatId: string, userId: string, companyId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load chat messages:', error);
      setMessages([]);
      setCurrentChatId(null);
      return;
    }

    setMessages(
      data.map((msg) => ({
        id: msg.id,
        role: msg.is_from_knowledge_base ? 'assistant' : msg.user_id === userId ? 'user' : 'assistant',
        content: msg.message,
        created_at: msg.created_at,
        chat_id: msg.chat_id,
      }))
    );
    setCurrentChatId(chatId);
  }

  // Start new chat: generate a new chat_id and clear messages
  function startNewChat() {
    const newChatId = crypto.randomUUID();
    setCurrentChatId(newChatId);
    setMessages([]);
  }

  // Send message handler
  async function handleSendMessage() {
    if (!input.trim() || !userId || !companyId) return;

    // Ensure there is a chat session selected, or start a new one
    const chatIdToUse = currentChatId || crypto.randomUUID();
    if (!currentChatId) setCurrentChatId(chatIdToUse);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
      chat_id: chatIdToUse,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
          companyId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from chat API');
      }

      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.text,
        created_at: new Date().toISOString(),
        chat_id: chatIdToUse,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Update chatSessions with this chatId's last message & timestamp
      setChatSessions((prev) => {
        const existing = prev.find((s) => s.id === chatIdToUse);
        if (existing) {
          return prev.map((s) =>
            s.id === chatIdToUse
              ? { ...s, last_message: botMessage.content.slice(0, 40), last_updated: botMessage.created_at }
              : s
          );
        } else {
          return [{ id: chatIdToUse, last_message: botMessage.content.slice(0, 40), last_updated: botMessage.created_at }, ...prev];
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!sessionChecked) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-gray-500">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] max-w-7xl mx-auto border rounded-md shadow-md overflow-hidden bg-white">
      {/* Side Panel */}
      <aside className="w-72 border-r bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Your Chats</h2>
          <button
            onClick={startNewChat}
            className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
            title="Start New Chat"
          >
            + New
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {chatSessions.length === 0 && (
            <p className="p-4 text-gray-500">No chats yet. Start a new chat!</p>
          )}
          <ul>
            {chatSessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => {
                    if (userId && companyId) loadChatMessages(session.id, userId, companyId);
                  }}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-indigo-100 ${
                    currentChatId === session.id ? 'bg-indigo-200 font-semibold' : ''
                  }`}
                >
                  <div className="truncate">{session.last_message || 'Chat'}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(session.last_updated).toLocaleString()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Chat Area */}
      <section className="flex-1 flex flex-col">
        <header className="bg-indigo-600 text-white p-4 font-semibold text-lg">
          AI Assistant Chat
          {currentChatId && (
            <span className="ml-2 text-sm font-normal opacity-75">
              (Session: {currentChatId.slice(0, 8)}...)
            </span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 mt-12">
              No messages yet. Start chatting!
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[75%] p-3 rounded-lg break-words ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white self-end'
                  : 'bg-white text-gray-900 self-start shadow'
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 bg-white border-t flex items-center space-x-3">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 resize-none border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading) handleSendMessage();
              }
            }}
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || input.trim() === ''}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </footer>
      </section>
    </div>
  );
}
