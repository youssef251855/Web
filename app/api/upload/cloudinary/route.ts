import { NextRequest, NextResponse } from 'next/server';
import { cloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'app_uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'application/octet-stream';
    const isVideo = mimeType.startsWith('video');

    if (isCloudinaryConfigured) {
      // Upload using official Cloudinary API
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload(
          base64Data,
          {
            folder,
            resource_type: isVideo ? 'video' : 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });

      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url || uploadResult.url,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        format: uploadResult.format,
        resource_type: uploadResult.resource_type,
        bytes: uploadResult.bytes,
      });
    }

    // Fallback: If Cloudinary keys are not yet entered in .env, generate a data URI
    // and note for user to configure their Cloudinary API keys
    const base64DataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return NextResponse.json({
      success: true,
      url: base64DataUri,
      secure_url: base64DataUri,
      public_id: `mock_${Date.now()}_${file.name}`,
      format: mimeType.split('/')[1] || 'bin',
      resource_type: isVideo ? 'video' : 'image',
      bytes: file.size,
      warning: 'Uploaded in local data-URI mode. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Settings or .env to store permanently on Cloudinary CDN.',
    });
  } catch (error: any) {
    console.error('Cloudinary API route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload to Cloudinary' },
      { status: 500 }
    );
  }
}
