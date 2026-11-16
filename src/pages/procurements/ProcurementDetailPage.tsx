import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { z } from 'zod'
import { useFormValidation } from '~/lib/hooks/useFormValidation'
import {
  ArrowLeft,
  CalendarClock,
  CheckSquare,
  Download,
  Edit3,
  FileArchive,
  FileText,
  Layers,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '~/components/layouts/PageHeader'
import {
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
  Panel,
  RefreshButton,
  StatTile,
  StatusBadge,
  Switch,
  fieldBase,
  useToast,
} from '~/components/ui'
import {
  type ProcurementChecklistFileItem,
  type ProcurementChecklistFilePayload,
  type ProcurementDocumentItem,
  type ProcurementHpsItem,
  type ProcurementHpsPayload,
  type ProcurementScheduleItem,
  masterQueries,
  procurementApi,
  procurementQueries,
} from '~/integrations/api'
import { getApiErrorMessage } from '~/lib/utils/error'
import {
  formatCurrency,
  formatDate,
  formatFileSize,
  formatNumber,
  toInputDate,
  toInputDateTime,
} from '~/lib/utils/format'

const ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'jpg', 'jpeg', 'png']

export function ProcurementDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const procurementId = Number(id)
  const toast = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<
    'overview' | 'schedule' | 'hps' | 'documents' | 'checklist'
  >('overview')

  const detailQuery = useQuery(procurementQueries.detail(procurementId))
  const subFieldsQuery = useQuery(procurementQueries.jobSubFields(procurementId))
  const schedulesQuery = useQuery(procurementQueries.schedules(procurementId))
  const hpsQuery = useQuery(procurementQueries.hps(procurementId))
  const documentsQuery = useQuery(procurementQueries.documents(procurementId))
  const checklistQuery = useQuery(procurementQueries.checklistFiles(procurementId))

  const allSubFieldsQuery = useQuery(masterQueries.list('job-sub-field', { all: true }))
  const unitsQuery = useQuery(masterQueries.list('unit', { all: true }))

  const procurement = detailQuery.data?.result
  const assignedSubFields = subFieldsQuery.data?.result ?? []
  const allSubFields = allSubFieldsQuery.data?.result ?? []
  const schedules = useMemo(() => schedulesQuery.data?.result ?? [], [schedulesQuery.data?.result])
  const hpsResult = hpsQuery.data?.result
  const hpsItems = hpsResult?.items ?? []
  const hpsSummary = hpsResult?.summary
  const documents = documentsQuery.data?.result ?? []
  const checklistFiles = checklistQuery.data?.result ?? []
  const units = unitsQuery.data?.result ?? []

  const [selectedSubFieldIds, setSelectedSubFieldIds] = useState<number[]>([])
  const [syncingSubFields, setSyncingSubFields] = useState(false)

  useEffect(() => {
    setSelectedSubFieldIds(assignedSubFields.map((s) => s.id))
  }, [assignedSubFields])

  const handleSyncSubFields = async () => {
    setSyncingSubFields(true)
    try {
      await procurementApi.syncJobSubFields(procurementId, selectedSubFieldIds)
      toast.push({
        title: 'Sub-bidang pekerjaan disinkronkan',
        description: `${selectedSubFieldIds.length} sub-bidang terhubung ke paket ini.`,
        tone: 'success',
      })
      queryClient.invalidateQueries({
        queryKey: ['procurements', procurementId, 'job-sub-fields'],
      })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan sub-bidang',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSyncingSubFields(false)
    }
  }

  const handleDetachSubField = async (subFieldId: number) => {
    try {
      await procurementApi.detachJobSubField(procurementId, subFieldId)
      toast.push({ title: 'Sub-bidang dilepas dari paket', tone: 'info' })
      queryClient.invalidateQueries({
        queryKey: ['procurements', procurementId, 'job-sub-fields'],
      })
    } catch (err) {
      toast.push({
        title: 'Gagal melepas sub-bidang',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    }
  }

  const [editableSchedules, setEditableSchedules] = useState<ProcurementScheduleItem[]>([])
  const [isSchedulePreview, setIsSchedulePreview] = useState(false)
  const [savingSchedules, setSavingSchedules] = useState(false)
  const [genDialogOpen, setGenDialogOpen] = useState(false)
  const [genStartDate, setGenStartDate] = useState(toInputDate(new Date().toISOString()))
  const [genFromSequence, setGenFromSequence] = useState(1)
  const [genStartTime, setGenStartTime] = useState('08:00')
  const [genEndTime, setGenEndTime] = useState('16:00')
  const [genSaveDirectly, setGenSaveDirectly] = useState(true)
  const [generatingSchedule, setGeneratingSchedule] = useState(false)

  useEffect(() => {
    if (!isSchedulePreview) {
      setEditableSchedules(schedules)
    }
  }, [schedules, isSchedulePreview])

  const handleSaveSchedules = async () => {
    setSavingSchedules(true)
    try {
      const payload = editableSchedules.map((s) => ({
        id: s.id,
        sequence: s.sequence,
        startAt: s.startAt ? s.startAt.replace('T', ' ') : null,
        endAt: s.endAt ? s.endAt.replace('T', ' ') : null,
        isPublic: s.isPublic,
      }))
      await procurementApi.saveSchedules(procurementId, payload)
      setIsSchedulePreview(false)
      toast.push({
        title: 'Jadwal tahapan disimpan',
        description: 'Perubahan tanggal dan visibilitas tahapan berhasil diperbarui.',
        tone: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['procurements', procurementId, 'schedules'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan jadwal',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingSchedules(false)
    }
  }

  const genFormValidation = useFormValidation(
    z
      .object({
        startDate: z.string().trim().min(1, 'Tanggal mulai wajib diisi'),
        fromSequence: z.number().int('Urutan harus bilangan bulat').min(1, 'Urutan minimal 1'),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam mulai tidak valid'),
        endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam selesai tidak valid'),
      })
      .refine((data) => data.endTime > data.startTime, {
        path: ['endTime'],
        message: 'Jam selesai harus setelah jam mulai',
      }),
  )
  const hpsFormValidation = useFormValidation(
    z.object({
      name: z.string().trim().min(1, 'Uraian barang/jasa wajib diisi'),
      unitId: z.number().min(1, 'Satuan ukur wajib dipilih'),
      quantity: z.number().positive('Kuantitas harus lebih dari 0'),
      unitPrice: z.number().min(0, 'Harga satuan tidak boleh negatif'),
    }),
  )
  const docFormValidation = useFormValidation(
    z.object({
      name: z.string().trim().min(1, 'Nama dokumen wajib diisi'),
      fileSelected: z.boolean().refine((v) => v === true, 'Berkas dokumen wajib dipilih'),
    }),
  )
  const checklistFormValidation = useFormValidation(
    z.object({
      procurementScheduleId: z.number().min(1, 'Tahapan jadwal wajib dipilih'),
      name: z.string().trim().min(1, 'Nama berkas persyaratan wajib diisi'),
      maxSize: z.number().min(100, 'Ukuran maksimum minimal 100 KB'),
    }),
  )

  const handleGenerateSchedule = async () => {
    const parsed = genFormValidation.validate({
      startDate: genStartDate,
      fromSequence: genFromSequence,
      startTime: genStartTime,
      endTime: genEndTime,
    })
    if (!parsed.success) return
    setGeneratingSchedule(true)
    try {
      const res = await procurementApi.generateSchedule(procurementId, {
        startDate: parsed.data.startDate,
        fromSequence: parsed.data.fromSequence,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        save: genSaveDirectly,
      })
      const generatedSchedules = res.result?.schedules
      if (Array.isArray(generatedSchedules)) {
        setEditableSchedules(generatedSchedules)
        setIsSchedulePreview(!genSaveDirectly)
      }
      setGenDialogOpen(false)
      toast.push({
        title: genSaveDirectly ? 'Jadwal otomatis dibuat & disimpan' : 'Pratinjau jadwal diterapkan',
        description: genSaveDirectly
          ? 'Jadwal tahapan telah dihitung sesuai kalender kerja dan disimpan.'
          : 'Tinjau hasil di tabel lalu klik Simpan Jadwal untuk menyimpan.',
        tone: 'success',
      })
      if (genSaveDirectly) {
        queryClient.invalidateQueries({ queryKey: ['procurements', procurementId, 'schedules'] })
      }
    } catch (err) {
      toast.push({
        title: 'Gagal men-generate jadwal',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setGeneratingSchedule(false)
    }
  }

  const [hpsModalOpen, setHpsModalOpen] = useState(false)
  const [editingHps, setEditingHps] = useState<ProcurementHpsItem | null>(null)
  const [hpsForm, setHpsForm] = useState<ProcurementHpsPayload>({
    name: '',
    unitId: 0,
    quantity: 1,
    unitPrice: 0,
    useTax: true,
  })
  const [savingHps, setSavingHps] = useState(false)
  const [deletingHps, setDeletingHps] = useState<ProcurementHpsItem | null>(null)

  const openCreateHps = () => {
    setEditingHps(null)
    setHpsForm({
      name: '',
      unitId: units[0]?.id ?? 0,
      quantity: 1,
      unitPrice: 0,
      useTax: true,
    })
    setHpsModalOpen(true)
  }

  const openEditHps = (item: ProcurementHpsItem) => {
    setEditingHps(item)
    setHpsForm({
      name: item.name,
      unitId: item.unitId,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      useTax: item.useTax ?? true,
    })
    setHpsModalOpen(true)
  }

  const handleSaveHps = async () => {
    const parsed = hpsFormValidation.validate({
      name: hpsForm.name,
      unitId: hpsForm.unitId,
      quantity: hpsForm.quantity,
      unitPrice: hpsForm.unitPrice,
    })
    if (!parsed.success) return
    setSavingHps(true)
    try {
      if (editingHps) {
        await procurementApi.updateHps(procurementId, editingHps.id, hpsForm)
        toast.push({ title: 'Item HPS diperbarui', tone: 'success' })
      } else {
        await procurementApi.createHps(procurementId, hpsForm)
        toast.push({ title: 'Item HPS ditambahkan', tone: 'success' })
      }
      setHpsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['procurements', procurementId, 'hps'] })
      queryClient.invalidateQueries({ queryKey: ['procurements', 'detail', procurementId] })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan item HPS',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingHps(false)
    }
  }

  const handleDeleteHps = async () => {
    if (!deletingHps) return
    try {
      await procurementApi.removeHps(procurementId, deletingHps.id)
      toast.push({ title: 'Item HPS dihapus', tone: 'info' })
      setDeletingHps(null)
      queryClient.invalidateQueries({ queryKey: ['procurements', procurementId, 'hps'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menghapus item HPS',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    }
  }

  const [docModalOpen, setDocModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<ProcurementDocumentItem | null>(null)
  const [docName, setDocName] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docPublic, setDocPublic] = useState(true)
  const [savingDoc, setSavingDoc] = useState(false)
  const [deletingDoc, setDeletingDoc] = useState<ProcurementDocumentItem | null>(null)

  const openCreateDoc = () => {
    docFormValidation.clearErrors()
    setEditingDoc(null)
    setDocName('')
    setDocFile(null)
    setDocPublic(true)
    setDocModalOpen(true)
  }

  const openEditDoc = (doc: ProcurementDocumentItem) => {
    docFormValidation.clearErrors()
    setEditingDoc(doc)
    setDocName(doc.name)
    setDocFile(null)
    setDocPublic(doc.isPublic ?? true)
    setDocModalOpen(true)
  }

  const handleSaveDoc = async () => {
    const parsed = docFormValidation.validate({
      name: docName,
      fileSelected: Boolean(editingDoc || docFile),
    })
    if (!parsed.success) return
    setSavingDoc(true)
    try {
      if (editingDoc) {
        await procurementApi.updateDocument(procurementId, editingDoc.id, {
          name: docName.trim(),
          file: docFile,
          isPublic: docPublic,
        })
        toast.push({ title: 'Dokumen pengadaan diperbarui', tone: 'success' })
      } else {
        await procurementApi.createDocument(procurementId, {
          name: docName.trim(),
          file: docFile,
          isPublic: docPublic,
        })
        toast.push({ title: 'Dokumen pengadaan diunggah', tone: 'success' })
      }
      setDocModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['procurements', procurementId, 'documents'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan dokumen',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingDoc(false)
    }
  }

  const handleDeleteDoc = async () => {
    if (!deletingDoc) return
    try {
      await procurementApi.removeDocument(procurementId, deletingDoc.id)
      toast.push({ title: 'Dokumen dihapus', tone: 'info' })
      setDeletingDoc(null)
      queryClient.invalidateQueries({ queryKey: ['procurements', procurementId, 'documents'] })
    } catch (err) {
      toast.push({
        title: 'Gagal menghapus dokumen',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    }
  }

  const fileBearingSchedules = useMemo(
    () => schedules.filter((s) => s.requiresFile),
    [schedules],
  )
  const [checklistModalOpen, setChecklistModalOpen] = useState(false)
  const [editingChecklist, setEditingChecklist] = useState<ProcurementChecklistFileItem | null>(
    null,
  )
  const [checklistForm, setChecklistForm] = useState<ProcurementChecklistFilePayload>({
    procurementScheduleId: 0,
    name: '',
    maxSize: 5120,
    fileTypes: ['pdf'],
    isRequired: true,
    description: '',
  })
  const [savingChecklist, setSavingChecklist] = useState(false)
  const [deletingChecklist, setDeletingChecklist] =
    useState<ProcurementChecklistFileItem | null>(null)

  const openCreateChecklist = () => {
    checklistFormValidation.clearErrors()
    setEditingChecklist(null)
    const defaultSchedule = fileBearingSchedules[0] ?? schedules[0]
    setChecklistForm({
      procurementScheduleId: defaultSchedule?.id ?? 0,
      name: '',
      maxSize: 5120,
      fileTypes: ['pdf'],
      isRequired: true,
      description: '',
    })
    setChecklistModalOpen(true)
  }

  const openEditChecklist = (item: ProcurementChecklistFileItem) => {
    checklistFormValidation.clearErrors()
    setEditingChecklist(item)
    setChecklistForm({
      procurementScheduleId: item.procurementScheduleId,
      name: item.name,
      maxSize: Number(item.maxSize) || 5120,
      fileTypes: Array.isArray(item.fileTypes) ? item.fileTypes : ['pdf'],
      isRequired: item.isRequired ?? true,
      description: item.description || '',
    })
    setChecklistModalOpen(true)
  }

  const handleSaveChecklist = async () => {
    const parsed = checklistFormValidation.validate({
      procurementScheduleId: checklistForm.procurementScheduleId,
      name: checklistForm.name,
      maxSize: checklistForm.maxSize,
    })
    if (!parsed.success) return
    setSavingChecklist(true)
    try {
      if (editingChecklist) {
        await procurementApi.updateChecklistFile(
          procurementId,
          editingChecklist.id,
          checklistForm,
        )
        toast.push({ title: 'Checklist dokumen diperbarui', tone: 'success' })
      } else {
        await procurementApi.createChecklistFile(procurementId, checklistForm)
        toast.push({ title: 'Checklist dokumen ditambahkan', tone: 'success' })
      }
      setChecklistModalOpen(false)
      queryClient.invalidateQueries({
        queryKey: ['procurements', procurementId, 'checklist-files'],
      })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan checklist dokumen',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingChecklist(false)
    }
  }

  const handleDeleteChecklist = async () => {
    if (!deletingChecklist) return
    try {
      await procurementApi.removeChecklistFile(procurementId, deletingChecklist.id)
      toast.push({ title: 'Checklist dokumen dihapus', tone: 'info' })
      setDeletingChecklist(null)
      queryClient.invalidateQueries({
        queryKey: ['procurements', procurementId, 'checklist-files'],
      })
    } catch (err) {
      toast.push({
        title: 'Gagal menghapus checklist dokumen',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    }
  }

  const refreshWorkspace = () => {
    setIsSchedulePreview(false)
    detailQuery.refetch()
    subFieldsQuery.refetch()
    schedulesQuery.refetch()
    hpsQuery.refetch()
    documentsQuery.refetch()
    checklistQuery.refetch()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/procurements"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Daftar Paket Pengadaan
        </Link>
        <RefreshButton
          size="xs"
          label="Segarkan Ruang Kerja"
          loading={
            detailQuery.isFetching ||
            subFieldsQuery.isFetching ||
            schedulesQuery.isFetching ||
            hpsQuery.isFetching ||
            documentsQuery.isFetching ||
            checklistQuery.isFetching
          }
          onClick={refreshWorkspace}
        />
      </div>

      <PageHeader
        title={procurement ? procurement.name : `Paket Pengadaan #${procurementId}`}
        badge={
          procurement ? (
            <div className="flex items-center gap-1.5">
              <Badge tone="dark" className="font-mono">
                {procurement.jobNumber}
              </Badge>
              <StatusBadge status={procurement.status || 'draft'} />
            </div>
          ) : null
        }
        description={
          procurement
            ? `${procurement.projectLocation} · Pelaksanaan ${procurement.executionTime} · Tahun Anggaran ${procurement.budgetYear}`
            : 'Memuat rincian ruang kerja paket pengadaan...'
        }
        actions={
          <FilterGroup
            value={activeTab}
            onChange={(v) => setActiveTab(v as typeof activeTab)}
            items={[
              { value: 'overview', label: 'Ringkasan & Sub-Bidang', count: assignedSubFields.length },
              { value: 'schedule', label: 'Jadwal Tahapan', count: schedules.length },
              { value: 'hps', label: 'Rincian HPS', count: hpsItems.length },
              { value: 'documents', label: 'Dokumen', count: documents.length },
              { value: 'checklist', label: 'Checklist Berkas', count: checklistFiles.length },
            ]}
          />
        }
      />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Frame className="lg:col-span-2">
            <FrameHeader
              icon={FileText}
              title="Informasi Umum Paket Pengadaan"
            />
            <Panel className="p-4">
              <DataState
                loading={detailQuery.isLoading}
                fetching={detailQuery.isFetching}
                error={detailQuery.isError ? getApiErrorMessage(detailQuery.error) : null}
                empty={!procurement}
                onRetry={() => detailQuery.refetch()}
              >
                {procurement && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="text-[11px] text-muted-foreground">Nilai Pagu Anggaran</div>
                        <div className="mt-1 font-mono text-sm font-semibold text-foreground tabular-nums">
                          {formatCurrency(procurement.budgetCeiling ?? procurement.budgetValue)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="text-[11px] text-muted-foreground">Total HPS (Grand Total)</div>
                        <div className="mt-1 font-mono text-sm font-semibold text-foreground tabular-nums">
                          {formatCurrency(hpsSummary?.grandTotal ?? procurement.hpsValue ?? 0)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="text-[11px] text-muted-foreground">Visibilitas HPS</div>
                        <div className="mt-1 font-medium text-foreground">
                          {procurement.showHps ? 'Ditampilkan ke Publik' : 'Internal Panitia'}
                        </div>
                      </div>
                    </div>

                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-border pt-3">
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Nomor Pekerjaan</dt>
                        <dd className="font-mono font-medium text-foreground">
                          {procurement.jobNumber}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Tahun Anggaran</dt>
                        <dd className="font-mono font-medium text-foreground">
                          {procurement.budgetYear}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Metode Pengadaan</dt>
                        <dd className="font-medium text-foreground">
                          {procurement.procurementMethod?.name ??
                            `ID #${procurement.procurementMethodId}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Jenis Pekerjaan</dt>
                        <dd className="font-medium text-foreground">
                          {procurement.jobType?.name ?? `ID #${procurement.jobTypeId}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Kualifikasi Usaha</dt>
                        <dd className="font-medium text-foreground">
                          {procurement.qualification?.name ?? `ID #${procurement.qualificationId}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Sumber Dana</dt>
                        <dd className="font-medium text-foreground">
                          {procurement.fundingSource?.name ?? `ID #${procurement.fundingSourceId}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Lokasi Pekerjaan</dt>
                        <dd className="font-medium text-foreground">
                          {procurement.projectLocation}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Lokasi Pengumuman</dt>
                        <dd className="font-medium text-foreground">
                          {procurement.announcementLocation}
                        </dd>
                      </div>
                    </dl>

                    {procurement.workDescription && (
                      <div className="border-t border-border pt-3">
                        <div className="text-[11px] text-muted-foreground">Uraian Pekerjaan</div>
                        <p className="mt-1 whitespace-pre-line text-foreground">
                          {procurement.workDescription}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </DataState>
            </Panel>
          </Frame>

          <Frame>
            <FrameHeader
              icon={Layers}
              title="Sub-Bidang Pekerjaan"
              count={assignedSubFields.length}
              right={
                <Button
                  variant="primary"
                  size="xs"
                  loading={syncingSubFields}
                  onClick={handleSyncSubFields}
                >
                  <Save className="size-3" />
                  Sinkronkan
                </Button>
              }
            />
            <Panel className="p-3 space-y-3">
              <div className="text-[11px] text-muted-foreground">
                Pilih sub-bidang pekerjaan yang disyaratkan pada paket ini lalu klik{' '}
                <strong className="text-foreground">Sinkronkan</strong>.
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-lg border border-border">
                {allSubFields.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Belum ada master sub-bidang pekerjaan.
                  </div>
                ) : (
                  allSubFields.map((sf) => {
                    const checked = selectedSubFieldIds.includes(sf.id)
                    const isAssigned = assignedSubFields.some((a) => a.id === sf.id)
                    return (
                      <div
                        key={sf.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs hover:bg-accent/50"
                      >
                        <label
                          className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                          onClick={() =>
                            setSelectedSubFieldIds((prev) =>
                              checked ? prev.filter((x) => x !== sf.id) : [...prev, sf.id],
                            )
                          }
                        >
                          <Checkbox checked={checked} />
                          <span className="truncate font-medium text-foreground">{sf.name}</span>
                        </label>
                        {isAssigned && (
                          <button
                            type="button"
                            onClick={() => handleDetachSubField(sf.id)}
                            title="Lepas sub-bidang"
                            className="text-rose-600 hover:underline text-[11px] cursor-pointer"
                          >
                            Lepas
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </Panel>
          </Frame>
        </div>
      )}

      {activeTab === 'schedule' && (
        <Frame>
          <FrameHeader
            icon={CalendarClock}
            title="Jadwal Tahapan Pengadaan"
            count={editableSchedules.length}
            right={
              <>
                <Button variant="outline" size="xs" onClick={() => setGenDialogOpen(true)}>
                  <Sparkles className="size-3.5" />
                  Generate Jadwal Otomatis
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  loading={savingSchedules}
                  onClick={handleSaveSchedules}
                >
                  <Save className="size-3.5" />
                  Simpan Jadwal
                </Button>
              </>
            }
          />
          <Panel className="overflow-hidden">
            {isSchedulePreview && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
                <span>
                  Pratinjau jadwal diterapkan dan belum tersimpan. Periksa tanggal lalu klik{' '}
                  <strong>Simpan Jadwal</strong>.
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setEditableSchedules(schedules)
                    setIsSchedulePreview(false)
                  }}
                >
                  Batalkan Pratinjau
                </Button>
              </div>
            )}
            <DataState
              loading={schedulesQuery.isLoading}
              fetching={schedulesQuery.isFetching}
              error={schedulesQuery.isError ? getApiErrorMessage(schedulesQuery.error) : null}
              empty={editableSchedules.length === 0}
              emptyTitle="Belum ada tahapan jadwal"
              emptyDescription="Gunakan tombol Generate Jadwal Otomatis untuk membuat jadwal dari metode pengadaan."
              emptyAction={
                <Button variant="primary" size="sm" onClick={() => setGenDialogOpen(true)}>
                  <Sparkles className="size-3.5" />
                  Generate Jadwal Sekarang
                </Button>
              }
              onRetry={() => schedulesQuery.refetch()}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                      <th className="px-3 py-2 font-medium w-14">Urutan</th>
                      <th className="px-3 py-2 font-medium">Nama Tahapan</th>
                      <th className="px-3 py-2 font-medium">Durasi & Tipe Hari</th>
                      <th className="px-3 py-2 font-medium">Waktu Mulai (start_at)</th>
                      <th className="px-3 py-2 font-medium">Waktu Selesai (end_at)</th>
                      <th className="px-3 py-2 font-medium">Publik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {editableSchedules.map((stage, idx) => (
                      <tr key={stage.id || stage.sequence} className="row-hover">
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                          #{stage.sequence}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-foreground">{stage.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {stage.requiresFile && (
                              <Badge tone="sky" size="xs">
                                Wajib Berkas
                              </Badge>
                            )}
                            {stage.processKey && (
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {stage.processKey}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono">{stage.durationDays ?? 1} hari</span> ·{' '}
                          <Badge
                            tone={stage.dayType === 'working_day' ? 'amber' : 'neutral'}
                            size="xs"
                          >
                            {stage.dayType === 'working_day' ? 'Hari Kerja' : 'Kalender'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="datetime-local"
                            value={toInputDateTime(stage.startAt)}
                            onChange={(e) => {
                              const next = [...editableSchedules]
                              next[idx] = { ...stage, startAt: e.target.value }
                              setEditableSchedules(next)
                            }}
                            className="h-7 rounded-md border border-border bg-white px-2 font-mono text-[11px] text-foreground focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="datetime-local"
                            value={toInputDateTime(stage.endAt)}
                            onChange={(e) => {
                              const next = [...editableSchedules]
                              next[idx] = { ...stage, endAt: e.target.value }
                              setEditableSchedules(next)
                            }}
                            className="h-7 rounded-md border border-border bg-white px-2 font-mono text-[11px] text-foreground focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <Switch
                            checked={stage.isPublic}
                            onChange={(v) => {
                              const next = [...editableSchedules]
                              next[idx] = { ...stage, isPublic: v }
                              setEditableSchedules(next)
                            }}
                            ariaLabel={`Tampilkan tahapan ${stage.name} ke publik`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataState>
          </Panel>
        </Frame>
      )}

      {activeTab === 'hps' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              icon={Wallet}
              tone="neutral"
              label="Total Item HPS"
              value={hpsSummary?.totalItems ?? hpsItems.length}
              sub="Jumlah komponen harga satuan"
            />
            <StatTile
              icon={Wallet}
              tone="sky"
              label="Subtotal Sebelum Pajak"
              value={formatCurrency(hpsSummary?.totalBeforeTax ?? 0)}
              sub="Total kuantitas × harga satuan"
            />
            <StatTile
              icon={Wallet}
              tone="amber"
              label="Total PPN (Pajak)"
              value={formatCurrency(hpsSummary?.totalTax ?? 0)}
              sub="Akumulasi pajak item kena PPN"
            />
            <StatTile
              icon={Wallet}
              tone="emerald"
              label="Grand Total HPS"
              value={formatCurrency(hpsSummary?.grandTotal ?? 0)}
              sub={`Pagu: ${formatCurrency(procurement?.budgetCeiling ?? procurement?.budgetValue ?? 0)}`}
            />
          </div>

          <Frame>
            <FrameHeader
              icon={Wallet}
              title="Rincian Harga Perkiraan Sendiri (HPS)"
              count={hpsItems.length}
              right={
                <Button variant="primary" size="xs" onClick={openCreateHps}>
                  <Plus className="size-3.5" />
                  Tambah Item HPS
                </Button>
              }
            />
            <Panel className="overflow-hidden">
              <DataState
                loading={hpsQuery.isLoading}
                fetching={hpsQuery.isFetching}
                error={hpsQuery.isError ? getApiErrorMessage(hpsQuery.error) : null}
                empty={hpsItems.length === 0}
                emptyTitle="Belum ada rincian item HPS"
                emptyDescription="Tambahkan item barang/jasa beserta kuantitas dan harga satuan untuk menghitung nilai HPS paket ini."
                emptyAction={
                  <Button variant="primary" size="sm" onClick={openCreateHps}>
                    <Plus className="size-3.5" />
                    Tambah Item HPS Pertama
                  </Button>
                }
                onRetry={() => hpsQuery.refetch()}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Uraian Barang / Jasa</th>
                        <th className="px-3 py-2 font-medium">Satuan</th>
                        <th className="px-3 py-2 font-medium text-right">Kuantitas</th>
                        <th className="px-3 py-2 font-medium text-right">Harga Satuan</th>
                        <th className="px-3 py-2 font-medium">Pajak</th>
                        <th className="px-3 py-2 font-medium text-right">Total Harga</th>
                        <th className="px-3 py-2 font-medium text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {hpsItems.map((item) => {
                        const calcSubtotal =
                          Number(item.subtotalBeforeTax) ||
                          Number(item.quantity) * Number(item.unitPrice)
                        const calcTotal = Number(item.totalPrice) || calcSubtotal
                        return (
                          <tr key={item.id} className="row-hover">
                            <td className="px-3 py-2.5 font-medium text-foreground">{item.name}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {item.unit?.name ||
                                units.find((u) => u.id === item.unitId)?.name ||
                                `Unit #${item.unitId}`}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                              {formatNumber(item.quantity)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-3 py-2.5">
                              {item.useTax ? (
                                <Badge tone="emerald" size="xs">
                                  Termasuk Pajak
                                </Badge>
                              ) : (
                                <Badge tone="neutral" size="xs">
                                  Tanpa Pajak
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono tabular-nums font-medium text-foreground">
                              {formatCurrency(calcTotal)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="iconSm"
                                  onClick={() => openEditHps(item)}
                                  aria-label="Ubah item HPS"
                                >
                                  <Edit3 className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="iconSm"
                                  onClick={() => setDeletingHps(item)}
                                  aria-label="Hapus item HPS"
                                >
                                  <Trash2 className="size-3.5 text-rose-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </DataState>
            </Panel>
          </Frame>
        </div>
      )}

      {activeTab === 'documents' && (
        <Frame>
          <FrameHeader
            icon={FileArchive}
            title="Dokumen Pengadaan"
            count={documents.length}
            right={
              <>
                {documents.length > 0 && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      procurementApi.downloadAllDocuments(procurementId, procurement?.jobNumber)
                    }
                  >
                    <Download className="size-3.5" />
                    Unduh Semua (ZIP)
                  </Button>
                )}
                <Button variant="primary" size="xs" onClick={openCreateDoc}>
                  <Upload className="size-3.5" />
                  Unggah Dokumen
                </Button>
              </>
            }
          />
          <Panel className="overflow-hidden">
            <DataState
              loading={documentsQuery.isLoading}
              fetching={documentsQuery.isFetching}
              error={documentsQuery.isError ? getApiErrorMessage(documentsQuery.error) : null}
              empty={documents.length === 0}
              emptyTitle="Belum ada dokumen pengadaan"
              emptyDescription="Unggah dokumen pemilihan, KAK, atau rancangan kontrak untuk paket pengadaan ini."
              emptyAction={
                <Button variant="primary" size="sm" onClick={openCreateDoc}>
                  <Upload className="size-3.5" />
                  Unggah Dokumen Pertama
                </Button>
              }
              onRetry={() => documentsQuery.refetch()}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Nama Dokumen</th>
                      <th className="px-3 py-2 font-medium">Berkas & Ukuran</th>
                      <th className="px-3 py-2 font-medium">Akses Publik</th>
                      <th className="px-3 py-2 font-medium">Diunggah</th>
                      <th className="px-3 py-2 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="row-hover">
                        <td className="px-3 py-2.5 font-medium text-foreground">{doc.name}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                          {doc.fileName || doc.filePath || 'Berkas terlampir'}{' '}
                          {doc.fileSize ? `(${formatFileSize(doc.fileSize)})` : ''}
                        </td>
                        <td className="px-3 py-2.5">
                          {doc.isPublic ? (
                            <Badge tone="emerald" size="xs">
                              Publik
                            </Badge>
                          ) : (
                            <Badge tone="amber" size="xs">
                              Internal
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {formatDate(doc.createdAt, true)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() =>
                                procurementApi.downloadDocument(
                                  procurementId,
                                  doc.id,
                                  doc.fileName || `${doc.name}.pdf`,
                                )
                              }
                            >
                              <Download className="size-3" />
                              Unduh
                            </Button>
                            <Button
                              variant="ghost"
                              size="iconSm"
                              onClick={() => openEditDoc(doc)}
                              aria-label="Ubah dokumen"
                            >
                              <Edit3 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="iconSm"
                              onClick={() => setDeletingDoc(doc)}
                              aria-label="Hapus dokumen"
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
      )}

      {activeTab === 'checklist' && (
        <Frame>
          <FrameHeader
            icon={CheckSquare}
            title="Checklist Persyaratan Berkas Tahapan"
            count={checklistFiles.length}
            right={
              <Button variant="primary" size="xs" onClick={openCreateChecklist}>
                <Plus className="size-3.5" />
                Tambah Persyaratan Berkas
              </Button>
            }
          />
          <Panel className="overflow-hidden">
            <DataState
              loading={checklistQuery.isLoading}
              fetching={checklistQuery.isFetching}
              error={checklistQuery.isError ? getApiErrorMessage(checklistQuery.error) : null}
              empty={checklistFiles.length === 0}
              emptyTitle="Belum ada checklist persyaratan berkas"
              emptyDescription="Tambahkan ketentuan format file, batas ukuran (KB), dan sifat wajib/opsional untuk tahapan jadwal yang membutuhkan unggahan berkas."
              emptyAction={
                <Button variant="primary" size="sm" onClick={openCreateChecklist}>
                  <Plus className="size-3.5" />
                  Buat Checklist Berkas
                </Button>
              }
              onRetry={() => checklistQuery.refetch()}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Nama Persyaratan Berkas</th>
                      <th className="px-3 py-2 font-medium">Tahapan Jadwal</th>
                      <th className="px-3 py-2 font-medium">Format Diizinkan</th>
                      <th className="px-3 py-2 font-medium text-right">Batas Ukuran</th>
                      <th className="px-3 py-2 font-medium">Sifat</th>
                      <th className="px-3 py-2 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {checklistFiles.map((cf) => {
                      const stage =
                        cf.procurementSchedule ||
                        schedules.find((s) => s.id === cf.procurementScheduleId)
                      return (
                        <tr key={cf.id} className="row-hover">
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-foreground">{cf.name}</div>
                            {cf.description && (
                              <div className="text-[11px] text-muted-foreground">
                                {cf.description}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-foreground">
                            {stage ? `#${stage.sequence} ${stage.name}` : `Tahapan #${cf.procurementScheduleId}`}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {(cf.fileTypes ?? []).map((ext) => (
                                <Badge key={ext} tone="neutral" size="xs" className="font-mono uppercase">
                                  .{ext}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                            {formatNumber(cf.maxSize)} KB
                          </td>
                          <td className="px-3 py-2.5">
                            {cf.isRequired ? (
                              <Badge tone="rose" size="xs">
                                Wajib
                              </Badge>
                            ) : (
                              <Badge tone="neutral" size="xs">
                                Opsional
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => openEditChecklist(cf)}
                                aria-label="Ubah checklist"
                              >
                                <Edit3 className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => setDeletingChecklist(cf)}
                                aria-label="Hapus checklist"
                              >
                                <Trash2 className="size-3.5 text-rose-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </DataState>
          </Panel>
        </Frame>
      )}

      <FormDialog
        open={genDialogOpen}
        onClose={() => {
          setGenDialogOpen(false)
          genFormValidation.clearErrors()
        }}
        title="Generate Jadwal Tahapan Otomatis"
        submitLabel={genSaveDirectly ? 'Generate & Simpan' : 'Hitung Pratinjau'}
        loading={generatingSchedule}
        onSubmit={handleGenerateSchedule}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldLabel label="Tanggal Mulai" required error={genFormValidation.errors.startDate}>
            <input
              type="date"
              aria-invalid={Boolean(genFormValidation.errors.startDate)}
              value={genStartDate}
              onChange={(e) => {
                setGenStartDate(e.target.value)
                genFormValidation.clearError('startDate')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
          <FieldLabel
            label="Mulai dari Urutan (Sequence)"
            error={genFormValidation.errors.fromSequence}
          >
            <input
              type="number"
              min={1}
              max={editableSchedules.length || undefined}
              aria-invalid={Boolean(genFormValidation.errors.fromSequence)}
              value={genFromSequence || ''}
              onChange={(e) => {
                setGenFromSequence(Number(e.target.value) || 0)
                genFormValidation.clearError('fromSequence')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
          <FieldLabel label="Jam Mulai Harian" error={genFormValidation.errors.startTime}>
            <input
              type="time"
              aria-invalid={Boolean(genFormValidation.errors.startTime)}
              value={genStartTime}
              onChange={(e) => {
                setGenStartTime(e.target.value)
                genFormValidation.clearError('startTime')
                genFormValidation.clearError('endTime')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
          <FieldLabel label="Jam Selesai Harian" error={genFormValidation.errors.endTime}>
            <input
              type="time"
              aria-invalid={Boolean(genFormValidation.errors.endTime)}
              value={genEndTime}
              onChange={(e) => {
                setGenEndTime(e.target.value)
                genFormValidation.clearError('endTime')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <div>
            <div className="text-xs font-medium text-foreground">Langsung Simpan ke Database</div>
            <div className="text-[11px] text-muted-foreground">
              Jika dinonaktifkan, hasil kalkulasi hanya ditampilkan sebagai pratinjau.
            </div>
          </div>
          <Switch
            checked={genSaveDirectly}
            onChange={setGenSaveDirectly}
            ariaLabel="Langsung simpan hasil generate jadwal"
          />
        </div>
      </FormDialog>

      <FormDialog
        open={hpsModalOpen}
        onClose={() => setHpsModalOpen(false)}
        title={editingHps ? 'Ubah Item HPS' : 'Tambah Item HPS'}
        loading={savingHps}
        onSubmit={handleSaveHps}
      >
        <FieldLabel label="Uraian Barang / Jasa" required error={hpsFormValidation.errors.name}>
          <input
            type="text"
            aria-invalid={Boolean(hpsFormValidation.errors.name)}
            value={hpsForm.name}
            onChange={(e) => {
              setHpsForm({ ...hpsForm, name: e.target.value })
              hpsFormValidation.clearError('name')
            }}
            placeholder="Lisensi Perangkat Lunak Keamanan Jaringan"
            className={fieldBase}
          />
        </FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FieldLabel label="Satuan Ukur" required error={hpsFormValidation.errors.unitId}>
            <FieldSelect
              error={hpsFormValidation.errors.unitId}
              value={hpsForm.unitId || ''}
              onChange={(v) => {
                setHpsForm({ ...hpsForm, unitId: Number(v) })
                hpsFormValidation.clearError('unitId')
              }}
              placeholder="Pilih Satuan"
              options={units.map((u) => ({ value: u.id, label: u.name }))}
            />
          </FieldLabel>
          <FieldLabel label="Kuantitas" required error={hpsFormValidation.errors.quantity}>
            <input
              type="number"
              min={0.01}
              step="any"
              aria-invalid={Boolean(hpsFormValidation.errors.quantity)}
              value={hpsForm.quantity}
              onChange={(e) => {
                setHpsForm({ ...hpsForm, quantity: Number(e.target.value) })
                hpsFormValidation.clearError('quantity')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
          <FieldLabel label="Harga Satuan (IDR)" required error={hpsFormValidation.errors.unitPrice}>
            <input
              type="number"
              min={0}
              step="any"
              aria-invalid={Boolean(hpsFormValidation.errors.unitPrice)}
              value={hpsForm.unitPrice}
              onChange={(e) => {
                setHpsForm({ ...hpsForm, unitPrice: Number(e.target.value) })
                hpsFormValidation.clearError('unitPrice')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <div>
            <div className="text-xs font-medium text-foreground">Kenakan Pajak (PPN)</div>
            <div className="text-[11px] text-muted-foreground">
              Aktifkan apabila item ini dikenakan perhitungan pajak otomatis.
            </div>
          </div>
          <Switch
            checked={hpsForm.useTax}
            onChange={(v) => setHpsForm({ ...hpsForm, useTax: v })}
            ariaLabel="Gunakan pajak pada item HPS"
          />
        </div>
      </FormDialog>

      <FormDialog
        open={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title={editingDoc ? 'Perbarui Dokumen Pengadaan' : 'Unggah Dokumen Pengadaan'}
        loading={savingDoc}
        onSubmit={handleSaveDoc}
      >
        <FieldLabel label="Nama Dokumen" required error={docFormValidation.errors.name}>
          <input
            type="text"
            aria-invalid={Boolean(docFormValidation.errors.name)}
            value={docName}
            onChange={(e) => {
              setDocName(e.target.value)
              docFormValidation.clearError('name')
            }}
            placeholder="Dokumen Pemilihan & Kerangka Acuan Kerja"
            className={fieldBase}
          />
        </FieldLabel>
        <FieldLabel
          label="Berkas Dokumen"
          required={!editingDoc}
          error={docFormValidation.errors.fileSelected}
          hint={editingDoc ? 'Kosongkan jika tidak mengganti berkas' : 'PDF, DOCX, XLSX, ZIP'}
        >
          <input
            type="file"
            aria-invalid={Boolean(docFormValidation.errors.fileSelected)}
            onChange={(e) => {
              setDocFile(e.target.files?.[0] ?? null)
              docFormValidation.clearError('fileSelected')
            }}
            className="block w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-foreground aria-invalid:border-rose-500 file:mr-2 file:rounded-md file:border-0 file:bg-neutral-900 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-white"
          />
        </FieldLabel>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <div>
            <div className="text-xs font-medium text-foreground">Dokumen Publik</div>
            <div className="text-[11px] text-muted-foreground">
              Izinkan dokumen diunduh melalui endpoint publik pengadaan.
            </div>
          </div>
          <Switch
            checked={docPublic}
            onChange={setDocPublic}
            ariaLabel="Publikasikan dokumen pengadaan"
          />
        </div>
      </FormDialog>

      <FormDialog
        open={checklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        title={editingChecklist ? 'Ubah Checklist Berkas' : 'Tambah Checklist Berkas'}
        loading={savingChecklist}
        onSubmit={handleSaveChecklist}
      >
        <FieldLabel
          label="Tahapan Jadwal (Wajib Berkas)"
          required
          error={checklistFormValidation.errors.procurementScheduleId}
        >
          <FieldSelect
            error={checklistFormValidation.errors.procurementScheduleId}
            value={checklistForm.procurementScheduleId || ''}
            onChange={(v) => {
              setChecklistForm({ ...checklistForm, procurementScheduleId: Number(v) })
              checklistFormValidation.clearError('procurementScheduleId')
            }}
            placeholder="Pilih Tahapan Jadwal"
            options={(fileBearingSchedules.length > 0 ? fileBearingSchedules : schedules).map(
              (s) => ({
                value: s.id,
                label: `#${s.sequence} ${s.name}${s.requiresFile ? ' (Wajib Berkas)' : ''}`,
              }),
            )}
          />
        </FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldLabel
            label="Nama Berkas Persyaratan"
            required
            error={checklistFormValidation.errors.name}
          >
            <input
              type="text"
              aria-invalid={Boolean(checklistFormValidation.errors.name)}
              value={checklistForm.name}
              onChange={(e) => {
                setChecklistForm({ ...checklistForm, name: e.target.value })
                checklistFormValidation.clearError('name')
              }}
              placeholder="Surat Penawaran & Rincian Biaya"
              className={fieldBase}
            />
          </FieldLabel>
          <FieldLabel
            label="Ukuran Maksimum (KB)"
            required
            hint="5120 KB = 5 MB"
            error={checklistFormValidation.errors.maxSize}
          >
            <input
              type="number"
              min={100}
              aria-invalid={Boolean(checklistFormValidation.errors.maxSize)}
              value={checklistForm.maxSize}
              onChange={(e) => {
                setChecklistForm({ ...checklistForm, maxSize: Number(e.target.value) })
                checklistFormValidation.clearError('maxSize')
              }}
              className={`${fieldBase} font-mono`}
            />
          </FieldLabel>
        </div>

        <FieldLabel label="Ekstensi Berkas yang Diizinkan" required>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ALLOWED_FILE_TYPES.map((ext) => {
              const active = checklistForm.fileTypes.includes(ext)
              return (
                <button
                  key={ext}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? checklistForm.fileTypes.filter((x) => x !== ext)
                      : [...checklistForm.fileTypes, ext]
                    if (next.length > 0) {
                      setChecklistForm({ ...checklistForm, fileTypes: next })
                    }
                  }}
                  className={`rounded-md border px-2 py-1 font-mono text-[11px] uppercase transition cursor-pointer ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-border bg-white text-muted-foreground hover:text-foreground'
                  }`}
                >
                  .{ext}
                </button>
              )
            })}
          </div>
        </FieldLabel>

        <FieldLabel label="Keterangan Tambahan">
          <input
            type="text"
            value={checklistForm.description ?? ''}
            onChange={(e) => setChecklistForm({ ...checklistForm, description: e.target.value })}
            placeholder="Ditandatangani di atas meterai oleh direktur utama"
            className={fieldBase}
          />
        </FieldLabel>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <div>
            <div className="text-xs font-medium text-foreground">Dokumen Wajib (Mandatory)</div>
            <div className="text-[11px] text-muted-foreground">
              Peserta wajib mengunggah berkas ini untuk dapat melanjutkan tahapan.
            </div>
          </div>
          <Switch
            checked={checklistForm.isRequired}
            onChange={(v) => setChecklistForm({ ...checklistForm, isRequired: v })}
            ariaLabel="Berkas wajib diunggah"
          />
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deletingHps)}
        onClose={() => setDeletingHps(null)}
        title={`Hapus Item HPS "${deletingHps?.name ?? ''}"?`}
        description="Nilai total HPS paket pengadaan akan dihitung ulang secara otomatis."
        confirmLabel="Hapus Item"
        onConfirm={handleDeleteHps}
      />

      <ConfirmDialog
        open={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        title={`Hapus Dokumen "${deletingDoc?.name ?? ''}"?`}
        description="Berkas fisik akan dihapus dari penyimpanan server."
        confirmLabel="Hapus Dokumen"
        onConfirm={handleDeleteDoc}
      />

      <ConfirmDialog
        open={Boolean(deletingChecklist)}
        onClose={() => setDeletingChecklist(null)}
        title={`Hapus Checklist "${deletingChecklist?.name ?? ''}"?`}
        description="Persyaratan berkas ini tidak lagi ditagihkan pada tahapan terkait."
        confirmLabel="Hapus Checklist"
        onConfirm={handleDeleteChecklist}
      />
    </div>
  )
}
