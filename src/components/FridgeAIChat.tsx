import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles } from 'lucide-react';
import { FridgeItem } from '@/types/chefos';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/types/chefos';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AIAction[];
}

interface AIAction {
  id: string;
  type: 'fridge_add' | 'fridge_update' | 'fridge_remove' | 'suggest';
  description: string;
  data?: Record<string, unknown>;
}

interface FridgeAIChatProps {
  fridge: FridgeItem[];
  language: Language;
  onAction: (action: AIAction) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function FridgeAIChat({ fridge, language, onAction }: FridgeAIChatProps) {
  const { t } = useTranslation(language);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('fridgeChat.welcome') || "I'm your fridge assistant! Ask about products, expiration dates, or what you can cook.",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/agents/fridge-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          fridge,
          language,
          history: messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Nie rozumiem polecenia.',
        actions: data.actions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(t('fridgeChat.error') || 'Błąd połączenia z asystentem');
      console.error('Fridge chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: AIAction) => {
    onAction(action);
    toast.success(action.description);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    t('fridgeChat.q1') || 'What expires soon?',
    t('fridgeChat.q2') || 'What can I cook?',
    t('fridgeChat.q3') || 'How many items?',
  ];

  return (
    <>
      {/* Inline Chat Panel - Always visible */}
      <div className="w-full bg-card border border-border rounded-2xl shadow-lg flex flex-col mb-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-primary" />
            <span className="font-semibold text-foreground text-sm">
              {t('fridgeChat.title') || 'Fridge Assistant'}
            </span>
            <Sparkles size={12} className="text-warning" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[250px]">
          {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Action buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleActionClick(action)}
                          className="w-full text-left text-xs bg-background/50 hover:bg-background rounded-lg px-3 py-2 transition-colors"
                        >
                          {action.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length < 3 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">
                {t('fridgeChat.quickQuestions') || 'Quick questions:'}
              </p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-xs bg-secondary/50 hover:bg-secondary text-secondary-foreground px-2 py-1 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('fridgeChat.placeholder') || 'Ask about your fridge...'}
                className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-primary text-primary-foreground p-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
