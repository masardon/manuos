'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Kanban,
  TrendingUp,
  Wrench,
  Package,
  AlertTriangle,
  Users,
  Settings,
  BarChart3,
  Building2,
  LogOut,
  User,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_TECHNICIAN', 'ROLE_WAREHOUSE', 'ROLE_SUPER_ADMIN'],
      },
    ],
  },
  {
    title: 'Manufacturing',
    items: [
      {
        id: 'orders',
        name: 'Orders',
        href: '/orders',
        icon: FileText,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_SUPER_ADMIN'],
      },
      {
        id: 'planning',
        name: 'Planning',
        href: '/planning',
        icon: Calendar,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_SUPER_ADMIN'],
      },
      {
        id: 'kanban',
        name: 'Kanban Board',
        href: '/planning/kanban',
        icon: Kanban,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_TECHNICIAN', 'ROLE_SUPER_ADMIN'],
      },
      {
        id: 'gantt',
        name: 'Gantt Chart',
        href: '/planning/gantt',
        icon: TrendingUp,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_SUPER_ADMIN'],
      },
    ],
  },
  {
    title: 'Production',
    items: [
      {
        id: 'production',
        name: 'Production',
        href: '/production',
        icon: Wrench,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_TECHNICIAN', 'ROLE_WAREHOUSE', 'ROLE_SUPER_ADMIN'],
      },
      {
        id: 'machines',
        name: 'Machines',
        href: '/machines',
        icon: Settings,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_TECHNICIAN', 'ROLE_SUPER_ADMIN'],
      },
      {
        id: 'breakdowns',
        name: 'Breakdowns',
        href: '/machines/breakdowns',
        icon: AlertTriangle,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_TECHNICIAN', 'ROLE_WAREHOUSE', 'ROLE_SUPER_ADMIN'],
      },
    ],
  },
  {
    title: 'Inventory',
    items: [
      {
        id: 'inventory',
        name: 'Inventory',
        href: '/inventory',
        icon: Package,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_WAREHOUSE', 'ROLE_SUPER_ADMIN'],
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        id: 'reports',
        name: 'Reports',
        href: '/reports',
        icon: BarChart3,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_SUPER_ADMIN'],
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        id: 'users',
        name: 'Users',
        href: '/users',
        icon: Users,
        roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'],
      },
      {
        id: 'settings',
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'],
      },
      {
        id: 'profile',
        name: 'Profile',
        href: '/profile',
        icon: User,
        roles: ['ROLE_ADMIN', 'ROLE_PPIC', 'ROLE_MANAGER', 'ROLE_TECHNICIAN', 'ROLE_WAREHOUSE', 'ROLE_CUSTOMER', 'ROLE_SUPER_ADMIN'],
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const userRole = user?.roleCode

  const canAccessItem = (roles: string[]) => {
    if (!userRole) return false
    return roles.includes(userRole)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      logout()
      window.location.href = '/login'
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold">ManuOS</p>
            <p className="text-xs text-muted-foreground">Manufacturing OS</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canAccessItem(item.roles))
          
          if (visibleItems.length === 0) return null
          
          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.name}
                        >
                          <a href={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        {user && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
