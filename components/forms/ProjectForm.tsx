'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, ProjectFormData, Project, statusLabels, priorityLabels } from '@/lib/validations/project'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'
import { Plus, Trash2, ListTodo } from 'lucide-react'

interface ProjectFormProps {
  project?: Project | null
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ProjectForm({
  project,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProjectFormProps) {
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          title: project.title,
          description: project.description,
          clientId: project.clientId,
          assignedTo: project.assignedTo,
          status: project.status,
          priority: project.priority,
          startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
          endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
          budget: project.budget?.toString() || '',
          notes: project.notes || '',
          tasks: project.tasks?.map((task) => ({
            title: task.title,
            description: task.description || '',
            assignedTo: task.assignedTo || '',
            dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
            priority: task.priority,
          })) || [],
        }
      : {
          status: 'PROSPECT',
          priority: 'MEDIUM',
          tasks: [],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tasks',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, usersRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/users'),
        ])

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json()
          setClients(clientsData)
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [])

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label,
  }))

  const priorityOptions = Object.entries(priorityLabels).map(([value, label]) => ({
    value,
    label,
  }))

  const clientOptions = [
    { value: '', label: 'Selecciona un cliente' },
    ...clients.map((client) => ({
      value: client.id,
      label: `${client.name}${client.company ? ` - ${client.company}` : ''}`,
    })),
  ]

  const userOptions = [
    { value: '', label: 'Selecciona un usuario' },
    ...users.map((user) => ({
      value: user.id,
      label: user.name || user.email,
    })),
  ]

  const taskUserOptions = [
    { value: '', label: 'Sin asignar' },
    ...users.map((user) => ({
      value: user.id,
      label: user.name || user.email,
    })),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Título del Proyecto *"
            placeholder="Desarrollo de aplicación web"
            error={errors.title?.message}
            {...register('title')}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Descripción *"
            placeholder="Describe los detalles del proyecto..."
            rows={4}
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <Select
          label="Cliente *"
          options={clientOptions}
          error={errors.clientId?.message}
          {...register('clientId')}
        />

        <Select
          label="Asignado a *"
          options={userOptions}
          error={errors.assignedTo?.message}
          {...register('assignedTo')}
        />

        <Select
          label="Estado *"
          options={statusOptions}
          error={errors.status?.message}
          {...register('status')}
        />

        <Select
          label="Prioridad *"
          options={priorityOptions}
          error={errors.priority?.message}
          {...register('priority')}
        />

        <Input
          label="Fecha de Inicio"
          type="date"
          error={errors.startDate?.message}
          {...register('startDate')}
        />

        <Input
          label="Fecha de Fin"
          type="date"
          error={errors.endDate?.message}
          {...register('endDate')}
        />

        <Input
          label="Presupuesto"
          type="number"
          step="0.01"
          placeholder="10000.00"
          error={errors.budget?.message}
          {...register('budget')}
        />
      </div>

      <Textarea
        label="Notas"
        placeholder="Notas adicionales sobre el proyecto..."
        rows={3}
        error={errors.notes?.message}
        {...register('notes')}
      />

      {/* Tasks Section */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold">Tareas</h3>
              {fields.length > 0 && (
                <span className="text-sm text-gray-400">({fields.length})</span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'MEDIUM' })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Tarea
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No hay tareas agregadas</p>
              <p className="text-sm mt-1">Haz clic en &quot;Agregar Tarea&quot; para crear una</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 rounded-lg border border-gray-700 bg-gray-800/50 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Input
                          label={`Tarea ${index + 1} - Título *`}
                          placeholder="Nombre de la tarea"
                          error={errors.tasks?.[index]?.title?.message}
                          {...register(`tasks.${index}.title`)}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Textarea
                          label="Descripción"
                          placeholder="Describe la tarea..."
                          rows={2}
                          error={errors.tasks?.[index]?.description?.message}
                          {...register(`tasks.${index}.description`)}
                        />
                      </div>

                      <Select
                        label="Asignado a"
                        options={taskUserOptions}
                        error={errors.tasks?.[index]?.assignedTo?.message}
                        {...register(`tasks.${index}.assignedTo`)}
                      />

                      <Input
                        label="Fecha Estimada"
                        type="date"
                        error={errors.tasks?.[index]?.dueDate?.message}
                        {...register(`tasks.${index}.dueDate`)}
                      />

                      <Select
                        label="Prioridad"
                        options={priorityOptions}
                        error={errors.tasks?.[index]?.priority?.message}
                        {...register(`tasks.${index}.priority`)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-6 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {project ? 'Actualizar Proyecto' : 'Crear Proyecto'}
        </Button>
      </div>
    </form>
  )
}
