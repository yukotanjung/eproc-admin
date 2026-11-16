import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import { PageHeader } from '~/components/layouts/PageHeader'
import { useToast } from '~/components/ui'
import {
  type ProcurementPayload,
  masterQueries,
  procurementApi,
  procurementMethodQueries,
} from '~/integrations/api'
import { useFormValidation } from '~/lib/hooks/useFormValidation'
import { getApiErrorMessage } from '~/lib/utils/error'
import { ProcurementFormFields } from './ProcurementFormFields'
import { emptyProcurementForm, procurementFormSchema } from './procurementFormSchema'

export function ProcurementCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<ProcurementPayload>(emptyProcurementForm)
  const [saving, setSaving] = useState(false)

  const jobTypesQuery = useQuery(masterQueries.list('job-type', { all: true }))
  const methodsQuery = useQuery(procurementMethodQueries.list({ all: true }))
  const qualificationsQuery = useQuery(masterQueries.list('qualification', { all: true }))
  const fundingSourcesQuery = useQuery(masterQueries.list('funding-source', { all: true }))

  const jobTypes = jobTypesQuery.data?.result ?? []
  const methods = methodsQuery.data?.result ?? []
  const qualifications = qualificationsQuery.data?.result ?? []
  const fundingSources = fundingSourcesQuery.data?.result ?? []

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev }
      let changed = false
      if (!prev.jobTypeId && jobTypes[0]?.id) {
        next.jobTypeId = jobTypes[0].id
        changed = true
      }
      if (!prev.procurementMethodId && methods[0]?.id) {
        next.procurementMethodId = methods[0].id
        changed = true
      }
      if (!prev.qualificationId && qualifications[0]?.id) {
        next.qualificationId = qualifications[0].id
        changed = true
      }
      if (!prev.fundingSourceId && fundingSources[0]?.id) {
        next.fundingSourceId = fundingSources[0].id
        changed = true
      }
      return changed ? next : prev
    })
  }, [jobTypes, methods, qualifications, fundingSources])

  const { errors, validate, clearError } = useFormValidation(procurementFormSchema)

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
    })
    if (!parsed.success) return

    setSaving(true)
    try {
      const { isActive: _omit, ...createPayload } = parsed.data
      const created = await procurementApi.create(createPayload)
      toast.push({
        title: 'Paket pengadaan dibuat',
        description: 'Jadwal tahapan awal otomatis disiapkan dari metode pengadaan.',
        tone: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
      if (created.result?.id) {
        navigate({
          to: '/procurements/$id',
          params: { id: String(created.result.id) },
        })
        return
      }
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
        title="Buat Paket Pengadaan Baru"
        description="Lengkapi identitas paket, klasifikasi metode, serta detail anggaran dan lokasi. Jadwal tahapan awal akan disiapkan otomatis setelah paket tersimpan."
      />

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
        submitLabel="Buat Paket Pengadaan"
        submitIcon={<Plus className="size-4" />}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
