import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { Resend } from 'resend'
import { z } from 'zod'
import { SUPERADMIN_EMAIL } from '@/lib/validations/user'
import { EmailTemplate } from '@/components/email/email-template'
import { render } from '@react-email/components'

const resend = new Resend(process.env.RESEND_API_KEY)

const comunicadoSchema = z.object({
  subject: z.string().min(1, 'El asunto es requerido').max(200),
  body: z.string().min(1, 'El mensaje es requerido').max(5000),
  userIds: z.array(z.string()).min(1, 'Selecciona al menos un destinatario'),
})

// POST /api/comunicados - Send email announcement
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is ADMIN or SUPERADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { role: true },
    })
    const isAdmin = session.user.email === SUPERADMIN_EMAIL || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = comunicadoSchema.parse(body)

    // Get emails from selected users
    const users = await prisma.user.findMany({
      where: {
        id: { in: validatedData.userIds },
        isActive: true,
      },
      select: { email: true },
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron destinatarios activos' },
        { status: 400 }
      )
    }

    const emails = users.map((u) => u.email)

    const html = await render(
      EmailTemplate({
        subject: validatedData.subject,
        body: validatedData.body,
      })
    )

    const { data, error } = await resend.emails.send({
      from: 'XENITH <onboarding@resend.dev>',
      to: [session.user.email!],
      bcc: emails,
      subject: validatedData.subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        { error: 'Error al enviar el correo' },
        { status: 500 }
      )
    }

    console.info(
      `[COMUNICADO] Email sent by ${session.user.email} to ${emails.length} users`
    )

    return NextResponse.json({
      message: `Comunicado enviado a ${emails.length} usuario(s)`,
      id: data?.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in comunicados:', error)
    return NextResponse.json(
      { error: 'Error al enviar el comunicado' },
      { status: 500 }
    )
  }
}
