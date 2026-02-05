'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
  UserCog,
  Shield,
  Package,
  Boxes,
  Tags,
  Radio,
  ArrowRightLeft,
  FolderTree,
  Package2,
  UsersRound,
  Briefcase,
  UserCircle,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { SUPERADMIN_EMAIL, SystemModule } from '@/lib/validations/user'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  module: SystemModule
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { canView, isSuperAdmin, isLoading } = usePermissions()

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      module: 'dashboard',
    },
    {
      name: 'Proyectos',
      href: '/dashboard/proyectos',
      icon: FolderKanban,
      module: 'proyectos',
    },
    {
      name: 'Clientes',
      href: '/dashboard/clientes',
      icon: Users,
      module: 'clientes',
    },
    {
      name: 'Cotizaciones',
      href: '/dashboard/cotizaciones',
      icon: FileText,
      module: 'cotizaciones',
    },
  ]

  const inventoryNavigation: NavItem[] = [
    {
      name: 'Inventario',
      href: '/dashboard/inventario',
      icon: Package,
      module: 'inventario',
    },
    {
      name: 'Productos',
      href: '/dashboard/inventario/productos',
      icon: Boxes,
      module: 'productos',
    },
    {
      name: 'Items',
      href: '/dashboard/inventario/items',
      icon: Tags,
      module: 'items',
    },
    {
      name: 'Grupos',
      href: '/dashboard/inventario/grupos',
      icon: Package2,
      module: 'grupos',
    },
    {
      name: 'RFID',
      href: '/dashboard/inventario/rfid',
      icon: Radio,
      module: 'rfid',
    },
    {
      name: 'Movimientos',
      href: '/dashboard/inventario/movimientos',
      icon: ArrowRightLeft,
      module: 'movimientos',
    },
  ]

  const tercerosNavigation: NavItem[] = [
    {
      name: 'Contratistas',
      href: '/dashboard/terceros/contratistas',
      icon: UsersRound,
      module: 'contratistas',
    },
    {
      name: 'Conceptos',
      href: '/dashboard/terceros/conceptos',
      icon: Briefcase,
      module: 'conceptos',
    },
  ]

  const configNavigation: NavItem[] = [
    {
      name: 'Categorias',
      href: '/dashboard/categorias',
      icon: FolderTree,
      module: 'categorias',
    },
  ]

  // Filtrar items según permisos
  const filterByPermission = (items: NavItem[]) => {
    return items.filter((item) => canView(item.module))
  }

  const filteredNavigation = filterByPermission(navigation)
  const filteredInventory = filterByPermission(inventoryNavigation)
  const filteredTerceros = filterByPermission(tercerosNavigation)
  const filteredConfig = filterByPermission(configNavigation)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  // Renderizar lista de navegación
  const renderNavList = (
    items: NavItem[],
    activeColor: string,
    activeBorder: string
  ) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(item.href)
        return (
          <li key={item.name}>
            <Link
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? `${activeColor} ${activeBorder}`
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 border-r border-gray-800 bg-gray-950 transition-transform duration-200 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">X</span>
              </div>
              <span className="text-lg font-bold text-gradient">XENITH</span>
            </Link>

            {/* Close button (mobile only) */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            {/* Loading state */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Main Navigation */}
                {filteredNavigation.length > 0 &&
                  renderNavList(
                    filteredNavigation,
                    'bg-violet-500/10 text-violet-400',
                    'border border-violet-500/20'
                  )}

                {/* Inventory Section */}
                {filteredInventory.length > 0 && (
                  <>
                    <div className="mt-6 mb-2 px-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-3 h-3" />
                        Inventario
                      </p>
                    </div>
                    {renderNavList(
                      filteredInventory,
                      'bg-emerald-500/10 text-emerald-400',
                      'border border-emerald-500/20'
                    )}
                  </>
                )}

                {/* Terceros Section */}
                {filteredTerceros.length > 0 && (
                  <>
                    <div className="mt-6 mb-2 px-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <UsersRound className="w-3 h-3" />
                        Terceros
                      </p>
                    </div>
                    {renderNavList(
                      filteredTerceros,
                      'bg-orange-500/10 text-orange-400',
                      'border border-orange-500/20'
                    )}
                  </>
                )}

                {/* Config Section */}
                {filteredConfig.length > 0 && (
                  <>
                    <div className="mt-6 mb-2 px-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <FolderTree className="w-3 h-3" />
                        Configuracion
                      </p>
                    </div>
                    {renderNavList(
                      filteredConfig,
                      'bg-amber-500/10 text-amber-400',
                      'border border-amber-500/20'
                    )}
                  </>
                )}

                {/* Admin Section - Solo visible para superadmin */}
                {isSuperAdmin && (
                  <>
                    <div className="mt-6 mb-2 px-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Administracion
                      </p>
                    </div>
                    <ul className="space-y-1">
                      <li>
                        <Link
                          href="/dashboard/usuarios"
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                            isActive('/dashboard/usuarios')
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'text-gray-400 hover:text-white hover:bg-gray-900'
                          )}
                        >
                          <UserCog className="w-5 h-5" />
                          Usuarios
                        </Link>
                      </li>
                    </ul>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isSuperAdmin
                  ? 'bg-gradient-to-br from-red-500 to-orange-500'
                  : 'bg-gradient-to-br from-violet-500 to-indigo-500'
              )}>
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate flex items-center gap-1">
                  {user?.name || 'Usuario'}
                  {isSuperAdmin && (
                    <Shield className="w-3 h-3 text-red-400" />
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Link
                href="/dashboard/perfil"
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === '/dashboard/perfil'
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <UserCircle className="w-4 h-4" />
                Mi Perfil
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesion
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
