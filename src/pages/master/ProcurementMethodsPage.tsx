import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useFormValidation } from '~/lib/hooks/useFormValidation'
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Edit3,
  Milestone,
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
  FormDialog,
  Frame,
  FrameHeader,
  Panel,
  RefreshButton,
  StatusBadge,
  Switch,
  fieldBase,
  useToast,
} from '~/components/ui'
import {
  type PreviewScheduleStageItem,
  type ProcurementMethod,
  type ProcurementMethodPayload,
  type ProcurementMethodStage,
  type ProcurementMethodStagePayload,
  procurementMethodApi,
  procurementMethodQueries,
} from '~/integrations/api'
import { getApiErrorMessage } from '~/lib/utils/error'
import { formatDate, toInputDate } from '~/lib/utils/format'

const emptyStageForm: ProcurementMethodStagePayload = {
  sequence: 1,
  name: '',
  durationDays: 3,
  dayType: 'working_day',
  requiresFile: false,
  isPublic: true,
  pageKey: 'announcement_page',
  processKey: 'announcement',
  description: '',
  isActive: true,
}

export function ProcurementMethodsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const methodsQuery = useQuery(procurementMethodQueries.list({ all: true }))
  const methods = methodsQuery.data?.result ?? []

  const [selectedId, setSelectedId] = useState<number>(0)

  useEffect(() => {
    if (!selectedId && methods.length > 0) {
      setSelectedId(methods[0].id)
    }
  }, [methods, selectedId])

  const selectedMethod = methods.find((m) => m.id === selectedId) ?? null
  const stagesQuery = useQuery(procurementMethodQueries.stages(selectedId))
  const stages = stagesQuery.data?.result ?? []

  const [methodModalOpen, setMethodModalOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<ProcurementMethod | null>(null)
  const [methodForm, setMethodForm] = useState<ProcurementMethodPayload>({
    name: '',
    description: '',
    isActive: true,
  })
  const [savingMethod, setSavingMethod] = useState(false)
  const [deletingMethod, setDeletingMethod] = useState<ProcurementMethod | null>(null)

  const methodFormValidation = useFormValidation(
    z.object({
      name: z.string().trim().min(1, 'Nama metode pengadaan wajib diisi'),
    }),
  )
  const stageFormValidation = useFormValidation(
    z.object({
      sequence: z.number().min(1, 'Urutan minimal 1'),
      durationDays: z.number().min(1, 'Durasi minimal 1 hari'),
      name: z.string().trim().min(1, 'Nama tahapan wajib diisi'),
      pageKey: z.string().trim().min(1, 'Page Key wajib diisi'),
      processKey: z.string().trim().min(1, 'Process Key wajib diisi'),
    }),
  )

  const openCreateMethod = () => {
    methodFormValidation.clearErrors()
    setEditingMethod(null)
    setMethodForm({ name: '', description: '', isActive: true })
    setMethodModalOpen(true)
  }

  const openEditMethod = (m: ProcurementMethod) => {
    methodFormValidation.clearErrors()
    setEditingMethod(m)
    setMethodForm({
      name: m.name,
      description: m.description || '',
      isActive: m.isActive !== false,
    })
    setMethodModalOpen(true)
  }

  const handleSaveMethod = async () => {
    const parsed = methodFormValidation.validate({ name: methodForm.name })
    if (!parsed.success) return
    setSavingMethod(true)
    try {
      if (editingMethod) {
        await procurementMethodApi.update(editingMethod.id, methodForm)
        toast.push({ title: 'Metode pengadaan diperbarui', tone: 'success' })
      } else {
        const res = await procurementMethodApi.create(methodForm)
        toast.push({ title: 'Metode pengadaan ditambahkan', tone: 'success' })
        if (res.result?.id) setSelectedId(res.result.id)
      }
      setMethodModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['procurement-methods'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan metode pengadaan',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingMethod(false)
    }
  }

  const handleDeleteMethod = async () => {
    if (!deletingMethod) return
    try {
      await procurementMethodApi.remove(deletingMethod.id)
      toast.push({ title: 'Metode pengadaan dihapus', tone: 'info' })
      if (selectedId === deletingMethod.id) setSelectedId(0)
      setDeletingMethod(null)
      queryClient.invalidateQueries({ queryKey: ['procurement-methods'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menghapus metode pengadaan',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    }
  }

  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<ProcurementMethodStage | null>(null)
  const [stageForm, setStageForm] = useState<ProcurementMethodStagePayload>(emptyStageForm)
  const [savingStage, setSavingStage] = useState(false)
  const [deletingStage, setDeletingStage] = useState<ProcurementMethodStage | null>(null)
  const [reordering, setReordering] = useState(false)

  const openCreateStage = () => {
    stageFormValidation.clearErrors()
    setEditingStage(null)
    setStageForm({
      ...emptyStageForm,
      sequence: stages.length + 1,
    })
    setStageModalOpen(true)
  }

  const openEditStage = (stage: ProcurementMethodStage) => {
    stageFormValidation.clearErrors()
    setEditingStage(stage)
    setStageForm({
      sequence: stage.sequence,
      name: stage.name,
      durationDays: stage.durationDays,
      dayType: stage.dayType,
      requiresFile: stage.requiresFile,
      isPublic: stage.isPublic,
      pageKey: stage.pageKey,
      processKey: stage.processKey,
      description: stage.description || '',
      isActive: stage.isActive !== false,
    })
    setStageModalOpen(true)
  }

  const handleSaveStage = async () => {
    if (!selectedId) return
    const parsed = stageFormValidation.validate({
      sequence: stageForm.sequence,
      durationDays: stageForm.durationDays,
      name: stageForm.name,
      pageKey: stageForm.pageKey,
      processKey: stageForm.processKey,
    })
    if (!parsed.success) return
    setSavingStage(true)
    try {
      if (editingStage) {
        await procurementMethodApi.updateStage(selectedId, editingStage.id, stageForm)
        toast.push({ title: 'Tahapan metode diperbarui', tone: 'success' })
      } else {
        await procurementMethodApi.createStage(selectedId, stageForm)
        toast.push({ title: 'Tahapan metode ditambahkan', tone: 'success' })
      }
      setStageModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['procurement-methods', selectedId, 'stages'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan tahapan',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingStage(false)
    }
  }

  const handleDeleteStage = async () => {
    if (!selectedId || !deletingStage) return
    try {
      await procurementMethodApi.removeStage(selectedId, deletingStage.id)
      toast.push({ title: 'Tahapan dihapus', tone: 'info' })
      setDeletingStage(null)
      queryClient.invalidateQueries({ queryKey: ['procurement-methods', selectedId, 'stages'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menghapus tahapan',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    }
  }

  const handleMoveStage = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction
    if (!selectedId || targetIdx < 0 || targetIdx >= stages.length) return
    const nextOrder = [...stages]
    const [moved] = nextOrder.splice(index, 1)
    nextOrder.splice(targetIdx, 0, moved)
    setReordering(true)
    try {
      await procurementMethodApi.reorderStages(
        selectedId,
        nextOrder.map((s) => s.id),
      )
      toast.push({ title: 'Urutan tahapan diperbarui', tone: 'success' })
      queryClient.invalidateQueries({ queryKey: ['procurement-methods', selectedId, 'stages'] })
    } catch (err) {
      toast.push({
        title: 'Gagal mengubah urutan tahapan',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setReordering(false)
    }
  }

  const [previewStartDate, setPreviewStartDate] = useState(toInputDate(new Date().toISOString()))
  const [previewItems, setPreviewItems] = useState<PreviewScheduleStageItem[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    setPreviewItems([])
  }, [selectedId])

  const handlePreviewSchedule = async () => {
    if (!selectedId || !previewStartDate) return
    setPreviewLoading(true)
    try {
      const res = await procurementMethodApi.previewSchedule(selectedId, previewStartDate)
      const nextStages = res.result?.stages ?? []
      setPreviewItems(nextStages)
      toast.push({
        title: 'Simulasi jadwal berhasil dihitung',
        description: `${nextStages.length} tahapan dikalkulasi mulai ${previewStartDate}.`,
        tone: 'info',
      })
    } catch (err) {
      toast.push({
        title: 'Gagal menghitung simulasi jadwal',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Metode Pengadaan & Susunan Tahapan"
        description="Konfigurasi daftar metode pengadaan, atur urutan tahapan (sequence), durasi hari kerja/kalender, serta simulasi jadwal otomatis."
        actions={
          <>
            <RefreshButton
              loading={methodsQuery.isFetching || stagesQuery.isFetching}
              onClick={() => {
                methodsQuery.refetch()
                if (selectedId) stagesQuery.refetch()
              }}
            />
            <Button variant="primary" size="sm" onClick={openCreateMethod}>
              <Plus className="size-3.5" />
              Tambah Metode Pengadaan
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Frame>
          <FrameHeader
            icon={Milestone}
            title="Daftar Metode"
            count={methods.length}
          />
          <Panel className="divide-y divide-border overflow-hidden">
            <DataState
              loading={methodsQuery.isLoading}
              fetching={methodsQuery.isFetching}
              error={methodsQuery.isError ? getApiErrorMessage(methodsQuery.error) : null}
              empty={methods.length === 0}
              emptyTitle="Belum ada metode pengadaan"
              emptyDescription="Tambahkan metode seperti Tender Terbuka, Seleksi, atau Penunjukan Langsung."
              emptyAction={
                <Button variant="primary" size="sm" onClick={openCreateMethod}>
                  <Plus className="size-3.5" />
                  Buat Metode
                </Button>
              }
              onRetry={() => methodsQuery.refetch()}
              rows={4}
            >
              {methods.map((m) => {
                const active = m.id === selectedId
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id)
                      setPreviewItems([])
                    }}
                    className={`flex items-start justify-between gap-2 p-3 text-xs transition cursor-pointer ${
                      active ? 'bg-accent/80' : 'hover:bg-accent/40'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate">{m.name}</span>
                        <StatusBadge status={m.isActive !== false} />
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {m.description || 'Tanpa deskripsi tambahan'}
                      </p>
                    </div>
                    <div
                      className="inline-flex items-center gap-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => openEditMethod(m)}
                        aria-label="Ubah metode"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => setDeletingMethod(m)}
                        aria-label="Hapus metode"
                      >
                        <Trash2 className="size-3.5 text-rose-600" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </DataState>
          </Panel>
        </Frame>

        <div className="lg:col-span-2 space-y-4">
          <Frame>
            <FrameHeader
              icon={Milestone}
              title={
                selectedMethod
                  ? `Tahapan: ${selectedMethod.name}`
                  : 'Pilih Metode Pengadaan'
              }
              count={stages.length}
              right={
                selectedId ? (
                  <Button variant="primary" size="xs" onClick={openCreateStage}>
                    <Plus className="size-3.5" />
                    Tambah Tahapan
                  </Button>
                ) : null
              }
            />
            <Panel className="overflow-hidden">
              <DataState
                loading={stagesQuery.isLoading}
                fetching={stagesQuery.isFetching}
                error={stagesQuery.isError ? getApiErrorMessage(stagesQuery.error) : null}
                empty={!selectedId || stages.length === 0}
                emptyTitle={
                  selectedId
                    ? 'Belum ada tahapan pada metode ini'
                    : 'Pilih salah satu metode di sebelah kiri'
                }
                emptyDescription="Susun urutan tahapan seperti Pengumuman, Pendaftaran, Aanwijzing, Pemasukan Penawaran, Evaluasi, dan Penetapan Pemenang."
                emptyAction={
                  selectedId ? (
                    <Button variant="primary" size="sm" onClick={openCreateStage}>
                      <Plus className="size-3.5" />
                      Tambah Tahapan Pertama
                    </Button>
                  ) : null
                }
                onRetry={() => stagesQuery.refetch()}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                        <th className="px-3 py-2 font-medium w-20">Urutan</th>
                        <th className="px-3 py-2 font-medium">Nama Tahapan & Key</th>
                        <th className="px-3 py-2 font-medium">Durasi & Jenis Hari</th>
                        <th className="px-3 py-2 font-medium">Atribut</th>
                        <th className="px-3 py-2 font-medium text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stages.map((st, idx) => (
                        <tr key={st.id} className="row-hover">
                          <td className="px-3 py-2.5">
                            <div className="inline-flex items-center gap-1">
                              <span className="font-mono font-semibold text-foreground w-5">
                                #{st.sequence}
                              </span>
                              <button
                                type="button"
                                disabled={idx === 0 || reordering}
                                onClick={() => handleMoveStage(idx, -1)}
                                aria-label="Geser tahapan ke atas"
                                className="inline-flex size-5 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                              >
                                <ArrowUp className="size-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === stages.length - 1 || reordering}
                                onClick={() => handleMoveStage(idx, 1)}
                                aria-label="Geser tahapan ke bawah"
                                className="inline-flex size-5 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                              >
                                <ArrowDown className="size-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-foreground">{st.name}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              page: {st.pageKey} · proc: {st.processKey}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono font-medium">{st.durationDays} hari</span> ·{' '}
                            <Badge
                              tone={st.dayType === 'working_day' ? 'amber' : 'neutral'}
                              size="xs"
                            >
                              {st.dayType === 'working_day' ? 'Hari Kerja' : 'Kalender'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {st.requiresFile && (
                                <Badge tone="sky" size="xs">
                                  Wajib Berkas
                                </Badge>
                              )}
                              {st.isPublic ? (
                                <Badge tone="emerald" size="xs">
                                  Publik
                                </Badge>
                              ) : (
                                <Badge tone="neutral" size="xs">
                                  Internal
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => openEditStage(st)}
                                aria-label="Ubah tahapan"
                              >
                                <Edit3 className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => setDeletingStage(st)}
                                aria-label="Hapus tahapan"
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

          {selectedId > 0 && (
            <Frame>
              <FrameHeader
                icon={CalendarClock}
                title="Simulator Jadwal Tahapan (Preview Schedule)"
                right={
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={previewStartDate}
                      onChange={(e) => setPreviewStartDate(e.target.value)}
                      className="h-7 rounded-lg border border-border bg-white px-2 font-mono text-xs text-foreground"
                    />
                    <Button
                      variant="primary"
                      size="xs"
                      loading={previewLoading}
                      onClick={handlePreviewSchedule}
                    >
                      Hitung Simulasi
                    </Button>
                  </div>
                }
              />
              <Panel className="overflow-hidden">
                {previewItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Pilih tanggal mulai lalu klik <strong className="text-foreground">Hitung Simulasi</strong> untuk menguji kalkulasi tanggal tahapan (memperhitungkan akhir pekan & hari libur nasional).
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                          <th className="px-3 py-2 font-medium">#</th>
                          <th className="px-3 py-2 font-medium">Tahapan</th>
                          <th className="px-3 py-2 font-medium">Durasi</th>
                          <th className="px-3 py-2 font-medium">Mulai</th>
                          <th className="px-3 py-2 font-medium">Selesai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewItems.map((item) => (
                          <tr key={item.sequence} className="row-hover">
                            <td className="px-3 py-2 font-mono text-muted-foreground">
                              #{item.sequence}
                            </td>
                            <td className="px-3 py-2 font-medium text-foreground">{item.name}</td>
                            <td className="px-3 py-2 font-mono text-[11px]">
                              {item.durationDays} hr (
                              {item.dayType === 'working_day' ? 'Hari Kerja' : 'Kalender'})
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-foreground">
                              {formatDate(item.startDate || item.startAt)}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-foreground">
                              {formatDate(item.endDate || item.endAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </Frame>
          )}
        </div>
      </div>

      <FormDialog
        open={methodModalOpen}
        onClose={() => setMethodModalOpen(false)}
        title={editingMethod ? 'Ubah Metode Pengadaan' : 'Tambah Metode Pengadaan'}
        loading={savingMethod}
        onSubmit={handleSaveMethod}
      >
        <FieldLabel
          label="Nama Metode Pengadaan"
          required
          error={methodFormValidation.errors.name}
        >
          <input
            type="text"
            aria-invalid={Boolean(methodFormValidation.errors.name)}
            value={methodForm.name}
            onChange={(e) => {
              setMethodForm({ ...methodForm, name: e.target.value })
              methodFormValidation.clearError('name')
            }}
            placeholder="Tender Terbuka Pascakualifikasi"
            className={fieldBase}
          />
        </FieldLabel>
        <FieldLabel label="Deskripsi Metode">
          <textarea
            rows={3}
            value={methodForm.description ?? ''}
            onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
            placeholder="Penjelasan penggunaan metode dan batas nilai..."
            className="w-full rounded-lg border border-border bg-white p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-neutral-400 focus:outline-none"
          />
        </FieldLabel>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-xs font-medium text-foreground">Status Aktif</span>
          <Switch
            checked={methodForm.isActive}
            onChange={(v) => setMethodForm({ ...methodForm, isActive: v })}
            ariaLabel="Aktifkan metode pengadaan"
          />
        </div>
      </FormDialog>

      <FormDialog
        open={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        title={editingStage ? 'Ubah Tahapan Metode' : 'Tambah Tahapan Metode'}
        size="lg"
        loading={savingStage}
        onSubmit={handleSaveStage}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FieldLabel
            label="Urutan (Sequence)"
            required
            error={stageFormValidation.errors.sequence}
          >
            <input
              type="number"
              min={1}
              aria-invalid={Boolean(stageFormValidation.errors.sequence)}
              value={stageForm.sequence}
              onChange={(e) => {
                setStageForm({ ...stageForm, sequence: Number(e.target.value) })
                stageFormValidation.clearError('sequence')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
          <FieldLabel
            label="Durasi (Hari)"
            required
            error={stageFormValidation.errors.durationDays}
          >
            <input
              type="number"
              min={1}
              aria-invalid={Boolean(stageFormValidation.errors.durationDays)}
              value={stageForm.durationDays}
              onChange={(e) => {
                setStageForm({ ...stageForm, durationDays: Number(e.target.value) })
                stageFormValidation.clearError('durationDays')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
          <FieldLabel label="Tipe Perhitungan Hari" required>
            <FieldSelect
              value={stageForm.dayType}
              onChange={(v) =>
                setStageForm({ ...stageForm, dayType: v as 'calendar' | 'working_day' })
              }
              options={[
                { value: 'working_day', label: 'Hari Kerja (Working Day)' },
                { value: 'calendar', label: 'Hari Kalender (Calendar)' },
              ]}
            />
          </FieldLabel>
        </div>

        <FieldLabel label="Nama Tahapan" required error={stageFormValidation.errors.name}>
          <input
            type="text"
            aria-invalid={Boolean(stageFormValidation.errors.name)}
            value={stageForm.name}
            onChange={(e) => {
              setStageForm({ ...stageForm, name: e.target.value })
              stageFormValidation.clearError('name')
            }}
            placeholder="Pemasukan Dokumen Penawaran"
            className={fieldBase}
          />
        </FieldLabel>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldLabel
            label="Page Key (Identitas Halaman)"
            required
            error={stageFormValidation.errors.pageKey}
          >
            <input
              type="text"
              aria-invalid={Boolean(stageFormValidation.errors.pageKey)}
              value={stageForm.pageKey}
              onChange={(e) => {
                setStageForm({ ...stageForm, pageKey: e.target.value })
                stageFormValidation.clearError('pageKey')
              }}
              placeholder="bid_submission_page"
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
          <FieldLabel
            label="Process Key (Identitas Proses)"
            required
            error={stageFormValidation.errors.processKey}
          >
            <input
              type="text"
              aria-invalid={Boolean(stageFormValidation.errors.processKey)}
              value={stageForm.processKey}
              onChange={(e) => {
                setStageForm({ ...stageForm, processKey: e.target.value })
                stageFormValidation.clearError('processKey')
              }}
              placeholder="bid_submission"
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
        </div>

        <FieldLabel label="Deskripsi Tahapan">
          <input
            type="text"
            value={stageForm.description ?? ''}
            onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
            placeholder="Keterangan aktivitas pada tahapan ini"
            className={fieldBase}
          />
        </FieldLabel>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-xs font-medium text-foreground">Wajib Unggah Berkas</span>
            <Switch
              checked={stageForm.requiresFile}
              onChange={(v) => setStageForm({ ...stageForm, requiresFile: v })}
              ariaLabel="Tahapan mewajibkan berkas"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-xs font-medium text-foreground">Tampil Publik</span>
            <Switch
              checked={stageForm.isPublic}
              onChange={(v) => setStageForm({ ...stageForm, isPublic: v })}
              ariaLabel="Tahapan tampil ke publik"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-xs font-medium text-foreground">Tahapan Aktif</span>
            <Switch
              checked={stageForm.isActive}
              onChange={(v) => setStageForm({ ...stageForm, isActive: v })}
              ariaLabel="Tahapan aktif"
            />
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deletingMethod)}
        onClose={() => setDeletingMethod(null)}
        title={`Hapus Metode "${deletingMethod?.name ?? ''}"?`}
        description="Metode pengadaan beserta tahapan di dalamnya akan dihapus."
        confirmLabel="Hapus Metode"
        onConfirm={handleDeleteMethod}
      />

      <ConfirmDialog
        open={Boolean(deletingStage)}
        onClose={() => setDeletingStage(null)}
        title={`Hapus Tahapan "${deletingStage?.name ?? ''}"?`}
        description="Urutan tahapan lain pada metode ini akan disesuaikan."
        confirmLabel="Hapus Tahapan"
        onConfirm={handleDeleteStage}
      />
    </div>
  )
}
