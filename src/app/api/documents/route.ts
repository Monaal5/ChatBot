import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from '@/lib/db/supabase';
import { getPineconeIndex } from '@/lib/db/pinecone';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'company') {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const companyId = formData.get('companyId') as string;

  if (!file || !companyId) {
    return new Response('Missing file or companyId', { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return new Response('Unsupported file type', { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return new Response(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`, { status: 400 });
  }

  // Validate OpenRouter API key
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('Server configuration error', { status: 500 });
  }

  let filePath = '';
  try {
    // 1. Save file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    filePath = `${companyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Process file based on type
    let loader;
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });

    switch (file.type) {
      case 'application/pdf':
        loader = new PDFLoader(fileBlob);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        loader = new DocxLoader(fileBlob);
        break;
      case 'text/csv':
        loader = new CSVLoader(fileBlob);
        break;
      default:
        loader = new TextLoader(fileBlob);
    }

    const rawDocs = await loader.load();

    // 3. Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.splitDocuments(rawDocs);

    // 4. Store in Pinecone
    const index = await getPineconeIndex(companyId);
    await PineconeStore.fromDocuments(
      docs,
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENROUTER_API_KEY,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
        },
      }),
      {
        pineconeIndex: index,
        namespace: companyId
      }
    );

    // 5. Save document metadata to Supabase
    const { error: dbError } = await supabase.from('company_documents').insert({
      company_id: companyId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: session.user.id,
      processed_at: new Date().toISOString(),
    });

    if (dbError) throw dbError;

    return Response.json({ success: true, filePath });

  } catch (error) {
    console.error('Document processing error:', error);
    
    // Cleanup uploaded file if error occurred after upload
    if (filePath) {
      await supabase.storage.from('company-documents').remove([filePath])
        .catch(cleanupError => console.error('Cleanup failed:', cleanupError));
    }

    return Response.json(
      { 
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : undefined 
      }, 
      { status: 500 }
    );
  }
}