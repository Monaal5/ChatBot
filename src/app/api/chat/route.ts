import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from '@/lib/db/supabase';
import { getPineconeIndex } from '@/lib/db/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/community/vectorstores/pinecone';
import { ChatOpenAI } from '@langchain/openai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { HumanMessage } from '@langchain/core/messages';

// Type definitions
type AIChatResponse = {
  content: string;
  // Add other response properties if needed
};

interface ChatLog {
  userId: string;
  companyId: string;
  message: string;
  response: string;
  isFromKB: boolean;
}

// Common AI configuration
const aiConfig = {
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: { baseURL: 'https://openrouter.ai/api/v1' },
  modelName: 'deepseek/deepseek-r1-0528',
  temperature: 0.7,
  maxRetries: 2,
  timeout: 30000, // 30 seconds
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messages, companyId } = await req.json();
    
    // Validate input
    if (!messages || !Array.isArray(messages) || !companyId) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return Response.json({ error: 'No message content provided' }, { status: 400 });
    }

    // 1. Try knowledge base first
    try {
      const index = await getPineconeIndex(companyId);
      const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings(aiConfig),
        { pineconeIndex: index }
      );

      const model = new ChatOpenAI(aiConfig);
      const chain = ConversationalRetrievalQAChain.fromLLM(
        model,
        vectorStore.asRetriever(3), // Limit to 3 most relevant documents
        { returnSourceDocuments: true }
      );

      const response = await chain.call({
        question: lastMessage.content,
        chat_history: messages.slice(0, -1),
      });

      // Ensure response is a string
      const responseText = typeof response.text === 'string' 
        ? response.text 
        : JSON.stringify(response.text);

      // Save successful knowledge base response
      await logChat({
        userId: session.user.id,
        companyId,
        message: lastMessage.content,
        response: responseText,
        isFromKB: true
      });

      return Response.json({ 
        text: responseText,
        source: 'knowledge_base'
      });

    } catch (kbError) {
      console.error('Knowledge base error:', kbError);
      // 2. Fallback to generative model
      return await handleGenerativeFallback(
        lastMessage.content,
        messages,
        session.user.id,
        companyId
      );
    }

  } catch (error) {
    console.error('Server error:', error);
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function handleGenerativeFallback(
  question: string,
  chatHistory: any[],
  userId: string,
  companyId: string
) {
  try {
    const model = new ChatOpenAI(aiConfig);
    const history = chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const prompt = `As a helpful assistant, answer the following question based on the conversation history:
    
    History:
    ${history}
    
    Question: ${question}`;

    const response = await model.invoke([new HumanMessage(prompt)]) as AIChatResponse;

    // Ensure response content is a string
    const responseText = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    await logChat({
      userId,
      companyId,
      message: question,
      response: responseText,
      isFromKB: false
    });

    return Response.json({ 
      text: responseText,
      source: 'generative_model'
    });

  } catch (error) {
    console.error('Generative model error:', error);
    return Response.json(
      { error: 'Failed to generate response' }, 
      { status: 503 }
    );
  }
}

// Helper function for consistent chat logging
async function logChat(params: ChatLog) {
  return supabase.from('chats').insert({
    user_id: params.userId,
    company_id: params.companyId,
    message: params.message,
    response: params.response,
    is_from_knowledge_base: params.isFromKB,
    created_at: new Date().toISOString()
  });
}