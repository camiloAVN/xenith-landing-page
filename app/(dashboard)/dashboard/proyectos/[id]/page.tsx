'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProjects } from '@/hooks/useProjects'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Edit, User, Building2, Calendar, DollarSign, Trash2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { statusLabels, statusColors, priorityLabels, priorityColors, Project } from '@/lib/validations/project'

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const { currentProject, isLoading, fetchProject, deleteProject } = useProjects()
  const [projectData, setProjectData] = useState<Project | null>(null)

  useEffect(() => {
    const loadProject = async () => {
      const data = await fetchProject(id)
      setProjectData(data)
    }
    loadProject()
  }, [id, fetchProject])

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
      const success = await deleteProject(id)
      if (success) {
        router.push('/dashboard/proyectos')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Proyecto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/proyectos"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a proyectos
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{projectData.title}</h1>
            <p className="text-gray-400 mt-2">{projectData.description}</p>
            <div className="flex gap-2 mt-4">
              <Badge className={statusColors[projectData.status]}>
                {statusLabels[projectData.status]}
              </Badge>
              <Badge className={priorityColors[projectData.priority]}>
                {priorityLabels[projectData.priority]}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/proyectos/${id}/editar`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Button
              variant="outline"
              className="text-red-400 hover:text-red-300 hover:border-red-500/50"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Detalles del Proyecto</h2>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-violet-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Cliente</p>
                    <p className="font-medium">{projectData.client?.name}</p>
                    {projectData.client?.company && (
                      <p className="text-sm text-gray-500">{projectData.client.company}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-violet-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Asignado a</p>
                    <p className="font-medium">
                      {projectData.assignedUser?.name || projectData.assignedUser?.email}
                    </p>
                  </div>
                </div>

                {projectData.startDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-violet-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Fecha de Inicio</p>
                      <p className="font-medium">
                        {format(new Date(projectData.startDate), 'dd MMMM yyyy', {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {projectData.endDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-violet-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Fecha de Fin</p>
                      <p className="font-medium">
                        {format(new Date(projectData.endDate), 'dd MMMM yyyy', {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {projectData.budget && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-violet-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Presupuesto</p>
                      <p className="font-medium">
                        ${Number(projectData.budget).toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {projectData.notes && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Notas</p>
                  <p className="text-gray-300">{projectData.notes}</p>
                </div>
              )}
            </Card.Content>
          </Card>

          {projectData.quotations && projectData.quotations.length > 0 && (
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Cotizaciones</h2>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {projectData.quotations.map((quotation: any) => (
                    <div
                      key={quotation.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{quotation.title}</p>
                        <p className="text-sm text-gray-400">
                          {quotation.quotationNumber}
                        </p>
                      </div>
                      <Link href={`/dashboard/cotizaciones/${quotation.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver detalles
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Información</h2>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Fecha de Creación</p>
                  <p className="font-medium">
                    {format(new Date(projectData.createdAt), 'dd MMMM yyyy', {
                      locale: es,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Última Actualización</p>
                  <p className="font-medium">
                    {format(new Date(projectData.updatedAt), 'dd MMMM yyyy', {
                      locale: es,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Tareas</p>
                  <p className="font-medium">
                    {projectData.tasks?.length || 0} tareas
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Cotizaciones</p>
                  <p className="font-medium">
                    {projectData.quotations?.length || 0} cotizaciones
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {projectData.tags && projectData.tags.length > 0 && (
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Tags</h2>
              </Card.Header>
              <Card.Content>
                <div className="flex flex-wrap gap-2">
                  {projectData.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="info">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
