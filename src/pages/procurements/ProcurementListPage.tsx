import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Ban,
  Edit3,
  FileSpreadsheet,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '~/components/layouts/PageHeader'
import {
  Badge,
  Button,
  ConfirmDialog,
  DataState,
  FieldLabel,
  FieldSelect,
  FilterGroup,
  FormDialog,
  Frame,
  RefreshButton,
  FrameHeader,
  Menu,
  Pager,
  Panel,
  SearchInput,
  StatusBadge,
  useToast,
} from '~/components/ui'
import {
  type ProcurementItem,
  masterQueries,
  procurementApi,
  procurementMethodQueries,
  procurementQueries,
} from '~/integrations/api'
import { getApiErrorMessage } from '~/lib/utils/error'
import { formatCurrency } from '~/lib/utils/format'

export function ProcurementListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')

  const [cancelling, setCancelling] = useState<ProcurementItem | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  const [deleting, setDeleting] = useState<ProcurementItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filterParams: Record<string, string | number | undefined> = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    budgetYear: yearFilter ? Number(yearFilter) : undefined,
    procurementMethodId: methodFilter ? Number(methodFilter) : undefined,
    jobTypeId: jobTypeFilter ? Number(jobTypeFilter) : undefined,
  }

  const listQuery = useQuery(
    procurementQueries.list({
      page,
      pageSize,
      search: search.trim() || undefined,
      filter: filterParams,
    }),
  )

  const jobTypesQuery = useQuery(masterQueries.list('job-type', { all: true }))
  const methodsQuery = useQuery(procurementMethodQueries.list({ all: true }))
  const qualificationsQuery = useQuery(masterQueries.list('qualification', { all: true }))
  const fundingSourcesQuery = useQuery(masterQueries.list('funding-source', { all: true }))

  const items = listQuery.data?.result ?? []
  const total = listQuery.data?.paginate?.total ?? items.length

  const jobTypes = jobTypesQuery.data?.result ?? []
  const methods = methodsQuery.data?.result ?? []
  const qualifications = qualificationsQuery.data?.result ?? []
  const fundingSources = fundingSourcesQuery.data?.result ?? []

  const handleCancelProcurement = async () => {
    if (!cancelling) return
    setCancelLoading(true)
    try {
      await procurementApi.cancel(cancelling.id, cancelReason.trim() || undefined)
      toast.push({
        title: 'Paket pengadaan dibatalkan',
        description: `${cancelling.jobNumber} telah berstatus dibatalkan.`,
        tone: 'warn',
      })
      setCancelling(null)
      setCancelReason('')
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
    } catch (err) {
      toast.push({
        title: 'Gagal membatalkan pengadaan',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setCancelLoading(false)
    }
  }

  const handleDeleteProcurement = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await procurementApi.remove(deleting.id)
      toast.push({
        title: 'Paket pengadaan dihapus',
        description: `${deleting.jobNumber} telah dihapus dari sistem.`,
        tone: 'info',
      })
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menghapus pengadaan',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Paket Pengadaan"
        description="Kelola daftar paket pengadaan, filter berdasarkan metode atau tahun anggaran, dan buka ruang kerja detail untuk mengatur jadwal, HPS, dokumen, serta checklist."
        actions={
          <>
            <RefreshButton loading={listQuery.isFetching} onClick={() => listQuery.refetch()} />
            <Link
              to="/procurements/new"
              className="inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 ease-out hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] [&_svg]:size-3.5"
            >
              <Plus />
              Buat Paket Pengadaan
            </Link>
          </>
        }
      />

      <Frame>
        <FrameHeader
          icon={FileSpreadsheet}
          title="Daftar Paket Pengadaan"
          count={total}
          right={
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterGroup
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
                items={[
                  { value: 'all', label: 'Semua' },
                  { value: 'draft', label: 'Draf', dot: 'bg-amber-500' },
                  { value: 'published', label: 'Tayang', dot: 'bg-emerald-500' },
                  { value: 'cancelled', label: 'Batal', dot: 'bg-rose-500' },
                ]}
              />
              <FieldSelect
                value={methodFilter}
                onChange={(v) => {
                  setMethodFilter(v)
                  setPage(1)
                }}
                placeholder="Semua Metode"
                options={methods.map((m) => ({ value: m.id, label: m.name }))}
                className="w-40"
              />
              <FieldSelect
                value={jobTypeFilter}
                onChange={(v) => {
                  setJobTypeFilter(v)
                  setPage(1)
                }}
                placeholder="Semua Jenis"
                options={jobTypes.map((jt) => ({ value: jt.id, label: jt.name }))}
                className="w-40"
              />
              <input
                type="number"
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value)
                  setPage(1)
                }}
                placeholder="Tahun (mis. 2026)"
                className="h-7 w-28 rounded-lg border border-border bg-card px-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
                placeholder="Cari nomor / nama paket..."
                className="w-56"
              />
            </div>
          }
        />

        <Panel className="overflow-hidden">
          <DataState
            loading={listQuery.isLoading}
            fetching={listQuery.isFetching}
            error={listQuery.isError ? getApiErrorMessage(listQuery.error) : null}
            empty={items.length === 0}
            emptyTitle="Tidak ada paket pengadaan ditemukan"
            emptyDescription="Belum ada paket yang sesuai filter pencarian atau belum ada paket pengadaan terdaftar."
            emptyAction={
              <Link
                to="/procurements/new"
                className="inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 ease-out hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] [&_svg]:size-3.5"
              >
                <Plus />
                Tambah Paket Pengadaan
              </Link>
            }
            onRetry={() => listQuery.refetch()}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                    <th className="px-3 py-2 font-medium">No. Pekerjaan</th>
                    <th className="px-3 py-2 font-medium">Nama Paket & Lokasi</th>
                    <th className="px-3 py-2 font-medium">Metode & Kualifikasi</th>
                    <th className="px-3 py-2 font-medium">Sumber Dana</th>
                    <th className="px-3 py-2 font-medium text-right">Nilai Pagu</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() =>
                        navigate({
                          to: '/procurements/$id',
                          params: { id: String(item.id) },
                        })
                      }
                      className="row-hover transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-2.5 align-top">
                        <span className="font-mono text-[11px] font-medium text-foreground">
                          {item.jobNumber || '-'}
                        </span>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          TA {item.budgetYear}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top max-w-sm">
                        <div className="font-medium text-foreground">{item.name}</div>
                        {item.projectLocation && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.projectLocation}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="text-foreground">
                          {item.procurementMethod?.name ||
                            methods.find((m) => m.id === item.procurementMethodId)?.name ||
                            '-'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.qualification?.name ||
                            qualifications.find((q) => q.id === item.qualificationId)?.name ||
                            '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="text-foreground">
                          {item.fundingSource?.name ||
                            fundingSources.find((f) => f.id === item.fundingSourceId)?.name ||
                            '-'}
                        </div>
                        {item.jobType?.name && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.jobType.name}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top text-right font-mono tabular-nums font-medium text-foreground">
                        <div>{formatCurrency(item.budgetCeiling ?? item.budgetValue)}</div>
                        {item.estimatedPrice != null && Number(item.estimatedPrice) > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            HPS: {formatCurrency(item.estimatedPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <StatusBadge status={item.status || 'draft'} />
                      </td>
                      <td
                        className="px-3 py-2.5 align-top text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
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
                            Ruang Kerja
                            <ArrowUpRight className="size-3" />
                          </Button>
                          <Menu
                            trigger={
                              <Button
                                variant="ghost"
                                size="iconSm"
                                aria-label="Menu tindakan paket"
                              >
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            }
                            items={[
                              {
                                label: 'Buka Detail & Tahapan',
                                icon: ArrowUpRight,
                                onSelect: () =>
                                  navigate({
                                    to: '/procurements/$id',
                                    params: { id: String(item.id) },
                                  }),
                              },
                              {
                                label: 'Ubah Informasi Paket',
                                icon: Edit3,
                                onSelect: () =>
                                  navigate({
                                    to: '/procurements/$id/edit',
                                    params: { id: String(item.id) },
                                  }),
                              },
                              {
                                label: 'Batalkan Pengadaan',
                                icon: Ban,
                                onSelect: () => {
                                  setCancelling(item)
                                  setCancelReason('')
                                },
                              },
                              { type: 'sep' },
                              {
                                label: 'Hapus Paket',
                                icon: Trash2,
                                tone: 'destructive',
                                onSelect: () => setDeleting(item),
                              },
                            ]}
                          />
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
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title={`Batalkan Paket ${cancelling?.jobNumber ?? ''}`}
        description="Tindakan ini mengubah status pengadaan menjadi dibatalkan."
        submitLabel="Batalkan Pengadaan"
        tone="destructive"
        loading={cancelLoading}
        onSubmit={handleCancelProcurement}
      >
        <FieldLabel label="Alasan Pembatalan">
          <textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Contoh: Revisi dokumen anggaran atau tidak ada peserta yang lulus evaluasi..."
            className="w-full rounded-lg border border-border bg-white p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-neutral-400 focus:outline-none"
          />
        </FieldLabel>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Hapus Paket ${deleting?.jobNumber ?? ''}?`}
        description="Seluruh jadwal, HPS, dan dokumen terkait paket ini akan ikut terhapus."
        confirmLabel="Ya, Hapus Paket"
        loading={deleteLoading}
        onConfirm={handleDeleteProcurement}
      />
    </div>
  )
}
