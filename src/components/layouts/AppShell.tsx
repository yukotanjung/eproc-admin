import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  KeyRound,
  LogOut,
  PanelLeft,
  Plus,
  Search,
  UserCog,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  Floating,
  OrgMark,
  Separator,
  cn,
  useToast,
} from '~/components/ui'
import { authApi } from '~/integrations/api'
import { NAV_ITEMS, type NavItem } from '~/lib/navigation'
import { useAuth } from '~/lib/store/auth'

interface NavSection {
  title: string
  kind: 'direct' | 'dropdown'
  groups: NavItem['group'][]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Utama',
    kind: 'direct',
    groups: ['Utama'],
  },
  {
    title: 'Master',
    kind: 'dropdown',
    groups: ['Master Pekerjaan', 'Master Organisasi & Umum'],
  },
  {
    title: 'Hak Akses & Akun',
    kind: 'direct',
    groups: ['Hak Akses & Akun'],
  },
]

const DROPDOWN_GROUPS: Partial<
  Record<NavItem['group'], { label: string; icon: typeof FolderKanban }>
> = {
  'Master Pekerjaan': { label: 'Master Pekerjaan', icon: FolderKanban },
  'Master Organisasi & Umum': { label: 'Master Organisasi & Umum', icon: Building2 },
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const { user, isAuthenticated, clearSession, hasPermission } = useAuth()

  const [collapsed, setCollapsed] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [cmdQuery, setCmdQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const item of NAV_ITEMS) {
      if (DROPDOWN_GROUPS[item.group] && item.to !== '/' && location.pathname.startsWith(item.to)) {
        initial[item.group] = true
      }
    }
    return initial
  })

  useEffect(() => {
    const activeItem = NAV_ITEMS.find(
      (item) => item.to !== '/' && location.pathname.startsWith(item.to),
    )
    if (activeItem && DROPDOWN_GROUPS[activeItem.group]) {
      setOpenGroups((prev) =>
        prev[activeItem.group] ? prev : { ...prev, [activeItem.group]: true },
      )
    }
  }, [location.pathname])

  const toggleGroup = (group: NavItem['group']) => {
    if (collapsed) {
      setCollapsed(false)
      setOpenGroups((prev) => ({ ...prev, [group]: true }))
      return
    }
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      const inField =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target as HTMLElement | null)?.isContentEditable
      if (e.key === '/' && !inField && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setCmdOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => hasPermission(item.permission)),
    [hasPermission, user],
  )

  const currentNav = useMemo(() => {
    const path = location.pathname
    if (path === '/') return NAV_ITEMS[0]
    return (
      NAV_ITEMS.find((item) => item.to !== '/' && path.startsWith(item.to)) ?? {
        label: 'Detail Pengadaan',
        to: path,
        group: 'Utama' as const,
      }
    )
  }, [location.pathname])

  const filteredCmdItems = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase()
    if (!q) return visibleNavItems
    return visibleNavItems.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.group.toLowerCase().includes(q) ||
        (it.description?.toLowerCase().includes(q) ?? false),
    )
  }, [cmdQuery, visibleNavItems])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    try {
      if (isAuthenticated) {
        await authApi.logout()
      }
    } catch {
      // Proceed with local session cleanup even if token already expired
    } finally {
      clearSession()
      toast.push({
        title: 'Sesi diakhiri',
        description: 'Anda telah keluar dari portal administrasi.',
        tone: 'info',
      })
      navigate({ to: '/sign-in' })
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside
        data-collapsed={collapsed ? 'true' : 'false'}
        style={{ width: collapsed ? 56 : 244 }}
        className="rail sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex select-none"
      >
        <div className="flex h-12 items-center justify-between gap-2 border-b border-sidebar-border px-2.5">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-sidebar-accent transition"
          >
            <OrgMark size="md" />
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <div className="truncate text-xs font-semibold text-foreground">E-Procurement</div>
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  Portal Admin
                </div>
              </div>
            )}
          </Link>
          {!collapsed && (
            <Badge tone="neutral" size="xs" className="font-mono">
              v1.0
            </Badge>
          )}
        </div>

        {!collapsed && (
          <div className="p-2 pb-1">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex h-7 w-full items-center justify-between rounded-lg border border-border bg-card px-2.5 text-xs text-muted-foreground shadow-2xs hover:border-neutral-300 hover:text-foreground transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search className="size-3.5" />
                <span>Loncat ke modul...</span>
              </span>
              <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
                /
              </kbd>
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {NAV_SECTIONS.map((section) => {
            const sectionItems = visibleNavItems.filter((it) => section.groups.includes(it.group))
            if (sectionItems.length === 0) return null

            return (
              <div key={section.title} className="space-y-0.5">
                {!collapsed && (
                  <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                    {section.title}
                  </div>
                )}

                {section.kind === 'direct'
                  ? sectionItems.map((item) => {
                      const Icon = item.icon
                      const active =
                        item.to === '/'
                          ? location.pathname === '/'
                          : location.pathname.startsWith(item.to)
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition',
                            active
                              ? 'bg-neutral-900 text-white shadow-2xs'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            collapsed && 'justify-center px-0',
                          )}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      )
                    })
                  : section.groups.map((group) => {
                      const items = visibleNavItems.filter((it) => it.group === group)
                      if (items.length === 0) return null

                      const dropdownMeta = DROPDOWN_GROUPS[group]
                      const ParentIcon = dropdownMeta?.icon ?? FolderKanban
                      const label = dropdownMeta?.label ?? group
                      const hasActiveChild = items.some((item) =>
                        item.to === '/'
                          ? location.pathname === '/'
                          : location.pathname.startsWith(item.to),
                      )
                      const isOpen = Boolean(openGroups[group])

                      return (
                        <div key={group} className="space-y-0.5">
                          <button
                            type="button"
                            aria-expanded={!collapsed && isOpen}
                            title={collapsed ? label : undefined}
                            onClick={() => toggleGroup(group)}
                            className={cn(
                              'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition cursor-pointer',
                              hasActiveChild && (collapsed || !isOpen)
                                ? 'bg-neutral-900 text-white shadow-2xs'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              collapsed && 'justify-center px-0',
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <ParentIcon className="size-3.5 shrink-0" />
                              {!collapsed && <span className="truncate">{label}</span>}
                            </span>
                            {!collapsed && (
                              <ChevronDown
                                className={cn(
                                  'size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ease-out',
                                  isOpen && 'rotate-180',
                                  hasActiveChild && !isOpen && 'text-white/80',
                                )}
                              />
                            )}
                          </button>

                          <div
                            className="collapse-rows"
                            data-state={!collapsed && isOpen ? 'open' : 'closed'}
                            aria-hidden={collapsed || !isOpen}
                          >
                            <div>
                              <div className="ml-3.5 space-y-0.5 border-l border-border pl-2 pt-0.5">
                                {items.map((item) => {
                                  const Icon = item.icon
                                  const active =
                                    item.to === '/'
                                      ? location.pathname === '/'
                                      : location.pathname.startsWith(item.to)
                                  return (
                                    <Link
                                      key={item.to}
                                      to={item.to}
                                      tabIndex={!collapsed && isOpen ? 0 : -1}
                                      className={cn(
                                        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition',
                                        active
                                          ? 'bg-neutral-900 text-white shadow-2xs'
                                          : 'text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                      )}
                                    >
                                      <Icon className="size-3.5 shrink-0" />
                                      <span className="truncate">{item.label}</span>
                                    </Link>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
              </div>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Ubah ukuran navigasi samping"
              className="hidden md:inline-flex"
            >
              <PanelLeft className="size-4" />
            </Button>
            <Separator className="hidden md:block" />
            <div className="flex items-center gap-1.5 text-xs min-w-0">
              <span className="text-muted-foreground hidden sm:inline">{currentNav.group}</span>
              <ChevronRight className="size-3.5 text-muted-foreground hidden sm:inline shrink-0" />
              <span className="font-medium text-foreground truncate">{currentNav.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCmdOpen(true)}
              className="md:hidden"
            >
              <Search className="size-3.5" />
              Menu
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: '/procurements' })}
              className="hidden sm:inline-flex"
            >
              <Plus className="size-3.5" />
              Paket Pengadaan
            </Button>

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-accent/50 transition cursor-pointer"
                >
                  <Avatar name={user.name} src={user.photoUrl} size="sm" tone="dark" />
                  <div className="hidden text-left leading-tight sm:block">
                    <div className="max-w-[130px] truncate text-xs font-medium text-foreground">
                      {user.name}
                    </div>
                    <div className="max-w-[130px] truncate text-[10px] text-muted-foreground">
                      {user.roles?.[0]?.name || user.username}
                    </div>
                  </div>
                </button>
                <Floating
                  open={userMenuOpen}
                  onClose={() => setUserMenuOpen(false)}
                  align="right"
                  className="w-56"
                >
                  <div className="border-b border-border px-2.5 py-2">
                    <div className="truncate text-xs font-semibold text-foreground">
                      {user.name}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
                    {user.employeeCode && (
                      <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                        NIP/Kode: {user.employeeCode}
                      </div>
                    )}
                  </div>
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate({ to: '/profile' })
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-accent cursor-pointer"
                    >
                      <UserCog className="size-3.5 text-muted-foreground" />
                      Pengaturan Profil & Sandi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate({ to: '/access/roles' })
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-accent cursor-pointer"
                    >
                      <KeyRound className="size-3.5 text-muted-foreground" />
                      Role & Hak Akses
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="size-3.5" />
                      Keluar dari Sesi
                    </button>
                  </div>
                </Floating>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate({ to: '/sign-in' })}
              >
                Masuk Akun
              </Button>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 space-y-5">
          {children}
        </main>
      </div>

      <Dialog
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        title="Navigasi Cepat Modul E-Procurement"
        description="Cari dan buka halaman pengadaan, data master, atau manajemen hak akses."
        size="md"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              value={cmdQuery}
              onChange={(e) => setCmdQuery(e.target.value)}
              placeholder="Ketik nama modul (mis. Paket Pengadaan, HPS, Hari Libur, Role)..."
              className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-neutral-400 focus:outline-none"
            />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-lg border border-border">
            {filteredCmdItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Tidak ada modul yang cocok dengan kata kunci &ldquo;{cmdQuery}&rdquo;.
              </div>
            ) : (
              filteredCmdItems.map((it) => {
                const Icon = it.icon
                return (
                  <button
                    key={it.to}
                    type="button"
                    onClick={() => {
                      setCmdOpen(false)
                      setCmdQuery('')
                      navigate({ to: it.to })
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-accent/60 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">
                          {it.label}
                        </div>
                        {it.description && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {it.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge tone="neutral" size="xs">
                        {it.group}
                      </Badge>
                      <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}
