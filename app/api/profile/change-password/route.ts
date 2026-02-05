import { NextResponse } from 'next/server'
import { compare, hash } from 'bcrypt'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { changePasswordSchema } from '@/lib/validations/user'

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = changePasswordSchema.parse(body)

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(
      validatedData.currentPassword,
      user.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'La contrasena actual es incorrecta' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(validatedData.newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json(
      { message: 'Contrasena actualizada exitosamente' },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error },
        { status: 400 }
      )
    }

    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Error al cambiar la contrasena' },
      { status: 500 }
    )
  }
}
