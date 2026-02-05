'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Shield, Lock, Eye, EyeOff, Calendar, Briefcase } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { changePasswordSchema, ChangePasswordFormData, roleLabels, roleColors, UserRole } from '@/lib/validations/user'
import { cn } from '@/lib/utils/cn'

interface UserProfile {
  id: string
  name: string | null
  email: string
  role: UserRole
  position: string | null
  createdAt: string
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema)
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Error al cargar perfil')
      }
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Error al cargar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cambiar la contrasena')
      }

      toast.success('Contrasena actualizada exitosamente')
      reset()
      setIsChangingPassword(false)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Error al cambiar la contrasena')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Mi Perfil</h1>
        <p className="text-gray-400 mt-1">
          Informacion de tu cuenta y configuracion de seguridad
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-violet-400" />
              Informacion Personal
            </CardTitle>
            <CardDescription>
              Datos de tu cuenta de usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Nombre</p>
                <p className="text-gray-100 font-medium">
                  {profile?.name || 'Sin nombre'}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Correo electronico</p>
                <p className="text-gray-100 font-medium">
                  {profile?.email}
                </p>
              </div>
            </div>

            {/* Position */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
              <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Cargo</p>
                <p className="text-gray-100 font-medium">
                  {profile?.position || 'Sin asignar'}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
              <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Rol</p>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border mt-1',
                  profile?.role ? roleColors[profile.role] : ''
                )}>
                  {profile?.role ? roleLabels[profile.role] : 'Desconocido'}
                </span>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400">Miembro desde</p>
                <p className="text-gray-100 font-medium">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-violet-400" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Cambia tu contrasena para mantener tu cuenta segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isChangingPassword ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
                  <Lock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Contrasena</p>
                    <p className="text-gray-100 font-medium">••••••••••••</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsChangingPassword(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Cambiar Contrasena
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                {/* Current Password */}
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  label="Contrasena actual *"
                  placeholder="Ingresa tu contrasena actual"
                  error={errors.currentPassword?.message}
                  {...register('currentPassword')}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="focus:outline-none"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />

                {/* New Password */}
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  label="Nueva contrasena *"
                  placeholder="Minimo 8 caracteres"
                  error={errors.newPassword?.message}
                  helperText="Debe contener mayusculas, minusculas y numeros"
                  {...register('newPassword')}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="focus:outline-none"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />

                {/* Confirm Password */}
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirmar contrasena *"
                  placeholder="Repite la nueva contrasena"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsChangingPassword(false)
                      reset()
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="flex-1"
                  >
                    Guardar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
