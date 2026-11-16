import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useFormValidation } from '~/lib/hooks/useFormValidation'
import {
  Bell,
  Edit3,
  KeyRound,
  Lock,
  MailCheck,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'
import { PageHeader } from '~/components/layouts/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  DataState,
  FieldLabel,
  FieldSelect,
  FilterGroup,
  FormDialog,
  Frame,
  FrameHeader,
  Pager,
  Panel,
  RefreshButton,
  SearchInput,
  Sheet,
  fieldBase,
  useToast,
} from '~/components/ui'
import {
  type RoleDetail,
  type UserPayload,
  permissionQueries,
  profileApi,
  profileQueryOptions,
  roleApi,
  roleQueries,
  userApi,
  userQueries,
} from '~/integrations/api'
import { useAuth } from '~/lib/store/auth'
import { getApiErrorMessage } from '~/lib/utils/error'
import type { AuthUser } from '~/types'

export function UsersPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')

  const usersQuery = useQuery(
    userQueries.list({ page, pageSize, search: search.trim() || undefined }),
  )
  const rolesQuery = useQuery(roleQueries.list({ all: true }))

  const users = usersQuery.data?.result ?? []
  const total = usersQuery.data?.paginate?.total ?? users.length
  const roles = rolesQuery.data?.result ?? []

  const defaultCallbackUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/activate` : 'http://localhost:5173/activate'

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AuthUser | null>(null)
  const [form, setForm] = useState<UserPayload>({
    name: '',
    username: '',
    employeeCode: '',
    email: '',
    roleId: '',
    callbackUrl: defaultCallbackUrl,
    photo: null,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<AuthUser | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const { errors, validate, clearError, clearErrors } = useFormValidation(
    z.object({
      name: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
      username: z.string().trim().min(1, 'Username wajib diisi'),
      email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
      roleId: z.string().trim().min(1, 'Role akses wajib dipilih'),
      callbackUrl: z.string().trim().min(1, 'Callback URL aktivasi wajib diisi'),
    }),
  )

  const openCreate = () => {
    clearErrors()
    setEditing(null)
    setForm({
      name: '',
      username: '',
      employeeCode: '',
      email: '',
      roleId: roles[0]?.id ?? '',
      callbackUrl: defaultCallbackUrl,
      photo: null,
    })
    setModalOpen(true)
  }

  const openEdit = (u: AuthUser) => {
    clearErrors()
    setEditing(u)
    setForm({
      name: u.name,
      username: u.username,
      employeeCode: u.employeeCode || '',
      email: u.email,
      roleId: u.roles?.[0]?.id ?? roles[0]?.id ?? '',
      callbackUrl: defaultCallbackUrl,
      photo: null,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const parsed = validate({
      name: form.name,
      username: form.username,
      email: form.email,
      roleId: form.roleId,
      callbackUrl: form.callbackUrl,
    })
    if (!parsed.success) return
    setSaving(true)
    try {
      if (editing) {
        await userApi.update(editing.id, form)
        toast.push({ title: 'Data pengguna diperbarui', tone: 'success' })
      } else {
        await userApi.create(form)
        toast.push({
          title: 'Pengguna berhasil dibuat',
          description: 'Email aktivasi telah dikirimkan ke pengguna.',
          tone: 'success',
        })
      }
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan pengguna',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResendActivation = async (u: AuthUser) => {
    setResendingId(u.id)
    try {
      await userApi.resendActivation(u.id, defaultCallbackUrl)
      toast.push({
        title: 'Email aktivasi dikirim ulang',
        description: `Tautan aktivasi telah dikirim ke ${u.email}.`,
        tone: 'success',
      })
    } catch (err) {
      toast.push({
        title: 'Gagal mengirim ulang aktivasi',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setResendingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await userApi.remove(deleting.id)
      toast.push({ title: 'Pengguna dihapus', tone: 'info' })
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menghapus pengguna',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola akun pengguna internal, penugasan role, kode pegawai, serta pengiriman ulang email aktivasi."
        actions={
          <>
            <RefreshButton loading={usersQuery.isFetching} onClick={() => usersQuery.refetch()} />
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              Tambah Pengguna
            </Button>
          </>
        }
      />

      <Frame>
        <FrameHeader
          icon={Users}
          title="Daftar Akun Pengguna"
          count={total}
          right={
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v)
                setPage(1)
              }}
              placeholder="Cari nama, username, email..."
              className="w-60"
            />
          }
        />
        <Panel className="overflow-hidden">
          <DataState
            loading={usersQuery.isLoading}
            fetching={usersQuery.isFetching}
            error={usersQuery.isError ? getApiErrorMessage(usersQuery.error) : null}
            empty={users.length === 0}
            emptyTitle="Belum ada pengguna terdaftar"
            emptyDescription="Tambahkan pengguna baru dan tetapkan role akses mereka."
            emptyAction={
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus className="size-3.5" />
                Tambah Pengguna
              </Button>
            }
            onRetry={() => usersQuery.refetch()}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Pengguna</th>
                    <th className="px-3 py-2 font-medium">Username & Kode Pegawai</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium">Verifikasi Email</th>
                    <th className="px-3 py-2 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="row-hover">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} src={u.photoUrl} size="md" tone="dark" />
                          <div>
                            <div className="font-medium text-foreground">{u.name}</div>
                            <div className="text-[11px] text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px]">
                        <div className="text-foreground">@{u.username}</div>
                        <div className="text-muted-foreground">
                          NIP: {u.employeeCode || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(u.roles ?? []).map((r) => (
                            <Badge key={r.id} tone="indigo" size="xs">
                              {r.name}
                            </Badge>
                          ))}
                          {(!u.roles || u.roles.length === 0) && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {u.emailVerifiedAt ? (
                          <Badge tone="emerald" size="xs">
                            Terverifikasi
                          </Badge>
                        ) : (
                          <Badge tone="amber" size="xs">
                            Menunggu Aktivasi
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="xs"
                            loading={resendingId === u.id}
                            onClick={() => handleResendActivation(u)}
                          >
                            <MailCheck className="size-3" />
                            Kirim Aktivasi
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => openEdit(u)}
                            aria-label="Ubah pengguna"
                          >
                            <Edit3 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => setDeleting(u)}
                            aria-label="Hapus pengguna"
                          >
                            <Trash2 className="size-3.5 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border">
              <Pager
                page={page}
                perPage={pageSize}
                total={total}
                onPage={setPage}
                onPerPage={(next) => {
                  setPageSize(next)
                  setPage(1)
                }}
              />
            </div>
          </DataState>
        </Panel>
      </Frame>

      <FormDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
        loading={saving}
        onSubmit={handleSave}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldLabel label="Nama Lengkap" required error={errors.name}>
            <input
              type="text"
              aria-invalid={Boolean(errors.name)}
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value })
                clearError('name')
              }}
              placeholder="Budi Santoso"
              className={fieldBase}
            />
          </FieldLabel>
          <FieldLabel label="Username" required error={errors.username}>
            <input
              type="text"
              aria-invalid={Boolean(errors.username)}
              value={form.username}
              onChange={(e) => {
                setForm({ ...form, username: e.target.value })
                clearError('username')
              }}
              placeholder="budi.santoso"
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
          <FieldLabel label="Email" required error={errors.email}>
            <input
              type="email"
              aria-invalid={Boolean(errors.email)}
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value })
                clearError('email')
              }}
              placeholder="budi@instansi.go.id"
              className={fieldBase}
            />
          </FieldLabel>
          <FieldLabel label="Kode Pegawai / NIP">
            <input
              type="text"
              value={form.employeeCode ?? ''}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
              placeholder="EMP-2026-01"
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
        </div>

        <FieldLabel label="Role Akses" required error={errors.roleId}>
          <FieldSelect
            error={errors.roleId}
            value={form.roleId}
            onChange={(v) => {
              setForm({ ...form, roleId: v })
              clearError('roleId')
            }}
            placeholder="Pilih Role"
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        </FieldLabel>

        <FieldLabel label="Callback URL Aktivasi" required error={errors.callbackUrl}>
          <input
            type="url"
            aria-invalid={Boolean(errors.callbackUrl)}
            value={form.callbackUrl}
            onChange={(e) => {
              setForm({ ...form, callbackUrl: e.target.value })
              clearError('callbackUrl')
            }}
            className={`${fieldBase} font-mono`}
          />
        </FieldLabel>

        <FieldLabel label="Foto Profil (Opsional)">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] ?? null })}
            className="block w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-foreground file:mr-2 file:rounded-md file:border-0 file:bg-neutral-900 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-white"
          />
        </FieldLabel>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Hapus Pengguna "${deleting?.name ?? ''}"?`}
        description="Akun pengguna ini akan dicabut dari sistem."
        confirmLabel="Hapus Pengguna"
        onConfirm={handleDelete}
      />
    </div>
  )
}

