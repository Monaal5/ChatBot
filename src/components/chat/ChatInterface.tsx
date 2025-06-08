import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';

export function ChatInterface({ companyId }: { companyId: string }) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: '/api/chat',
    body: { companyId },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on component mount
  useEffect(() => {
    async function loadChatHistory() {
      const response = await fetch(`/api/chats?companyId=${companyId}`);
      const history = await response.json();
      setMessages(history);
    }
    loadChatHistory();
  }, [companyId, setMessages]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto border rounded-lg overflow-hidden">
      <div className="p-4 bg-primary text-white">
        <h2 className="text-xl font-semibold">Company Assistant</h2>
      </div>
      
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div
              className={`flex max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {message.role !== 'user' && (
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarImage src="/bot-avatar.png" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <p className="text-sm">{message.content}</p>
              {message.role === 'user' && (
                <Avatar className="ml-2 h-8 w-8">
                  <AvatarImage src="/user-avatar.png" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}