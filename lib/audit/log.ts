import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

type CreateAuditLogInput = {
  module: string
  action: string
  entityType: string
  entityId?: string
  description: string
  metadata?: Prisma.InputJsonValue
  performedBy: string
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        module: input.module,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        metadata: input.metadata,
        performedBy: input.performedBy,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
  } catch (error) {
    console.error('[AUDIT] Error creating audit log:', error)
  }
}

export function getRequestClientInfo(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null
  const userAgent = request.headers.get('user-agent')

  return { ipAddress, userAgent }
}
