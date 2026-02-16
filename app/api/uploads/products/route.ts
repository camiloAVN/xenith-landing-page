import { NextRequest, NextResponse } from 'next/server'
import { canEditModule } from '@/lib/auth/check-permission'
import {
  buildProductImageKey,
  buildPublicFileUrl,
  deleteObjectFromR2,
  parseManagedR2KeyFromUrl,
  uploadBufferToR2,
} from '@/lib/storage/r2'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// POST /api/uploads/products - Upload product image to Cloudflare R2 (S3 API)
export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await canEditModule('productos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Archivo no valido' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato no soportado. Usa JPG, PNG o WEBP' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'La imagen no puede ser mayor a 5MB' },
        { status: 400 }
      )
    }

    const key = buildProductImageKey(file.name)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await uploadBufferToR2({
      key,
      body: buffer,
      contentType: file.type,
    })

    return NextResponse.json({
      key,
      url: buildPublicFileUrl(key),
    })
  } catch (error) {
    console.error('Error uploading product image:', error)
    return NextResponse.json(
      { error: 'Error al subir imagen' },
      { status: 500 }
    )
  }
}

// DELETE /api/uploads/products - Delete product image from Cloudflare R2
export async function DELETE(request: NextRequest) {
  try {
    const permissionCheck = await canEditModule('productos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const body = await request.json()
    const imageUrl = typeof body?.url === 'string' ? body.url : ''

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de imagen requerida' },
        { status: 400 }
      )
    }

    const key = parseManagedR2KeyFromUrl(imageUrl)
    if (!key) {
      return NextResponse.json({ success: true, skipped: true })
    }

    await deleteObjectFromR2(key)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product image:', error)
    return NextResponse.json(
      { error: 'Error al eliminar imagen' },
      { status: 500 }
    )
  }
}
