import type { FormEvent, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { FileSpreadsheet, Layers, Wallet } from 'lucide-react'
import {
  Button,
  DatePicker,
  FieldLabel,
  FieldSelect,
  Frame,
  FrameHeader,
  Panel,
  Switch,
  fieldBase,
} from '~/components/ui'
import type { ProcurementPayload } from '~/integrations/api'
import type { FormErrors } from '~/lib/hooks/useFormValidation'
import { formatGroupedNumber, parseDigits } from '~/lib/utils/format'

interface OptionItem {
  id: number
  name: string
}

export function ProcurementFormFields({
  form,
  onChange,
  errors,
  clearError,
  jobTypes,
  methods,
  qualifications,
  fundingSources,
  saving,
  submitLabel,
  submitIcon,
  onSubmit,
  cancelTo = '/procurements',
  showActiveToggle = false,
}: {
  form: ProcurementPayload
  onChange: (next: ProcurementPayload) => void
  errors: FormErrors<Record<string, unknown>>
  clearError: (field: any) => void
  jobTypes: OptionItem[]
  methods: OptionItem[]
  qualifications: OptionItem[]
  fundingSources: OptionItem[]
  saving: boolean
  submitLabel: string
  submitIcon?: ReactNode
  onSubmit: (e: FormEvent) => void
  cancelTo?: string
  showActiveToggle?: boolean
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Frame>
        <FrameHeader icon={FileSpreadsheet} title="Identitas Paket" />
        <Panel className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FieldLabel label="Nomor Pekerjaan" required error={errors.jobNumber}>
              <input
                type="text"
                maxLength={100}
                aria-invalid={Boolean(errors.jobNumber)}
                value={form.jobNumber}
                onChange={(e) => {
                  onChange({ ...form, jobNumber: e.target.value })
                  clearError('jobNumber')
                }}
                placeholder="PROC-2026-001"
                className={`${fieldBase} font-mono`}
              />
            </FieldLabel>

            <FieldLabel label="Tahun Anggaran" required error={errors.budgetYear}>
              <input
                type="number"
                min={1900}
                max={2100}
                aria-invalid={Boolean(errors.budgetYear)}
                value={form.budgetYear}
                onChange={(e) => {
                  onChange({ ...form, budgetYear: Number(e.target.value) })
                  clearError('budgetYear')
                }}
                className={`${fieldBase} font-mono`}
              />
            </FieldLabel>

            <FieldLabel label="Tanggal Rencana" required error={errors.plannedDate}>
              <DatePicker
                error={errors.plannedDate}
                value={form.plannedDate}
                onChange={(val) => {
                  onChange({ ...form, plannedDate: val })
                  clearError('plannedDate')
                }}
              />
            </FieldLabel>
          </div>

          <FieldLabel label="Nama Paket Pengadaan" required error={errors.name}>
            <input
              type="text"
              maxLength={255}
              aria-invalid={Boolean(errors.name)}
              value={form.name}
              onChange={(e) => {
                onChange({ ...form, name: e.target.value })
                clearError('name')
              }}
              placeholder="Pembangunan Gedung Kantor"
              className={fieldBase}
            />
          </FieldLabel>
        </Panel>
      </Frame>

      <Frame>
        <FrameHeader icon={Layers} title="Klasifikasi & Metode Pengadaan" />
        <Panel className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldLabel label="Jenis Pekerjaan" required error={errors.jobTypeId}>
              <FieldSelect
                error={errors.jobTypeId}
                value={form.jobTypeId || ''}
                onChange={(v) => {
                  onChange({ ...form, jobTypeId: Number(v) })
                  clearError('jobTypeId')
                }}
                placeholder="Pilih Jenis Pekerjaan"
                options={jobTypes.map((x) => ({ value: x.id, label: x.name }))}
              />
            </FieldLabel>

            <FieldLabel label="Metode Pengadaan" required error={errors.procurementMethodId}>
              <FieldSelect
                error={errors.procurementMethodId}
                value={form.procurementMethodId || ''}
                onChange={(v) => {
                  onChange({ ...form, procurementMethodId: Number(v) })
                  clearError('procurementMethodId')
                }}
                placeholder="Pilih Metode Pengadaan"
                options={methods.map((x) => ({ value: x.id, label: x.name }))}
              />
            </FieldLabel>

            <FieldLabel label="Kualifikasi Usaha" required error={errors.qualificationId}>
              <FieldSelect
                error={errors.qualificationId}
                value={form.qualificationId || ''}
                onChange={(v) => {
                  onChange({ ...form, qualificationId: Number(v) })
                  clearError('qualificationId')
                }}
                placeholder="Pilih Kualifikasi"
                options={qualifications.map((x) => ({ value: x.id, label: x.name }))}
              />
            </FieldLabel>

            <FieldLabel label="Sumber Dana" required error={errors.fundingSourceId}>
              <FieldSelect
                error={errors.fundingSourceId}
                value={form.fundingSourceId || ''}
                onChange={(v) => {
                  onChange({ ...form, fundingSourceId: Number(v) })
                  clearError('fundingSourceId')
                }}
                placeholder="Pilih Sumber Dana"
                options={fundingSources.map((x) => ({ value: x.id, label: x.name }))}
              />
            </FieldLabel>
          </div>
        </Panel>
      </Frame>

      <Frame>
        <FrameHeader icon={Wallet} title="Anggaran, Lokasi & Pengumuman" />
        <Panel className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldLabel label="Nilai Pagu Anggaran (IDR)" required error={errors.budgetCeiling}>
              <input
                type="text"
                inputMode="numeric"
                aria-invalid={Boolean(errors.budgetCeiling)}
                value={formatGroupedNumber(form.budgetCeiling)}
                onChange={(e) => {
                  onChange({ ...form, budgetCeiling: parseDigits(e.target.value) })
                  clearError('budgetCeiling')
                }}
                placeholder="0"
                className={`${fieldBase} font-mono`}
              />
            </FieldLabel>

            <FieldLabel label="Nilai Perkiraan / HPS (IDR)" required error={errors.estimatedPrice}>
              <input
                type="text"
                inputMode="numeric"
                aria-invalid={Boolean(errors.estimatedPrice)}
                value={formatGroupedNumber(form.estimatedPrice)}
                onChange={(e) => {
                  onChange({ ...form, estimatedPrice: parseDigits(e.target.value) })
                  clearError('estimatedPrice')
                }}
                placeholder="0"
                className={`${fieldBase} font-mono`}
              />
            </FieldLabel>

            <FieldLabel label="Lokasi Pekerjaan" required error={errors.projectLocation}>
              <input
                type="text"
                maxLength={255}
                aria-invalid={Boolean(errors.projectLocation)}
                value={form.projectLocation}
                onChange={(e) => {
                  onChange({ ...form, projectLocation: e.target.value })
                  clearError('projectLocation')
                }}
                placeholder="Jakarta Pusat"
                className={fieldBase}
              />
            </FieldLabel>

            <FieldLabel label="Lokasi Pengumuman" required error={errors.announcementLocation}>
              <input
                type="text"
                maxLength={255}
                aria-invalid={Boolean(errors.announcementLocation)}
                value={form.announcementLocation}
                onChange={(e) => {
                  onChange({ ...form, announcementLocation: e.target.value })
                  clearError('announcementLocation')
                }}
                placeholder="Portal E-Procurement"
                className={fieldBase}
              />
            </FieldLabel>

            <FieldLabel label="Latitude (Opsional)" error={errors.latitude}>
              <input
                type="number"
                step="any"
                min={-90}
                max={90}
                aria-invalid={Boolean(errors.latitude)}
                value={form.latitude ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  onChange({ ...form, latitude: val === '' ? null : Number(val) })
                  clearError('latitude')
                }}
                placeholder="-6.20880000"
                className={`${fieldBase} font-mono`}
              />
            </FieldLabel>

            <FieldLabel label="Longitude (Opsional)" error={errors.longitude}>
              <input
                type="number"
                step="any"
                min={-180}
                max={180}
                aria-invalid={Boolean(errors.longitude)}
                value={form.longitude ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  onChange({ ...form, longitude: val === '' ? null : Number(val) })
                  clearError('longitude')
                }}
                placeholder="106.84560000"
                className={`${fieldBase} font-mono`}
              />
            </FieldLabel>
          </div>

          {showActiveToggle && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 py-2.5">
              <div>
                <div className="text-xs font-medium text-foreground">Status Aktif Paket</div>
                <div className="text-[11px] text-muted-foreground">
                  Nonaktifkan jika paket sementara tidak aktif tanpa membatalkannya.
                </div>
              </div>
              <Switch
                checked={form.isActive ?? true}
                onChange={(v) => onChange({ ...form, isActive: v })}
                ariaLabel="Status aktif paket"
              />
            </div>
          )}
        </Panel>
      </Frame>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Link
          to={cancelTo}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-xs transition duration-200 ease-out hover:bg-accent/50"
        >
          Batal
        </Link>
        <Button variant="primary" size="md" type="submit" loading={saving}>
          {submitIcon}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
