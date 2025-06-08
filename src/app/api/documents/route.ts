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

  try {
    // 1. Save file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${companyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Process file based on type
    let loader;
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });

    if (file.type === 'application/pdf') {
      loader = new PDFLoader(fileBlob);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      loader = new DocxLoader(fileBlob);
    } else if (file.type === 'text/csv') {
      loader = new CSVLoader(fileBlob);
    } else {
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
    const index = getPineconeIndex(companyId);
    await PineconeStore.fromDocuments(
      docs,
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENROUTER_API_KEY,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
        },
      }),
      { pineconeIndex: index }
    );

    // 5. Save document metadata to Supabase
    await supabase.from('company_documents').insert({
      company_id: companyId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      uploaded_by: session.user.id,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Document processing error:', error);
    return Response.json({ error: 'Failed to process document' }, { status: 500 });
  }
}