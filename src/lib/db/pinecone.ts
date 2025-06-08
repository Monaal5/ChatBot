import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  
});

export const getPineconeIndex = (companyId: string) => {
  return pinecone.Index(`company-${companyId}`);
};