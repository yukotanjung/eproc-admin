import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { PageHeader } from '~/components/layouts/PageHeader'
import { Badge, DataState, Panel, StatusBadge, useToast } from '~/components/ui'
import {
  type ProcurementPayload,
  masterQueries,
  procurementApi,
  procurementMethodQueries,
  procurementQueries,
} from '~/integrations/api'
import { useFormValidation } from '~/lib/hooks/useFormValidation'
import { getApiErrorMessage } from '~/lib/utils/error'
import { ProcurementFormFields } from './ProcurementFormFields'
import { CURRENT_YEAR, emptyProcurementForm, procurementFormSchema } from './procurementFormSchema'

export function ProcurementEditPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const procurementId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const detailQuery = useQuery(procurementQueries.detail(procurementId))
  const jobTypesQuery = useQuery(masterQueries.list('job-type', { all: true }))
  const methodsQuery = useQuery(procurementMethodQueries.list({ all: true }))
  const qualificationsQuery = useQuery(masterQueries.list('qualification', { all: true }))
  const fundingSourcesQuery = useQuery(masterQueries.list('funding-source', { all: true }))

  const procurement = detailQuery.data?.result
  const jobTypes = jobTypesQuery.data?.result ?? []
  const methods = methodsQuery.data?.result ?? []
  const qualifications = qualificationsQuery.data?.result ?? []
  const fundingSources = fundingSourcesQuery.data?.result ?? []

  const [form, setForm] = useState<ProcurementPayload>(emptyProcurementForm)
  const [saving, setSaving] = useState(false)

  const { errors, validate, clearError, clearErrors } = useFormValidation(procurementFormSchema)

  useEffect(() => {
    if (!procurement) return
    clearErrors()
    setForm({
      jobNumber: procurement.jobNumber,
      name: procurement.name,
      budgetCeiling: Number(procurement.budgetCeiling) || 0,
      estimatedPrice: Number(procurement.estimatedPrice) || 0,
      plannedDate: procurement.plannedDate ? procurement.plannedDate.slice(0, 10) : '',
      jobTypeId: Number(procurement.jobTypeId) || 0,
      procurementMethodId: Number(procurement.procurementMethodId) || 0,
      qualificationId: Number(procurement.qualificationId) || 0,
      fundingSourceId: Number(procurement.fundingSourceId) || 0,
      budgetYear: Number(procurement.budgetYear) || CURRENT_YEAR,
      projectLocation: procurement.projectLocation || '',
      latitude: procurement.latitude ?? null,
      longitude: procurement.longitude ?? null,
      announcementLocation: procurement.announcementLocation || '',
      isActive: procurement.isActive ?? true,
    })
  }, [procurement, clearErrors])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = validate({
      jobNumber: form.jobNumber,
      budgetYear: form.budgetYear,
      plannedDate: form.plannedDate,
      name: form.name,
      jobTypeId: form.jobTypeId,
      procurementMethodId: form.procurementMethodId,
      qualificationId: form.qualificationId,
      fundingSourceId: form.fundingSourceId,
      budgetCeiling: form.budgetCeiling,
      estimatedPrice: form.estimatedPrice,
      projectLocation: form.projectLocation,
      announcementLocation: form.announcementLocation,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
      isActive: form.isActive,
    })
    if (!parsed.success) return

    setSaving(true)
    try {
      await procurementApi.update(procurementId, parsed.data)
      toast.push({
        title: 'Paket pengadaan diperbarui',
        description: `${form.jobNumber} · ${form.name}`,
        tone: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
      navigate({ to: '/procurements' })
    } catch (err) {
      toast.push({
        title: 'Gagal menyimpan paket pengadaan',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/procurements"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Daftar Paket Pengadaan
        </Link>
      </div>

      <PageHeader
        title={procurement ? `Ubah Paket: ${procurement.name}` : 'Ubah Informasi Paket Pengadaan'}
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
        description="Perbarui identitas paket, klasifikasi metode, anggaran, serta lokasi pekerjaan dan pengumuman."
      />

      {detailQuery.isLoading || detailQuery.isError || !procurement ? (
        <Panel className="overflow-hidden">
          <DataState
            loading={detailQuery.isLoading}
            fetching={detailQuery.isFetching}
            error={detailQuery.isError ? getApiErrorMessage(detailQuery.error) : null}
            empty={!procurement}
            emptyTitle="Paket pengadaan tidak ditemukan"
            emptyDescription="Data paket pengadaan tidak tersedia atau sudah dihapus."
            onRetry={() => detailQuery.refetch()}
          >
            <div />
          </DataState>
        </Panel>
      ) : (
        <ProcurementFormFields
          form={form}
          onChange={setForm}
          errors={errors}
          clearError={clearError}
          jobTypes={jobTypes}
          methods={methods}
          qualifications={qualifications}
          fundingSources={fundingSources}
          saving={saving}
          submitLabel="Simpan Perubahan"
          submitIcon={<Save className="size-4" />}
          onSubmit={handleSubmit}
          showActiveToggle
        />
      )}
    </div>
  )
}
