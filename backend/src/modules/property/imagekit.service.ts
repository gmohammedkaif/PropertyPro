import ImageKit from 'imagekit'
import { env } from '../../config/env.js'
import { BadRequestError } from '../../core/errors.js'

const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
})

export async function uploadPropertyImageToImageKit(
  fileBufferOrBase64: string | Buffer,
  fileName: string,
): Promise<string> {
  if (!fileBufferOrBase64) {
    throw new BadRequestError('No image file payload provided')
  }

  const cleanFileName = fileName ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_') : `property_${Date.now()}.jpg`

  try {
    const response = await imagekit.upload({
      file: fileBufferOrBase64,
      fileName: cleanFileName,
      folder: '/property_images',
      useUniqueFileName: true,
    })

    if (!response || !response.url) {
      throw new Error('ImageKit upload succeeded but returned no CDN URL')
    }

    return response.url
  } catch (err: any) {
    throw new BadRequestError(`ImageKit Upload Error: ${err?.message || 'Failed to upload property image'}`)
  }
}