export function RolesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const rolesQuery = useQuery(roleQueries.list({ all: true }))
  const groupedPermsQuery = useQuery(permissionQueries.grouped())

  const roles = rolesQuery.data?.result ?? []
  const permissionGroups = groupedPermsQuery.data?.result ?? []

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<RoleDetail | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<RoleDetail | null>(null)

  const { errors, validate, clearError, clearErrors } = useFormValidation(
    z.object({
      name: z.string().trim().min(1, 'Nama role wajib diisi'),
    }),
  )

  const openCreate = () => {
    clearErrors()
    setEditing(null)
    setName('')
    setDescription('')
    setSelectedPermissionIds([])
    setSheetOpen(true)
  }

  const openEdit = async (role: RoleDetail) => {
    clearErrors()
    setEditing(role)
    setName(role.name)
    setDescription(role.description || '')
    setSelectedPermissionIds((role.permissions ?? []).map((p) => p.id))
    setSheetOpen(true)

    try {
      const detail = await roleApi.getById(role.id)
      if (detail.result?.permissions) {
        setSelectedPermissionIds(detail.result.permissions.map((p) => p.id))
      }
    } catch {
      // Keep existing permissions if detail call fails
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = validate({ name })
    if (!parsed.success) return
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        permissionIds: selectedPermissionIds,
      }
      if (editing) {
        await roleApi.update(editing.id, payload)
        toast.push({ title: 'Role & izin diperbarui', tone: 'success' })
      } else {
        await roleApi.create(payload)
        toast.push({ title: 'Role baru dibuat', tone: 'success' })
      }
      setSheetOpen(false)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan role',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await roleApi.remove(deleting.id)
      toast.push({ title: 'Role dihapus', tone: 'info' })
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menghapus role',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Role & Matriks Izin"
        description="Atur kelompok peran pengguna dan tetapkan hak akses (permission) secara granular untuk setiap modul E-Procurement."
        actions={
          <>
            <RefreshButton loading={rolesQuery.isFetching} onClick={() => rolesQuery.refetch()} />
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              Buat Role Baru
            </Button>
          </>
        }
      />

      <Frame>
        <FrameHeader icon={ShieldCheck} title="Daftar Role" count={roles.length} />
        <Panel className="overflow-hidden">
          <DataState
            loading={rolesQuery.isLoading}
            fetching={rolesQuery.isFetching}
            error={rolesQuery.isError ? getApiErrorMessage(rolesQuery.error) : null}
            empty={roles.length === 0}
            emptyTitle="Belum ada role terdaftar"
            emptyDescription="Buat role baru dan pilih izin akses modul yang sesuai."
            emptyAction={
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus className="size-3.5" />
                Buat Role Pertama
              </Button>
            }
            onRetry={() => rolesQuery.refetch()}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Nama Role</th>
                    <th className="px-3 py-2 font-medium">Deskripsi</th>
                    <th className="px-3 py-2 font-medium">Jumlah Permission</th>
                    <th className="px-3 py-2 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roles.map((r) => (
                    <tr key={r.id} className="row-hover">
                      <td className="px-3 py-2.5 font-semibold text-foreground">{r.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {r.description || 'Tanpa deskripsi'}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone="neutral" size="xs" className="font-mono">
                          {typeof r.totalPermissions === 'number'
                            ? `${r.totalPermissions} izin`
                            : r.permissions
                              ? `${r.permissions.length} izin`
                              : 'Klik Ubah untuk melihat'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="outline" size="xs" onClick={() => openEdit(r)}>
                            <Edit3 className="size-3" />
                            Atur Izin
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => setDeleting(r)}
                            aria-label="Hapus role"
                          >
                            <Trash2 className="size-3.5 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataState>
        </Panel>
      </Frame>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? `Konfigurasi Role: ${editing.name}` : 'Buat Role & Matriks Izin'}
        width="max-w-2xl"
        footer={
          <>
            <span className="font-mono text-[11px] text-muted-foreground">
              {selectedPermissionIds.length} permission dipilih
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                form="role-form"
                loading={saving}
              >
                Simpan Role
              </Button>
            </div>
          </>
        }
      >
        <form id="role-form" onSubmit={handleSave} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldLabel label="Nama Role" required error={errors.name}>
              <input
                type="text"
                aria-invalid={Boolean(errors.name)}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  clearError('name')
                }}
                placeholder="Panitia Pengadaan"
                className={fieldBase}
              />
            </FieldLabel>
            <FieldLabel label="Deskripsi">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Akses penuh modul pengadaan dan HPS"
                className={fieldBase}
              />
            </FieldLabel>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Matriks Permission
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = permissionGroups.flatMap((g) =>
                      g.permissions.map((p) => p.id),
                    )
                    setSelectedPermissionIds(allIds)
                  }}
                  className="text-[11px] font-medium text-foreground hover:underline cursor-pointer"
                >
                  Pilih Semua
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => setSelectedPermissionIds([])}
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {permissionGroups.map((group) => {
              const groupIds = group.permissions.map((p) => p.id)
              const allSelected =
                groupIds.length > 0 &&
                groupIds.every((id) => selectedPermissionIds.includes(id))
              return (
                <div
                  key={group.group}
                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-border pb-1.5">
                    <span className="text-xs font-semibold text-foreground">{group.group}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (allSelected) {
                          setSelectedPermissionIds((prev) =>
                            prev.filter((id) => !groupIds.includes(id)),
                          )
                        } else {
                          setSelectedPermissionIds((prev) =>
                            Array.from(new Set([...prev, ...groupIds])),
                          )
                        }
                      }}
                      className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {allSelected ? 'Batal Pilih Grup' : 'Pilih Grup'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.permissions.map((perm) => {
                      const checked = selectedPermissionIds.includes(perm.id)
                      return (
                        <div
                          key={perm.id}
                          onClick={() =>
                            setSelectedPermissionIds((prev) =>
                              checked ? prev.filter((x) => x !== perm.id) : [...prev, perm.id],
                            )
                          }
                          className="flex items-start gap-2 rounded-md border border-border bg-white p-2 cursor-pointer hover:border-neutral-400"
                        >
                          <Checkbox checked={checked} />
                          <div className="min-w-0 leading-tight">
                            <div className="text-xs font-medium text-foreground truncate">
                              {perm.label || perm.name}
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground truncate">
                              {perm.name}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </form>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Hapus Role "${deleting?.name ?? ''}"?`}
        description="Pastikan tidak ada pengguna aktif yang masih bergantung pada role ini."
        confirmLabel="Hapus Role"
        onConfirm={handleDelete}
      />
    </div>
  )
}

export function PermissionsPage() {
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')

  const groupedQuery = useQuery(permissionQueries.grouped())
  const listQuery = useQuery(
    permissionQueries.list({ page, pageSize, search: search.trim() || undefined }),
  )

  const groups = groupedQuery.data?.result ?? []
  const items = listQuery.data?.result ?? []
  const total = listQuery.data?.paginate?.total ?? items.length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Katalog Permission Sistem"
        description="Daftar kode izin akses (permission) yang terdaftar pada backend E-Procurement, dikelompokkan berdasarkan modul."
        actions={
          <FilterGroup
            value={viewMode}
            onChange={(v) => setViewMode(v as 'grouped' | 'table')}
            items={[
              { value: 'grouped', label: 'Tampilan per Grup', count: groups.length },
              { value: 'table', label: 'Tabel Semua Permission', count: total },
            ]}
          />
        }
      />

      {viewMode === 'grouped' ? (
        <DataState
          loading={groupedQuery.isLoading}
          fetching={groupedQuery.isFetching}
          error={groupedQuery.isError ? getApiErrorMessage(groupedQuery.error) : null}
          empty={groups.length === 0}
          onRetry={() => groupedQuery.refetch()}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {groups.map((g) => (
              <Frame key={g.group}>
                <FrameHeader
                  icon={KeyRound}
                  title={g.group}
                  count={g.permissions.length}
                />
                <Panel className="divide-y divide-border">
                  {g.permissions.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-foreground">{p.label || p.name}</span>
                      <Badge tone="neutral" size="xs" className="font-mono">
                        {p.name}
                      </Badge>
                    </div>
                  ))}
                </Panel>
              </Frame>
            ))}
          </div>
        </DataState>
      ) : (
        <Frame>
          <FrameHeader
            icon={KeyRound}
            title="Seluruh Permission"
            count={total}
            right={
              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
                placeholder="Cari kode / label permission..."
                className="w-60"
              />
            }
          />
          <Panel className="overflow-hidden">
            <DataState
              loading={listQuery.isLoading}
              fetching={listQuery.isFetching}
              error={listQuery.isError ? getApiErrorMessage(listQuery.error) : null}
              empty={items.length === 0}
              onRetry={() => listQuery.refetch()}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Kode Permission</th>
                      <th className="px-3 py-2 font-medium">Label</th>
                      <th className="px-3 py-2 font-medium">Grup Modul</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((p) => (
                      <tr key={p.id} className="row-hover">
                        <td className="px-3 py-2.5 font-mono font-medium text-foreground">
                          {p.name}
                        </td>
                        <td className="px-3 py-2.5 text-foreground">{p.label}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone="neutral" size="xs">
                            {p.group}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border">
                <Pager
                  page={page}
                  perPage={pageSize}
                  total={total}
                  onPage={setPage}
                  onPerPage={(next) => {
                    setPageSize(next)
                    setPage(1)
                  }}
                />
              </div>
            </DataState>
          </Panel>
        </Frame>
      )}
    </div>
  )
}

export function ProfilePage() {
  const toast = useToast()
  const { user, updateUser } = useAuth()
  const profileQuery = useQuery(profileQueryOptions())

  const currentProfile = profileQuery.data?.result ?? user

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [email, setEmail] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [notificationDevice, setNotificationDevice] = useState('')
  const [savingDevice, setSavingDevice] = useState(false)

  const profileValidation = useFormValidation(
    z.object({
      name: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
      username: z.string().trim().min(1, 'Username wajib diisi'),
      email: z
        .string()
        .trim()
        .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Format email tidak valid'),
    }),
  )
  const passwordValidation = useFormValidation(
    z.object({
      oldPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
      newPassword: z
        .string()
        .min(1, 'Kata sandi baru wajib diisi')
        .min(8, 'Kata sandi baru minimal 8 karakter'),
    }),
  )
  const deviceValidation = useFormValidation(
    z.object({
      notificationDevice: z.string().trim().min(1, 'Token perangkat notifikasi wajib diisi'),
    }),
  )

  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.name || '')
      setUsername(currentProfile.username || '')
      setEmployeeCode(currentProfile.employeeCode || '')
      setEmail(currentProfile.email || '')
      setNotificationDevice(currentProfile.notificationDevice || '')
    }
  }, [currentProfile])

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = profileValidation.validate({ name, username, email })
    if (!parsed.success) return
    setSavingProfile(true)
    try {
      const callbackUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/verify-email` : undefined
      const res = await profileApi.updateProfile({
        name: name.trim(),
        username: username.trim(),
        employeeCode: employeeCode.trim() || null,
        email: email.trim() !== currentProfile?.email ? email.trim() : undefined,
        callbackUrl: email.trim() !== currentProfile?.email ? callbackUrl : undefined,
        photo,
      })
      if (res.result) {
        updateUser(res.result)
      }
      toast.push({
        title: 'Profil berhasil diperbarui',
        description:
          email.trim() !== currentProfile?.email
            ? 'Cek email baru Anda untuk menyelesaikan verifikasi perubahan email.'
            : 'Data profil telah disimpan.',
        tone: 'success',
      })
      profileQuery.refetch()
    } catch (err) {
      toast.push({
        title: 'Gagal memperbarui profil',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = passwordValidation.validate({ oldPassword, newPassword })
    if (!parsed.success) return
    setSavingPassword(true)
    try {
      await profileApi.updatePassword({ oldPassword, newPassword })
      setOldPassword('')
      setNewPassword('')
      toast.push({
        title: 'Kata sandi diperbarui',
        description: 'Gunakan kata sandi baru pada sesi masuk berikutnya.',
        tone: 'success',
      })
    } catch (err) {
      toast.push({
        title: 'Gagal mengubah kata sandi',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleUpdateDevice = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = deviceValidation.validate({ notificationDevice })
    if (!parsed.success) return
    setSavingDevice(true)
    try {
      await profileApi.updateNotificationDevice(notificationDevice.trim())
      toast.push({
        title: 'Token perangkat disimpan',
        description: 'Perangkat notifikasi telah diperbarui.',
        tone: 'success',
      })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan perangkat notifikasi',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingDevice(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengaturan Profil & Keamanan Akun"
        description="Perbarui identitas profil, foto akun, kata sandi, serta token perangkat notifikasi."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Frame>
          <FrameHeader
            icon={UserCog}
            title="Informasi Profil"
          />
          <Panel className="p-4">
            <form onSubmit={handleUpdateProfile} noValidate className="space-y-3">
              <div className="flex items-center gap-3 pb-2">
                <Avatar
                  name={currentProfile?.name || name}
                  src={currentProfile?.photoUrl}
                  size="lg"
                  tone="dark"
                />
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {currentProfile?.name || 'Pengguna'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentProfile?.email || '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldLabel label="Nama Lengkap" required error={profileValidation.errors.name}>
                  <input
                    type="text"
                    aria-invalid={Boolean(profileValidation.errors.name)}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      profileValidation.clearError('name')
                    }}
                    className={fieldBase}
                  />
                </FieldLabel>
                <FieldLabel label="Username" required error={profileValidation.errors.username}>
                  <input
                    type="text"
                    aria-invalid={Boolean(profileValidation.errors.username)}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      profileValidation.clearError('username')
                    }}
                    className={`${fieldBase} font-mono`}
                  />
                </FieldLabel>
                <FieldLabel label="Kode Pegawai / NIP">
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className={`${fieldBase} font-mono`}
                  />
                </FieldLabel>
                <FieldLabel label="Alamat Email" error={profileValidation.errors.email}>
                  <input
                    type="email"
                    aria-invalid={Boolean(profileValidation.errors.email)}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      profileValidation.clearError('email')
                    }}
                    className={fieldBase}
                  />
                </FieldLabel>
              </div>

              <FieldLabel label="Ganti Foto Profil">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-foreground file:mr-2 file:rounded-md file:border-0 file:bg-neutral-900 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-white"
                />
              </FieldLabel>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="primary" size="sm" loading={savingProfile}>
                  <Save className="size-3.5" />
                  Simpan Profil
                </Button>
              </div>
            </form>
          </Panel>
        </Frame>

        <div className="space-y-4">
          <Frame>
            <FrameHeader
              icon={Lock}
              title="Ubah Kata Sandi"
            />
            <Panel className="p-4">
              <form onSubmit={handleUpdatePassword} noValidate className="space-y-3">
                <FieldLabel
                  label="Kata Sandi Saat Ini"
                  required
                  error={passwordValidation.errors.oldPassword}
                >
                  <input
                    type="password"
                    aria-invalid={Boolean(passwordValidation.errors.oldPassword)}
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value)
                      passwordValidation.clearError('oldPassword')
                    }}
                    className={fieldBase}
                  />
                </FieldLabel>
                <FieldLabel
                  label="Kata Sandi Baru"
                  required
                  hint="Minimal 8 karakter"
                  error={passwordValidation.errors.newPassword}
                >
                  <input
                    type="password"
                    aria-invalid={Boolean(passwordValidation.errors.newPassword)}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      passwordValidation.clearError('newPassword')
                    }}
                    className={fieldBase}
                  />
                </FieldLabel>
                <div className="flex justify-end pt-1">
                  <Button type="submit" variant="primary" size="sm" loading={savingPassword}>
                    <Lock className="size-3.5" />
                    Perbarui Kata Sandi
                  </Button>
                </div>
              </form>
            </Panel>
          </Frame>

          <Frame>
            <FrameHeader
              icon={Bell}
              title="Perangkat Notifikasi"
            />
            <Panel className="p-4">
              <form onSubmit={handleUpdateDevice} noValidate className="space-y-3">
                <FieldLabel
                  label="Notification Device Token"
                  required
                  error={deviceValidation.errors.notificationDevice}
                >
                  <input
                    type="text"
                    aria-invalid={Boolean(deviceValidation.errors.notificationDevice)}
                    value={notificationDevice}
                    onChange={(e) => {
                      setNotificationDevice(e.target.value)
                      deviceValidation.clearError('notificationDevice')
                    }}
                    placeholder="fcm_device_token_..."
                    className={`${fieldBase} font-mono`}
                  />
                </FieldLabel>
                <div className="flex justify-end">
                  <Button type="submit" variant="outline" size="sm" loading={savingDevice}>
                    Simpan Token Perangkat
                  </Button>
                </div>
              </form>
            </Panel>
          </Frame>
        </div>
      </div>
    </div>
  )
}
