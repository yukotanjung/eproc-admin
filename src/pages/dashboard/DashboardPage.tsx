import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowUpRight,
  CalendarDays,
  FileSpreadsheet,
  FolderKanban,
  Milestone,
  Plus,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '~/components/layouts/PageHeader'
import {
  Badge,
  Button,
  DataState,
  Frame,
  FrameHeader,
  IconTile,
  Panel,
  RefreshButton,
  StatTile,
  StatusBadge,
} from '~/components/ui'
import {
  masterQueries,
  procurementMethodQueries,
  procurementQueries,
  userQueries,
} from '~/integrations/api'
import { useAuth } from '~/lib/store/auth'
import { getApiErrorMessage } from '~/lib/utils/error'
import { formatCurrency, formatDate } from '~/lib/utils/format'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const procurementsQuery = useQuery(
    procurementQueries.list({ page: 1, pageSize: 10 }),
  )
  const methodsQuery = useQuery(procurementMethodQueries.list({ all: true }))
  const holidaysQuery = useQuery(masterQueries.list('holiday', { page: 1, pageSize: 6 }))
  const usersQuery = useQuery(userQueries.list({ page: 1, pageSize: 5 }))

  const procurements = procurementsQuery.data?.result ?? []
  const totalProcurements =
    procurementsQuery.data?.paginate?.total ?? procurements.length

  const totalBudgetOnPage = useMemo(
    () =>
      procurements.reduce((acc, item) => {
        const val = Number(item.budgetCeiling ?? item.budgetValue ?? 0)
        return acc + (Number.isNaN(val) ? 0 : val)
      }, 0),
    [procurements],
  )

  const methods = methodsQuery.data?.result ?? []
  const activeMethodsCount = methods.filter((m) => m.isActive !== false).length
  const holidays = holidaysQuery.data?.result ?? []
  const totalUsers = usersQuery.data?.paginate?.total ?? (usersQuery.data?.result?.length ?? 0)

  const refreshAll = () => {
    procurementsQuery.refetch()
    methodsQuery.refetch()
    holidaysQuery.refetch()
    usersQuery.refetch()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ringkasan E-Procurement"
        badge={
          isAuthenticated && user ? (
            <Badge tone="emerald">Sesi Aktif · {user.name}</Badge>
          ) : (
            <Badge tone="amber">Belum Masuk Sesi</Badge>
          )
        }
        description="Ikhtisar langsung dari database eproc-api: daftar paket pengadaan terbaru, akumulasi pagu anggaran, metode pengadaan, dan kalender hari libur."
        actions={
          <>
            <RefreshButton
              label="Muat Ulang Data"
              loading={
                procurementsQuery.isFetching ||
                methodsQuery.isFetching ||
                holidaysQuery.isFetching ||
                usersQuery.isFetching
              }
              onClick={refreshAll}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate({ to: '/procurements' })}
            >
              <Plus className="size-3.5" />
              Kelola Paket Pengadaan
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={FileSpreadsheet}
          tone="dark"
          label="Total Paket Pengadaan"
          value={procurementsQuery.isLoading ? '...' : totalProcurements}
          sub={
            procurementsQuery.isError
              ? 'Gagal memuat data pengadaan'
              : `${procurements.length} paket dimuat pada halaman aktif`
          }
        />
        <StatTile
          icon={Wallet}
          tone="emerald"
          label="Pagu Anggaran (Halaman Aktif)"
          value={procurementsQuery.isLoading ? '...' : formatCurrency(totalBudgetOnPage)}
          sub="Akumulasi nilai pagu paket yang tampil"
        />
        <StatTile
          icon={Milestone}
          tone="sky"
          label="Metode Pengadaan Aktif"
          value={methodsQuery.isLoading ? '...' : activeMethodsCount}
          sub={`${methods.length} total metode terdaftar`}
        />
        <StatTile
          icon={Users}
          tone="violet"
          label="Pengguna Terdaftar"
          value={usersQuery.isLoading ? '...' : totalUsers}
          sub={`${holidays.length} hari libur kalender tercatat`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Frame className="lg:col-span-2">
          <FrameHeader
            icon={FileSpreadsheet}
            title="Paket Pengadaan Terbaru"
            count={totalProcurements}
            right={
              <Link
                to="/procurements"
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
              >
                Lihat Semua
                <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <Panel className="overflow-hidden">
            <DataState
              loading={procurementsQuery.isLoading}
              fetching={procurementsQuery.isFetching}
              error={
                procurementsQuery.isError
                  ? getApiErrorMessage(procurementsQuery.error)
                  : null
              }
              empty={procurements.length === 0}
              emptyTitle="Belum ada paket pengadaan"
              emptyDescription="Buat paket pengadaan pertama untuk mulai menyusun jadwal tahapan, HPS, dan dokumen tender."
              emptyAction={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate({ to: '/procurements' })}
                >
                  <Plus className="size-3.5" />
                  Buka Modul Paket Pengadaan
                </Button>
              }
              onRetry={() => procurementsQuery.refetch()}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                      <th className="px-3 py-2 font-medium">No. Pekerjaan & Nama Paket</th>
                      <th className="px-3 py-2 font-medium">Metode & Tahun</th>
                      <th className="px-3 py-2 font-medium text-right">Nilai Pagu</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {procurements.map((item) => (
                      <tr
                        key={item.id}
                        className="row-hover transition-colors cursor-pointer"
                        onClick={() =>
                          navigate({
                            to: '/procurements/$id',
                            params: { id: String(item.id) },
                          })
                        }
                      >
                        <td className="px-3 py-2.5">
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {item.jobNumber}
                          </div>
                          <div className="font-medium text-foreground line-clamp-1">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.projectLocation}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-foreground">
                            {item.procurementMethod?.name ?? `Metode #${item.procurementMethodId}`}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            TA {item.budgetYear}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums font-medium text-foreground">
                          {formatCurrency(item.budgetCeiling ?? item.budgetValue)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={item.status || 'draft'} />
                        </td>
                        <td
                          className="px-3 py-2.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              navigate({
                                to: '/procurements/$id',
                                params: { id: String(item.id) },
                              })
                            }
                          >
                            Detail
                            <ArrowUpRight className="size-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataState>
          </Panel>
        </Frame>

        <div className="space-y-4">
          <Frame>
            <FrameHeader
              icon={Milestone}
              title="Metode & Tahapan"
              count={methods.length}
              right={
                <Link
                  to="/master/procurement-methods"
                  className="text-xs font-medium text-foreground hover:underline"
                >
                  Atur →
                </Link>
              }
            />
            <Panel className="divide-y divide-border">
              <DataState
                loading={methodsQuery.isLoading}
                fetching={methodsQuery.isFetching}
                error={methodsQuery.isError ? getApiErrorMessage(methodsQuery.error) : null}
                empty={methods.length === 0}
                emptyTitle="Belum ada metode pengadaan"
                emptyDescription="Tambahkan metode pengadaan beserta urutan tahapan hari kerja/kalender."
                onRetry={() => methodsQuery.refetch()}
                rows={3}
              >
                {methods.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {m.description || 'Tanpa keterangan tambahan'}
                      </div>
                    </div>
                    <StatusBadge status={m.isActive !== false} />
                  </div>
                ))}
              </DataState>
            </Panel>
          </Frame>

          <Frame>
            <FrameHeader
              icon={CalendarDays}
              title="Kalender Hari Libur"
              count={holidays.length}
              right={
                <Link
                  to="/master/holiday"
                  className="text-xs font-medium text-foreground hover:underline"
                >
                  Kelola →
                </Link>
              }
            />
            <Panel className="divide-y divide-border">
              <DataState
                loading={holidaysQuery.isLoading}
                fetching={holidaysQuery.isFetching}
                error={holidaysQuery.isError ? getApiErrorMessage(holidaysQuery.error) : null}
                empty={holidays.length === 0}
                emptyTitle="Belum ada hari libur terdaftar"
                emptyDescription="Hari libur dipakai saat menghitung tahapan berjenis working_day."
                onRetry={() => holidaysQuery.refetch()}
                rows={3}
              >
                {holidays.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
                  >
                    <span className="truncate font-medium text-foreground">{h.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                      {formatDate(h.holidayDate)}
                    </span>
                  </div>
                ))}
              </DataState>
            </Panel>
          </Frame>

          <Frame>
            <FrameHeader icon={FolderKanban} title="Pintasan Modul Master & Akses" />
            <Panel className="grid grid-cols-2 gap-2 p-2.5">
              {[
                { label: 'Sub-Bidang Pekerjaan', to: '/master/job-sub-field', icon: FolderKanban },
                { label: 'Sumber Dana', to: '/master/funding-source', icon: Wallet },
                { label: 'Manajemen Pengguna', to: '/access/users', icon: Users },
                { label: 'Role & Permission', to: '/access/roles', icon: ShieldCheck },
              ].map((shortcut) => {
                const Icon = shortcut.icon
                return (
                  <Link
                    key={shortcut.to}
                    to={shortcut.to}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-xs font-medium text-foreground hover:bg-accent/60 transition"
                  >
                    <IconTile size="sm" tone="neutral">
                      <Icon />
                    </IconTile>
                    <span className="truncate">{shortcut.label}</span>
                  </Link>
                )
              })}
            </Panel>
          </Frame>
        </div>
      </div>
    </div>
  )
}
