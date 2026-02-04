import { prisma } from '@/lib/db/prisma'
import { RfidReadPayload } from '@/lib/validations/rfid'

interface ProcessedRead {
  epc: string
  tagId: string
  status: 'ENROLLED' | 'UNASSIGNED' | 'UNKNOWN'
  isNew: boolean
  inventoryItemId?: string | null
  inventoryUpdated: boolean
}

export async function processRfidReads(payload: RfidReadPayload): Promise<ProcessedRead[]> {
  const { readerId, readerName, reads } = payload
  const results: ProcessedRead[] = []

  for (const read of reads) {
    const { epc, tid, rssi, direction, timestamp } = read
    const detectionTime = timestamp ? new Date(timestamp) : new Date()

    // Try to find existing tag
    let tag = await prisma.rfidTag.findUnique({
      where: { epc },
      include: {
        inventoryItem: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    let isNew = false
    let inventoryUpdated = false

    if (!tag) {
      // Create new unknown tag
      tag = await prisma.rfidTag.create({
        data: {
          epc,
          tid: tid || null,
          status: 'UNKNOWN',
          firstSeenAt: detectionTime,
          lastSeenAt: detectionTime,
        },
        include: {
          inventoryItem: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      })
      isNew = true
    } else {
      // Update last seen
      await prisma.rfidTag.update({
        where: { id: tag.id },
        data: {
          lastSeenAt: detectionTime,
          tid: tid || tag.tid,
        },
      })
    }

    // Create detection record
    await prisma.rfidDetection.create({
      data: {
        rfidTagId: tag.id,
        readerId,
        readerName: readerName || null,
        rssi: rssi ?? null,
        direction: direction || null,
        timestamp: detectionTime,
      },
    })

    // If tag is enrolled and has direction, update inventory status
    if (tag.status === 'ENROLLED' && tag.inventoryItem && direction) {
      const currentStatus = tag.inventoryItem.status
      const newStatus = direction === 'IN' ? 'IN' : 'OUT'

      if (currentStatus !== newStatus) {
        await prisma.inventoryItem.update({
          where: { id: tag.inventoryItem.id },
          data: { status: newStatus },
        })

        // Create movement record (we need a system user for automated movements)
        // For now, we'll skip creating a movement record since we don't have a system user
        // In production, you'd want to create a system user for automated operations

        inventoryUpdated = true
      }
    }

    results.push({
      epc,
      tagId: tag.id,
      status: tag.status,
      isNew,
      inventoryItemId: tag.inventoryItemId,
      inventoryUpdated,
    })
  }

  return results
}

export async function enrollTag(tagId: string, inventoryItemId: string): Promise<boolean> {
  // Verify tag exists and is not already enrolled
  const tag = await prisma.rfidTag.findUnique({
    where: { id: tagId },
  })

  if (!tag) {
    throw new Error('Tag RFID no encontrado')
  }

  if (tag.status === 'ENROLLED' && tag.inventoryItemId) {
    throw new Error('El tag ya está vinculado a otro item')
  }

  // Verify inventory item exists and doesn't have a tag
  const item = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItemId },
    include: {
      rfidTag: true,
    },
  })

  if (!item) {
    throw new Error('Item de inventario no encontrado')
  }

  if (item.rfidTag) {
    throw new Error('El item ya tiene un tag RFID vinculado')
  }

  // Update tag
  await prisma.rfidTag.update({
    where: { id: tagId },
    data: {
      inventoryItemId,
      status: 'ENROLLED',
    },
  })

  return true
}

export async function unenrollTag(tagId: string): Promise<boolean> {
  const tag = await prisma.rfidTag.findUnique({
    where: { id: tagId },
  })

  if (!tag) {
    throw new Error('Tag RFID no encontrado')
  }

  await prisma.rfidTag.update({
    where: { id: tagId },
    data: {
      inventoryItemId: null,
      status: 'UNASSIGNED',
    },
  })

  return true
}
