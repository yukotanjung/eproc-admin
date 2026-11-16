import { z } from 'zod'
import type { ProcurementPayload } from '~/integrations/api'

export const CURRENT_YEAR = new Date().getFullYear()

export const emptyProcurementForm: ProcurementPayload = {
  jobNumber: '',
  name: '',
  budgetCeiling: 0,
  estimatedPrice: 0,
  plannedDate: '',
  jobTypeId: 0,
  qualificationId: 0,
  fundingSourceId: 0,
  budgetYear: CURRENT_YEAR,
  projectLocation: '',
  latitude: null,
  longitude: null,
  procurementMethodId: 0,
  announcementLocation: '',
  isActive: true,
}

export const procurementFormSchema = z.object({
  jobNumber: z
    .string()
    .trim()
    .min(1, 'Nomor pekerjaan wajib diisi')
    .max(100, 'Nomor pekerjaan maksimal 100 karakter'),
  budgetYear: z.coerce
    .number()
    .int('Tahun anggaran harus berupa bilangan bulat')
    .min(1900, 'Tahun anggaran minimal 1900')
    .max(2100, 'Tahun anggaran maksimal 2100'),
  plannedDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal rencana wajib diisi (YYYY-MM-DD)'),
  name: z
    .string()
    .trim()
    .min(1, 'Nama paket pengadaan wajib diisi')
    .max(255, 'Nama paket pengadaan maksimal 255 karakter'),
  jobTypeId: z.coerce.number().min(1, 'Jenis pekerjaan wajib dipilih'),
  procurementMethodId: z.coerce.number().min(1, 'Metode pengadaan wajib dipilih'),
  qualificationId: z.coerce.number().min(1, 'Kualifikasi usaha wajib dipilih'),
  fundingSourceId: z.coerce.number().min(1, 'Sumber dana wajib dipilih'),
  budgetCeiling: z.coerce.number().min(0, 'Nilai pagu anggaran tidak boleh negatif'),
  estimatedPrice: z.coerce.number().min(0, 'Nilai HPS tidak boleh negatif'),
  projectLocation: z
    .string()
    .trim()
    .min(1, 'Lokasi pekerjaan wajib diisi')
    .max(255, 'Lokasi pekerjaan maksimal 255 karakter'),
  announcementLocation: z
    .string()
    .trim()
    .min(1, 'Lokasi pengumuman wajib diisi')
    .max(255, 'Lokasi pengumuman maksimal 255 karakter'),
  latitude: z
    .union([
      z.coerce.number().min(-90, 'Latitude minimal -90').max(90, 'Latitude maksimal 90'),
      z.null(),
    ])
    .optional(),
  longitude: z
    .union([
      z.coerce.number().min(-180, 'Longitude minimal -180').max(180, 'Longitude maksimal 180'),
      z.null(),
    ])
    .optional(),
  isActive: z.boolean().optional(),
})
