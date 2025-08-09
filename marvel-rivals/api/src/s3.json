import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

const region = process.env.AWS_REGION || 'us-east-1';
export const s3 = new S3Client({ region });

async function streamToString(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (body instanceof Readable) {
    const chunks = [];
    for await (const chunk of body) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString('utf-8');
  }
  return '';
}

export async function getJsonFromS3(Key) {
  const Bucket = process.env.BUCKET_NAME;
  if (!Bucket) throw new Error('Missing BUCKET_NAME');
  const out = await s3.send(new GetObjectCommand({ Bucket, Key }));
  const text = await streamToString(out.Body);
  try { return JSON.parse(text); } catch { return text; }
}
