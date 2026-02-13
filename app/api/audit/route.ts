import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { canViewModule } from '@/lib/auth/check-permission'

// GET /api/audit - List audit events
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await canViewModule('historial')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const action = searchParams.get('action')?.trim() || ''
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 200)

    const where: Record<string, unknown> = {}

    if (action) {
      where.action = action
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { module: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Error al obtener historial de auditoria' },
      { status: 500 }
    )
  }
}
