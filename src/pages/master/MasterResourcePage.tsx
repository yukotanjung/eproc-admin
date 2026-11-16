import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useFormValidation } from '~/lib/hooks/useFormValidation'
import { Database, Edit3, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '~/components/layouts/PageHeader'
import {
  Badge,
  Button,
  ConfirmDialog,
  DataState,
  FieldLabel,
  FieldSelect,
  FormDialog,
  Frame,
  FrameHeader,
  Pager,
  Panel,
  RefreshButton,
  SearchInput,
  StatusBadge,
  Switch,
  fieldBase,
  useToast,
} from '~/components/ui'
import {
  type MasterItem,
  type MasterPayload,
  type MasterResourceKey,
  masterApi,
  masterQueries,
} from '~/integrations/api'
import { getApiErrorMessage } from '~/lib/utils/error'
import { formatDate, toInputDate } from '~/lib/utils/format'

export interface MasterResourceConfig {
  resource: MasterResourceKey
  title: string
  description: string
  hasCode?: boolean
  codeRequired?: boolean
  hasDescription?: boolean
  hasIsSpt?: boolean
  hasJobType?: boolean
  hasJobField?: boolean
  hasHolidayDate?: boolean
}

export const MASTER_CONFIGS: Record<MasterResourceKey, MasterResourceConfig> = {
  'funding-source': {
    resource: 'funding-source',
    title: 'Master Sumber Dana',
    description: 'Kelola daftar sumber pendanaan untuk paket pengadaan (APBN, APBD, RKAP, Hibah).',
    hasDescription: true,
  },
  tax: {
    resource: 'tax',
    title: 'Master Pajak & SPT',
    description: 'Kelola jenis dokumen pajak dan penanda kewajiban Surat Pemberitahuan Tahunan (SPT).',
    hasIsSpt: true,
  },
  'business-type': {
    resource: 'business-type',
    title: 'Master Badan Usaha',
    description: 'Kelola bentuk badan hukum penyedia barang/jasa (PT, CV, Firma, Koperasi).',
    hasDescription: true,
  },
  'work-unit': {
    resource: 'work-unit',
    title: 'Master Unit Kerja',
    description: 'Kelola daftar satuan kerja dan kode unit pemilik anggaran pengadaan.',
    hasCode: true,
    codeRequired: true,
    hasDescription: true,
  },
  unit: {
    resource: 'unit',
    title: 'Master Satuan Ukur (Unit)',
    description: 'Kelola satuan kuantitas untuk perhitungan item HPS (Unit, Paket, Bulan, Lisensi).',
    hasCode: true,
  },
  qualification: {
    resource: 'qualification',
    title: 'Master Kualifikasi Usaha',
    description: 'Kelola tingkat kualifikasi usaha penyedia (Kecil, Menengah, Besar, Non-Kecil).',
    hasDescription: true,
  },
  'education-level': {
    resource: 'education-level',
    title: 'Master Jenjang Pendidikan',
    description: 'Kelola tingkat pendidikan formal tenaga ahli (D3, S1, S2, S3).',
  },
  major: {
    resource: 'major',
    title: 'Master Jurusan Pendidikan',
    description: 'Kelola daftar program studi atau jurusan pendidikan tenaga ahli.',
  },
  'job-type': {
    resource: 'job-type',
    title: 'Master Jenis Pekerjaan',
    description: 'Kategori induk jenis pengadaan (Barang, Pekerjaan Konstruksi, Jasa Konsultansi, Jasa Lainnya).',
  },
  'job-field': {
    resource: 'job-field',
    title: 'Master Bidang Pekerjaan',
    description: 'Daftar bidang pekerjaan yang terhubung ke masing-masing Jenis Pekerjaan.',
    hasJobType: true,
  },
  'job-sub-field': {
    resource: 'job-sub-field',
    title: 'Master Sub-Bidang Pekerjaan',
    description: 'Rincian sub-bidang pekerjaan berdasarkan Jenis Pekerjaan dan Bidang Pekerjaan.',
    hasJobType: true,
    hasJobField: true,
  },
  classification: {
    resource: 'classification',
    title: 'Master Klasifikasi Penyedia',
    description: 'Klasifikasi kompetensi penyedia berdasarkan Jenis Pekerjaan dan Bidang Pekerjaan.',
    hasJobType: true,
    hasJobField: true,
  },
  holiday: {
    resource: 'holiday',
    title: 'Master Kalender Hari Libur',
    description: 'Daftar tanggal libur nasional/cuti bersama yang dikecualikan dari perhitungan working_day.',
    hasHolidayDate: true,
    hasDescription: true,
  },
}

export function MasterResourcePage({ resource }: { resource: MasterResourceKey }) {
  const config = MASTER_CONFIGS[resource]
  const toast = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [filterJobTypeId, setFilterJobTypeId] = useState('')
  const [filterJobFieldId, setFilterJobFieldId] = useState('')
  const [filterYear, setFilterYear] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MasterItem | null>(null)
  const [form, setForm] = useState<MasterPayload>({
    name: '',
    code: '',
    description: '',
    isSpt: false,
    isActive: true,
    jobTypeId: undefined,
    jobFieldId: undefined,
    holidayDate: toInputDate(new Date().toISOString()),
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<MasterItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const filterObj: Record<string, string | number | undefined> = {}
  if (config.hasJobType && filterJobTypeId) filterObj.jobTypeId = Number(filterJobTypeId)
  if (config.hasJobField && filterJobFieldId) filterObj.jobFieldId = Number(filterJobFieldId)
  if (config.hasHolidayDate && filterYear) filterObj.year = Number(filterYear)

  const listQuery = useQuery(
    masterQueries.list(resource, {
      page,
      pageSize,
      search: search.trim() || undefined,
      filter: Object.keys(filterObj).length > 0 ? filterObj : undefined,
    }),
  )

  const jobTypesQuery = useQuery({
    ...masterQueries.list('job-type', { all: true }),
    enabled: Boolean(config.hasJobType),
  })

  const jobFieldsQuery = useQuery({
    ...masterQueries.list('job-field', { all: true }),
    enabled: Boolean(config.hasJobField),
  })

  const items = listQuery.data?.result ?? []
  const total = listQuery.data?.paginate?.total ?? items.length
  const jobTypes = jobTypesQuery.data?.result ?? []
  const jobFields = jobFieldsQuery.data?.result ?? []

  const filteredModalJobFields = form.jobTypeId
    ? jobFields.filter((jf) => !jf.jobTypeId || jf.jobTypeId === form.jobTypeId)
    : jobFields

  const masterSchema = useMemo(
    () =>
      z.object({
        jobTypeId: config.hasJobType
          ? z.number({ error: 'Jenis Pekerjaan wajib dipilih' }).min(1, 'Jenis Pekerjaan wajib dipilih')
          : z.number().optional(),
        jobFieldId: config.hasJobField
          ? z.number({ error: 'Bidang Pekerjaan wajib dipilih' }).min(1, 'Bidang Pekerjaan wajib dipilih')
          : z.number().optional(),
        holidayDate: config.hasHolidayDate
          ? z.string().trim().min(1, 'Tanggal hari libur wajib diisi')
          : z.string().optional(),
        code: config.codeRequired
          ? z.string().trim().min(1, 'Kode wajib diisi')
          : z.string().nullable().optional(),
        name: z.string().trim().min(1, 'Nama wajib diisi'),
      }),
    [config],
  )
  const { errors, validate, clearError, clearErrors } = useFormValidation(masterSchema)

  const openCreate = () => {
    clearErrors()
    setEditing(null)
    setForm({
      name: '',
      code: '',
      description: '',
      isSpt: false,
      isActive: true,
      jobTypeId: config.hasJobType ? (jobTypes[0]?.id ?? undefined) : undefined,
      jobFieldId: config.hasJobField ? (jobFields[0]?.id ?? undefined) : undefined,
      holidayDate: config.hasHolidayDate ? toInputDate(new Date().toISOString()) : undefined,
    })
    setModalOpen(true)
  }

  const openEdit = (item: MasterItem) => {
    clearErrors()
    setEditing(item)
    setForm({
      name: item.name,
      code: item.code || '',
      description: item.description || '',
      isSpt: Boolean(item.isSpt),
      isActive: item.isActive !== false,
      jobTypeId: item.jobTypeId ?? item.jobType?.id ?? undefined,
      jobFieldId: item.jobFieldId ?? item.jobField?.id ?? undefined,
      holidayDate: toInputDate(item.holidayDate),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const parsed = validate({
      jobTypeId: form.jobTypeId,
      jobFieldId: form.jobFieldId,
      holidayDate: form.holidayDate ?? '',
      code: form.code ?? '',
      name: form.name,
    })
    if (!parsed.success) return

    const payload: MasterPayload = {
      name: form.name.trim(),
      isActive: form.isActive,
    }
    if (config.hasCode) payload.code = form.code?.trim() || null
    if (config.hasDescription) payload.description = form.description?.trim() || null
    if (config.hasIsSpt) payload.isSpt = Boolean(form.isSpt)
    if (config.hasJobType) payload.jobTypeId = Number(form.jobTypeId)
    if (config.hasJobField) payload.jobFieldId = Number(form.jobFieldId)
    if (config.hasHolidayDate) payload.holidayDate = form.holidayDate

    setSaving(true)
    try {
      if (editing) {
        await masterApi.update(resource, editing.id, payload)
        toast.push({ title: `${config.title} diperbarui`, tone: 'success' })
      } else {
        await masterApi.create(resource, payload)
        toast.push({ title: `${config.title} ditambahkan`, tone: 'success' })
      }
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['master', resource] })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan data master',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeletingLoading(true)
    try {
      await masterApi.remove(resource, deleting.id)
      toast.push({ title: 'Data berhasil dihapus', tone: 'info' })
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['master', resource] })
    } catch (err) {
      toast.push({
        title: 'Gagal menghapus data',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setDeletingLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            <RefreshButton loading={listQuery.isFetching} onClick={() => listQuery.refetch()} />
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              Tambah Data
            </Button>
          </>
        }
      />

      <Frame>
        <FrameHeader
          icon={Database}
          title={config.title}
          count={total}
          right={
            <div className="flex flex-wrap items-center gap-1.5">
              {config.hasJobType && (
                <FieldSelect
                  value={filterJobTypeId}
                  onChange={(v) => {
                    setFilterJobTypeId(v)
                    setPage(1)
                  }}
                  placeholder="Semua Jenis Pekerjaan"
                  options={jobTypes.map((jt) => ({ value: jt.id, label: jt.name }))}
                  className="w-44"
                />
              )}
              {config.hasJobField && (
                <FieldSelect
                  value={filterJobFieldId}
                  onChange={(v) => {
                    setFilterJobFieldId(v)
                    setPage(1)
                  }}
                  placeholder="Semua Bidang Pekerjaan"
                  options={jobFields.map((jf) => ({ value: jf.id, label: jf.name }))}
                  className="w-44"
                />
              )}
              {config.hasHolidayDate && (
                <input
                  type="number"
                  value={filterYear}
                  onChange={(e) => {
                    setFilterYear(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Filter Tahun"
                  className="h-7 w-28 rounded-lg border border-border bg-card px-2 font-mono text-xs text-foreground focus:outline-none"
                />
              )}
              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
                placeholder="Cari nama..."
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
            emptyTitle={`Belum ada data pada ${config.title}`}
            emptyDescription="Klik tombol Tambah Data di kanan atas untuk membuat entri baru."
            emptyAction={
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus className="size-3.5" />
                Tambah Data Pertama
              </Button>
            }
            onRetry={() => listQuery.refetch()}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                    <th className="px-3 py-2 font-medium w-16">ID</th>
                    {config.hasCode && <th className="px-3 py-2 font-medium">Kode</th>}
                    {config.hasHolidayDate && <th className="px-3 py-2 font-medium">Tanggal</th>}
                    <th className="px-3 py-2 font-medium">Nama</th>
                    {config.hasJobType && (
                      <th className="px-3 py-2 font-medium">Jenis Pekerjaan</th>
                    )}
                    {config.hasJobField && (
                      <th className="px-3 py-2 font-medium">Bidang Pekerjaan</th>
                    )}
                    {config.hasIsSpt && <th className="px-3 py-2 font-medium">Kategori SPT</th>}
                    {config.hasDescription && <th className="px-3 py-2 font-medium">Deskripsi</th>}
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className="row-hover">
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">#{item.id}</td>
                      {config.hasCode && (
                        <td className="px-3 py-2.5 font-mono font-medium text-foreground">
                          {item.code || '-'}
                        </td>
                      )}
                      {config.hasHolidayDate && (
                        <td className="px-3 py-2.5 font-mono text-foreground">
                          {formatDate(item.holidayDate)}
                        </td>
                      )}
                      <td className="px-3 py-2.5 font-medium text-foreground">{item.name}</td>
                      {config.hasJobType && (
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {item.jobType?.name ||
                            jobTypes.find((x) => x.id === item.jobTypeId)?.name ||
                            (item.jobTypeId ? `#${item.jobTypeId}` : '-')}
                        </td>
                      )}
                      {config.hasJobField && (
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {item.jobField?.name ||
                            jobFields.find((x) => x.id === item.jobFieldId)?.name ||
                            (item.jobFieldId ? `#${item.jobFieldId}` : '-')}
                        </td>
                      )}
                      {config.hasIsSpt && (
                        <td className="px-3 py-2.5">
                          {item.isSpt ? (
                            <Badge tone="sky" size="xs">
                              Pajak SPT
                            </Badge>
                          ) : (
                            <Badge tone="neutral" size="xs">
                              Non-SPT
                            </Badge>
                          )}
                        </td>
                      )}
                      {config.hasDescription && (
                        <td className="px-3 py-2.5 text-muted-foreground max-w-sm truncate">
                          {item.description || '-'}
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <StatusBadge status={item.isActive !== false} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => openEdit(item)}
                            aria-label={`Ubah ${item.name}`}
                          >
                            <Edit3 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => setDeleting(item)}
                            aria-label={`Hapus ${item.name}`}
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
        title={editing ? `Ubah ${config.title}` : `Tambah ${config.title}`}
        loading={saving}
        onSubmit={handleSave}
      >
        {config.hasJobType && (
          <FieldLabel label="Jenis Pekerjaan" required error={errors.jobTypeId}>
            <FieldSelect
              error={errors.jobTypeId}
              value={form.jobTypeId || ''}
              onChange={(v) => {
                setForm({ ...form, jobTypeId: Number(v) })
                clearError('jobTypeId')
              }}
              placeholder="Pilih Jenis Pekerjaan"
              options={jobTypes.map((jt) => ({ value: jt.id, label: jt.name }))}
            />
          </FieldLabel>
        )}

        {config.hasJobField && (
          <FieldLabel label="Bidang Pekerjaan" required error={errors.jobFieldId}>
            <FieldSelect
              error={errors.jobFieldId}
              value={form.jobFieldId || ''}
              onChange={(v) => {
                setForm({ ...form, jobFieldId: Number(v) })
                clearError('jobFieldId')
              }}
              placeholder="Pilih Bidang Pekerjaan"
              options={filteredModalJobFields.map((jf) => ({ value: jf.id, label: jf.name }))}
            />
          </FieldLabel>
        )}

        {config.hasHolidayDate && (
          <FieldLabel label="Tanggal Hari Libur" required error={errors.holidayDate}>
            <input
              type="date"
              aria-invalid={Boolean(errors.holidayDate)}
              value={form.holidayDate ?? ''}
              onChange={(e) => {
                setForm({ ...form, holidayDate: e.target.value })
                clearError('holidayDate')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
        )}

        {config.hasCode && (
          <FieldLabel label="Kode" required={config.codeRequired} error={errors.code}>
            <input
              type="text"
              aria-invalid={Boolean(errors.code)}
              value={form.code ?? ''}
              onChange={(e) => {
                setForm({ ...form, code: e.target.value })
                clearError('code')
              }}
              placeholder="Contoh: UK-01 atau PKT"
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
        )}

        <FieldLabel label="Nama" required error={errors.name}>
          <input
            type="text"
            aria-invalid={Boolean(errors.name)}
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value })
              clearError('name')
            }}
            placeholder="Masukkan nama entri"
            className={fieldBase}
          />
        </FieldLabel>

        {config.hasDescription && (
          <FieldLabel label="Deskripsi">
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Keterangan tambahan (opsional)"
              className="w-full rounded-lg border border-border bg-white p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-neutral-400 focus:outline-none"
            />
          </FieldLabel>
        )}

        {config.hasIsSpt && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
            <div>
              <div className="text-xs font-medium text-foreground">Merupakan Dokumen SPT</div>
              <div className="text-[11px] text-muted-foreground">
                Tandai jika pajak ini adalah Surat Pemberitahuan Tahunan (SPT).
              </div>
            </div>
            <Switch
              checked={form.isSpt}
              onChange={(v) => setForm({ ...form, isSpt: v })}
              ariaLabel="Dokumen pajak SPT"
            />
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-xs font-medium text-foreground">Status Aktif</span>
          <Switch
            checked={form.isActive}
            onChange={(v) => setForm({ ...form, isActive: v })}
            ariaLabel="Status aktif"
          />
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Hapus "${deleting?.name ?? ''}"?`}
        description="Data yang sudah dihapus tidak dapat dikembalikan."
        confirmLabel="Ya, Hapus"
        loading={deletingLoading}
        onConfirm={handleDelete}
      />
    </div>
  )
}
