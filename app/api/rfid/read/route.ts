import { NextRequest, NextResponse } from 'next/server'
import { rfidReadSchema } from '@/lib/validations/rfid'
import { processRfidReads } from '@/lib/rfid/processor'
import { ZodError } from 'zod'

// Environment variable for RFID API key
const RFID_API_KEY = process.env.RFID_API_KEY || 'rfid-secret-key'

// POST /api/rfid/read - External endpoint for RFID readers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = rfidReadSchema.parse(body)

    // Validate API key
    if (validatedData.apiKey !== RFID_API_KEY) {
      return NextResponse.json(
        { error: 'API key inválida' },
        { status: 401 }
      )
    }

    // Process reads
    const results = await processRfidReads(validatedData)

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error processing RFID reads:', error)
    return NextResponse.json(
      { error: 'Error al procesar lecturas RFID' },
      { status: 500 }
    )
  }
}
