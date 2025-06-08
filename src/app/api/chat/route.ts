import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from '@/lib/db/supabase';
import { getPineconeIndex } from '@/lib/db/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/community/vectorstores/pinecone';
import { ChatOpenAI } from '@langchain/openai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { HumanMessage } from '@langchain/core/messages';
import { NextResponse } from 'next/server';

// Type definitions
interface AIChatResponse {
  content: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  companyId: string;
}

interface ChatLog {
  userId: string;
  companyId: string;
  message: string;
  response: string;
  isFromKB: boolean;
}

// Constants
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const AI_CONFIG = {
  openAIApiKey: OPENROUTER_API_KEY,
  basePath: OPENROUTER_BASE_URL,
  modelName: 'deepseek/deepseek-r1-0528',
  temperature: 0.7,
  maxRetries: 2,
  timeout: 30000,
};

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }

  try {
    const { messages, companyId }: ChatRequest = await req.json();
    
    if (!messages?.length || !companyId) {
      return NextResponse.json(
        { error: 'Invalid request body' }, 
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content?.trim()) {
      return NextResponse.json(
        { error: 'No message content provided' }, 
        { status: 400 }
      );
    }

    // Try knowledge base first
    const kbResponse = await tryKnowledgeBase(
      lastMessage.content,
      messages,
      companyId,
      session.user.id
    );

    if (kbResponse) return kbResponse;

    // Fallback to generative model
    return await handleGenerativeFallback(
      lastMessage.content,
      messages,
      session.user.id,
      companyId
    );

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function tryKnowledgeBase(
  question: string,
  chatHistory: ChatMessage[],
  companyId: string,
  userId: string
) {
  try {
    const index = await getPineconeIndex(companyId);
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({
        openAIApiKey: OPENROUTER_API_KEY,
      }),
      { pineconeIndex: index }
    );

    const model = new ChatOpenAI({
      openAIApiKey: OPENROUTER_API_KEY,
      modelName: AI_CONFIG.modelName,
      temperature: AI_CONFIG.temperature,
      maxRetries: MAX_RETRIES,
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(3),
      { returnSourceDocuments: true }
    );

    const response = await withRetry(() => 
      chain.call({
        question,
        chat_history: chatHistory.slice(0, -1),
      }),
      MAX_RETRIES,
      RETRY_DELAY
    );

    // Adjust if response object shape differs
    const responseText = typeof response.text === 'string' ? response.text : JSON.stringify(response);

    await logChat({
      userId,
      companyId,
      message: question,
      response: responseText,
      isFromKB: true
    });

    return NextResponse.json({ 
      text: responseText,
      source: 'knowledge_base'
    });

  } catch (error) {
    console.error('Knowledge base error:', error);
    return null;
  }
}

async function handleGenerativeFallback(
  question: string,
  chatHistory: ChatMessage[],
  userId: string,
  companyId: string
) {
  try {
    const model = new ChatOpenAI({
      openAIApiKey: OPENROUTER_API_KEY,
      modelName: AI_CONFIG.modelName,
      temperature: AI_CONFIG.temperature,
      maxRetries: MAX_RETRIES,
    });

    const history = chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const prompt = `As a helpful assistant, answer the following question based on the conversation history:
    
History:
${history}

Question: ${question}`;

    const response = await withRetry(() => 
      model.invoke([new HumanMessage(prompt)]),
      MAX_RETRIES,
      RETRY_DELAY
    ) as AIChatResponse;

    const responseText = sanitizeResponse(response.content);

    await logChat({
      userId,
      companyId,
      message: question,
      response: responseText,
      isFromKB: false
    });

    return NextResponse.json({ 
      text: responseText,
      source: 'generative_model'
    });

  } catch (error) {
    console.error('Generative model error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' }, 
      { status: 503 }
    );
  }
}

// Helper functions
async function logChat(params: ChatLog) {
  try {
    await supabase.from('chats').insert({
      user_id: params.userId,
      company_id: params.companyId,
      message: params.message,
      response: params.response,
      is_from_knowledge_base: params.isFromKB,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log chat:', error);
  }
}

function sanitizeResponse(response: any): string {
  if (typeof response === 'string') return response;
  try {
    return JSON.stringify(response);
  } catch {
    return 'Unable to process response';
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(res => setTimeout(res, delay));
    return withRetry(fn, retries - 1, delay);
  }
}
