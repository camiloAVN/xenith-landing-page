import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Hash password with bcrypt
  const hashedPassword = await hash('admin123', 12)

  // Create superadmin user first
  const superAdmin = await prisma.user.upsert({
    where: { email: 'camilo.vargas@xenith.com.co' },
    update: {
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
    create: {
      email: 'camilo.vargas@xenith.com.co',
      name: 'Camilo Vargas',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  })

  console.log('Created superadmin:', superAdmin.email)

  // Find old admin user
  const oldAdmin = await prisma.user.findUnique({
    where: { email: 'admin@xenith.com' },
  })

  // If old admin exists, reassign their data and delete
  if (oldAdmin) {
    // Reassign projects
    await prisma.project.updateMany({
      where: { assignedTo: oldAdmin.id },
      data: { assignedTo: superAdmin.id },
    })

    // Reassign quotations
    await prisma.quotation.updateMany({
      where: { createdBy: oldAdmin.id },
      data: { createdBy: superAdmin.id },
    })

    // Delete old admin
    await prisma.user.delete({
      where: { id: oldAdmin.id },
    })

    console.log('Deleted old admin: admin@xenith.com')
  }

  // Create demo client
  const demoClient = await prisma.client.upsert({
    where: { email: 'cliente@ejemplo.com' },
    update: {},
    create: {
      name: 'Juan Pérez',
      company: 'Empresa Demo S.A.',
      email: 'cliente@ejemplo.com',
      phone: '+52 123 456 7890',
      city: 'Ciudad de México',
      country: 'México',
      notes: 'Cliente de demostración para pruebas',
    },
  })

  console.log('✅ Created demo client:', demoClient.name)

  // Create demo project
  const demoProject = await prisma.project.create({
    data: {
      title: 'Sistema de Automatización Industrial',
      description: 'Desarrollo de sistema de automatización para línea de producción',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      clientId: demoClient.id,
      assignedTo: superAdmin.id,
      budget: 150000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      tags: ['automatización', 'robótica', 'IoT'],
      notes: 'Proyecto prioritario para Q1 2026',
    },
  })

  console.log('✅ Created demo project:', demoProject.title)

  // Create demo quotation
  const demoQuotation = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-0001',
      title: 'Cotización Sistema de Automatización',
      description: 'Cotización para desarrollo de sistema de automatización industrial',
      clientId: demoClient.id,
      projectId: demoProject.id,
      createdBy: superAdmin.id,
      status: 'SENT',
      validUntil: new Date('2026-02-15'),
      subtotal: 150000,
      tax: 24000,
      discount: 0,
      total: 174000,
      terms: 'Pago: 50% anticipo, 50% contra entrega. Garantía de 12 meses.',
      items: {
        create: [
          {
            description: 'Desarrollo de software de control',
            quantity: 1,
            unitPrice: 80000,
            total: 80000,
            order: 1,
          },
          {
            description: 'Integración de sensores IoT',
            quantity: 10,
            unitPrice: 3000,
            total: 30000,
            order: 2,
          },
          {
            description: 'Sistema de monitoreo en tiempo real',
            quantity: 1,
            unitPrice: 40000,
            total: 40000,
            order: 3,
          },
        ],
      },
    },
  })

  console.log('✅ Created demo quotation:', demoQuotation.quotationNumber)

  console.log('')
  console.log('Seeding completed!')
  console.log('')
  console.log('Credenciales:')
  console.log('   Email: camilo.vargas@xenith.com.co')
  console.log('   Password: admin123')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
