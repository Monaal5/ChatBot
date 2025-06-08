'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '../chat/ChatInterface';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export function ChatWidget({ companyId }: { companyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<any>(null);

  useEffect(() => {
    // Fetch company's widget configuration
    async function fetchConfig() {
      const response = await fetch(`/api/company/widget-config?companyId=${companyId}`);
      const config = await response.json();
      setWidgetConfig(config);
    }
    fetchConfig();
  }, [companyId]);

  if (!widgetConfig) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div 
          className={cn(
            'w-80 h-[500px] bg-background border rounded-lg shadow-xl overflow-hidden flex flex-col',
            widgetConfig.colorScheme === 'dark' ? 'dark-theme' : 'light-theme'
          )}
          style={{
            backgroundColor: widgetConfig.backgroundColor,
            color: widgetConfig.textColor,
            borderColor: widgetConfig.borderColor,
          }}
        >
          <div 
            className="p-3 flex justify-between items-center border-b"
            style={{
              backgroundColor: widgetConfig.headerColor,
              color: widgetConfig.headerTextColor,
            }}
          >
            <h3 className="font-semibold">{widgetConfig.title || 'Chat with us'}</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-lg"
              style={{ color: widgetConfig.headerTextColor }}
            >
              ×
            </button>
          </div>
          <div className="flex-1">
            <ChatInterface companyId={companyId} />
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'rounded-full w-14 h-14 p-0 shadow-lg',
            widgetConfig.colorScheme === 'dark' ? 'bg-primary' : 'bg-white text-primary'
          )}
          style={{
            backgroundColor: widgetConfig.buttonColor,
            color: widgetConfig.buttonTextColor,
          }}
        >
          {widgetConfig.buttonIcon ? (
            <span className="text-2xl">{widgetConfig.buttonIcon}</span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
            </svg>
          )}
        </Button>
      )}
    </div>
  );
}