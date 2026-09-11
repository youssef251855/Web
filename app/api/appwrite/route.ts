import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'migrated',
    service: 'Firebase Firestore & Cloudinary Gateway',
    message: 'Appwrite is completely removed in favor of Firebase.',
  });
}
