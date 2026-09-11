import { NextResponse } from 'next/server';

// This mock gateway prevents any legacy Appwrite network requests from failing
// and safely informs clients that the app is migrated to Firebase.
async function handler() {
  return NextResponse.json(
    {
      status: 'migrated',
      message: 'Appwrite has been completely disabled and migrated to Firebase Firestore and Cloudinary.',
      migrated: true,
      data: null,
    },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    }
  );
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
