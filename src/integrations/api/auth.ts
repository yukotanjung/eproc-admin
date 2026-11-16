import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { objectToFormData } from '~/lib/utils/append-form-data'
import type { AuthUser, DefaultRes } from '~/types'
import { apiClient } from './client'

export const loginSchema = z.object({
  login: z.string().trim().min(1, 'Username atau email wajib diisi'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})
export type LoginPayload = z.infer<typeof loginSchema>

export const activateAccountSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  token: z.string().min(1, 'Token aktivasi wajib diisi'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
})
export type ActivateAccountPayload = z.infer<typeof activateAccountSchema>

export const emailTokenSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  token: z.string().min(1, 'Token wajib diisi'),
})
export type EmailTokenPayload = z.infer<typeof emailTokenSchema>

export const forgotPasswordSendSchema = z.object({
  email: z.string().email('Format email tidak valid'),
})
export type ForgotPasswordSendPayload = z.infer<typeof forgotPasswordSendSchema>

export const forgotPasswordResetSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  token: z.string().min(1, 'Token wajib diisi'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
})
export type ForgotPasswordResetPayload = z.infer<typeof forgotPasswordResetSchema>

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Kata sandi lama wajib diisi'),
  newPassword: z.string().min(8, 'Kata sandi baru minimal 8 karakter'),
})
export type UpdatePasswordPayload = z.infer<typeof updatePasswordSchema>

export interface UpdateProfilePayload {
  name: string
  username: string
  employeeCode?: string | null
  email?: string
  callbackUrl?: string
  photo?: File | null
}

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<DefaultRes<AuthUser & { token: string }>>(
      '/api/auth/login',
      payload,
    )
    return data
  },

  async me() {
    const { data } = await apiClient.get<DefaultRes<AuthUser>>('/api/auth/me')
    return data
  },

  async logout() {
    const { data } = await apiClient.get<DefaultRes<null>>('/api/auth/logout')
    return data
  },

  async checkActivationToken(payload: EmailTokenPayload) {
    const { data } = await apiClient.post<DefaultRes<unknown>>(
      '/api/auth/activate/check_token',
      payload,
    )
    return data
  },

  async activate(payload: ActivateAccountPayload) {
    const { data } = await apiClient.post<DefaultRes<AuthUser>>('/api/auth/activate', payload)
    return data
  },

  async verifyEmail(payload: EmailTokenPayload) {
    const { data } = await apiClient.post<DefaultRes<AuthUser>>('/api/auth/verify-email', payload)
    return data
  },

  async sendForgotPassword(payload: ForgotPasswordSendPayload) {
    const { data } = await apiClient.post<DefaultRes<unknown>>(
      '/api/auth/forgot_password/send',
      payload,
    )
    return data
  },

  async checkForgotPasswordToken(payload: EmailTokenPayload) {
    const { data } = await apiClient.post<DefaultRes<unknown>>(
      '/api/auth/forgot_password/check_token',
      payload,
    )
    return data
  },

  async resetPassword(payload: ForgotPasswordResetPayload) {
    const { data } = await apiClient.post<DefaultRes<AuthUser>>(
      '/api/auth/forgot_password/update_password',
      payload,
    )
    return data
  },
}

export const profileApi = {
  async getProfile() {
    const { data } = await apiClient.get<DefaultRes<AuthUser>>('/api/profile')
    return data
  },

  async updateProfile(payload: UpdateProfilePayload) {
    const formData = objectToFormData({
      name: payload.name,
      username: payload.username,
      employeeCode: payload.employeeCode ?? undefined,
      email: payload.email || undefined,
      callbackUrl: payload.callbackUrl || undefined,
      photo: payload.photo ?? undefined,
    })
    const { data } = await apiClient.post<DefaultRes<AuthUser>>(
      '/api/profile/update-profile',
      formData,
    )
    return data
  },

  async updatePassword(payload: UpdatePasswordPayload) {
    const { data } = await apiClient.post<DefaultRes<AuthUser>>(
      '/api/profile/update-password',
      payload,
    )
    return data
  },

  async updateNotificationDevice(notificationDevice: string) {
    const { data } = await apiClient.post<DefaultRes<AuthUser>>(
      '/api/profile/update-notification-device',
      { notificationDevice },
    )
    return data
  },
}

export const profileQueryOptions = () =>
  queryOptions({
    queryKey: ['profile', 'detail'],
    queryFn: () => profileApi.getProfile(),
  })
