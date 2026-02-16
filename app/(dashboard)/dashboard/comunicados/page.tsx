'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Table } from '@/components/ui/Table'
import { Mail, Send, UserCheck, UserX, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { SUPERADMIN_EMAIL, roleLabels, roleColors } from '@/lib/validations/user'
import { cn } from '@/lib/utils/cn'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  isActive: boolean
}

export default function ComunicadosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)

  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/dashboard')
      return
    }

    // Superadmin always has access
    if (session.user.email === SUPERADMIN_EMAIL) {
      setHasAccess(true)
      fetchUsers()
      return
    }

    // Check role from profile
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.role === 'ADMIN') {
          setHasAccess(true)
          fetchUsers()
        } else {
          router.push('/dashboard')
        }
      })
      .catch(() => router.push('/dashboard'))
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard')
          return
        }
        throw new Error('Error al cargar usuarios')
      }

      const data = await response.json()
      // Only show active users
      setUsers(data.filter((u: User) => u.isActive))
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUser = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)))
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos un destinatario')
      return
    }

    if (!subject.trim() || !body.trim()) {
      toast.error('Completa el asunto y el mensaje')
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/comunicados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          userIds: Array.from(selectedIds),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el comunicado')
      }

      toast.success(data.message)
      setSubject('')
      setBody('')
      setSelectedIds(new Set())
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el comunicado')
    } finally {
      setIsSending(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comunicados</h1>
        <p className="text-gray-400 mt-1">
          Envia correos a los usuarios del sistema
        </p>
      </div>

      {/* Users table */}
      <Card>
        <Card.Content>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-orange-400" />
            Destinatarios
          </h2>

          {users.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No hay usuarios activos
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === users.length && users.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900"
                      />
                    </th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={cn(
                        'cursor-pointer',
                        selectedIds.has(user.id) && 'bg-orange-500/5'
                      )}
                      onClick={() => toggleUser(user.id)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleUser(user.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900"
                        />
                      </td>
                      <td className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.email === SUPERADMIN_EMAIL && (
                            <Shield className="w-4 h-4 text-red-400" />
                          )}
                          {user.name || 'Sin nombre'}
                        </div>
                      </td>
                      <td className="text-gray-400">{user.email}</td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            roleColors[user.role as keyof typeof roleColors]
                          }`}
                        >
                          {roleLabels[user.role as keyof typeof roleLabels]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Email form */}
      <Card>
        <Card.Content>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-orange-400" />
            Redactar Comunicado
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <Input
              label="Asunto *"
              placeholder="Escribe el asunto del comunicado"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <Textarea
              label="Mensaje *"
              placeholder="Escribe el contenido del comunicado..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              required
            />

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-400">
                {selectedIds.size === 0 ? (
                  'Ningun destinatario seleccionado'
                ) : (
                  <>
                    <span className="text-orange-400 font-medium">
                      {selectedIds.size}
                    </span>{' '}
                    destinatario{selectedIds.size !== 1 && 's'} seleccionado
                    {selectedIds.size !== 1 && 's'}
                  </>
                )}
              </p>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSending}
                disabled={selectedIds.size === 0 || !subject.trim() || !body.trim()}
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Comunicado
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  )
}
