import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, User } from 'lucide-react'
import {
  Badge,
  Button,
  FieldLabel,
  OrgMark,
  Panel,
  fieldBase,
  useToast,
} from '~/components/ui'
import {
  activateAccountSchema,
  authApi,
  emailTokenSchema,
  forgotPasswordResetSchema,
  forgotPasswordSendSchema,
  loginSchema,
} from '~/integrations/api'
import { useFormValidation } from '~/lib/hooks/useFormValidation'
import { useAuth } from '~/lib/store/auth'
import { getApiErrorMessage } from '~/lib/utils/error'

function AuthFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  badge?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex h-screen flex-col justify-between overflow-y-auto bg-sidebar p-4 sm:p-6">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <OrgMark size="md" />
          <div className="leading-tight">
            <div className="text-xs font-semibold text-foreground">E-Procurement</div>
            <div className="text-[11px] text-muted-foreground">Portal Internal Karyawan</div>
          </div>
        </Link>
      </header>

      <main className="mx-auto my-8 w-full max-w-md">
        <div className="frame p-1">
          <Panel className="p-6 space-y-4">
            <div className="space-y-1">
              <h1 className="text-base font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </Panel>
          {footer && <div className="px-3 py-2 text-xs text-muted-foreground">{footer}</div>}
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>Sistem Pengadaan Barang/Jasa Secara Elektronik</span>
        <div className="flex items-center gap-3">
          <Link to="/sign-in" className="hover:text-foreground">
            Masuk
          </Link>
          <Link to="/forgot-password" className="hover:text-foreground">
            Reset Sandi
          </Link>
          <Link to="/activate" className="hover:text-foreground">
            Aktivasi Akun
          </Link>
          <Link to="/verify-email" className="hover:text-foreground">
            Verifikasi Email
          </Link>
        </div>
      </footer>
    </div>
  )
}

export function SignInPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { setSession } = useAuth()

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ login?: string; password?: string }>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ login, password })
    if (!parsed.success) {
      const nextErrors: { login?: string; password?: string } = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'login' && !nextErrors.login) nextErrors.login = issue.message
        if (key === 'password' && !nextErrors.password) nextErrors.password = issue.message
      }
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    setLoading(true)
    try {
      const res = await authApi.login(parsed.data)
      const result = res.result
      if (result?.token) {
        setSession(result.token, result)
      }
      toast.push({
        title: 'Berhasil masuk',
        description: `Selamat datang kembali, ${result?.name || parsed.data.login}.`,
        tone: 'success',
      })
      navigate({ to: '/' })
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Gagal masuk. Periksa kembali username/email dan kata sandi Anda.'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid h-screen overflow-y-auto bg-sidebar lg:grid-cols-12">
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:col-span-5 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/10">
            <OrgMark size="md" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">E-Procurement</div>
            <div className="text-xs text-white/60">Portal Internal Karyawan</div>
          </div>
        </div>

        <div className="max-w-md space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Sistem Pengadaan Barang & Jasa Terpadu.
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Lingkungan kerja resmi bagi panitia pengadaan, pejabat pembuat komitmen, dan
              administrator unit untuk mengelola paket secara akuntabel.
            </p>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10 text-xs">
            <div className="py-3.5">
              <div className="font-medium text-white">Paket & Jadwal Pengadaan</div>
              <div className="mt-0.5 text-white/60">
                Penyusunan dokumen, rincian HPS, dan pemantauan tahapan lelang.
              </div>
            </div>
            <div className="py-3.5">
              <div className="font-medium text-white">Otorisasi Berbasis Peran</div>
              <div className="mt-0.5 text-white/60">
                Menu navigasi dan tindakan menyesuaikan hak akses akun Anda.
              </div>
            </div>
            <div className="py-3.5">
              <div className="font-medium text-white">Jejak Audit Terintegrasi</div>
              <div className="mt-0.5 text-white/60">
                Setiap perubahan data dan persetujuan tercatat otomatis oleh sistem.
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-white/50">
          Butuh bantuan akses? Hubungi administrator unit pengadaan.
        </div>
      </aside>

      <main className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-7">
        <div className="flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2.5">
            <OrgMark size="md" />
            <div className="leading-tight">
              <div className="text-xs font-semibold text-foreground">E-Procurement</div>
              <div className="text-[11px] text-muted-foreground">Portal Internal Karyawan</div>
            </div>
          </div>
        </div>

        <div className="mx-auto my-auto w-full max-w-[400px] py-8">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Masuk ke Akun Karyawan
            </h1>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Masukkan username atau email kantor beserta kata sandi Anda untuk melanjutkan.
            </p>
          </div>

          <Panel className="p-6">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                >
                  {error}
                </div>
              )}

              <FieldLabel label="Username atau Email" required>
                <div className="relative">
                  <User className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    aria-invalid={Boolean(fieldErrors.login)}
                    value={login}
                    onChange={(e) => {
                      setLogin(e.target.value)
                      if (fieldErrors.login) setFieldErrors((prev) => ({ ...prev, login: undefined }))
                    }}
                    placeholder="username atau nama@perusahaan.co.id"
                    className={`${fieldBase} pl-8 ${fieldErrors.login ? 'border-rose-400 focus:border-rose-500' : ''}`}
                  />
                </div>
                {fieldErrors.login && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.login}</p>
                )}
              </FieldLabel>

              <FieldLabel
                label="Kata Sandi"
                required
                hint={
                  <Link to="/forgot-password" className="hover:text-foreground hover:underline">
                    Lupa kata sandi?
                  </Link>
                }
              >
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }))
                      }
                    }}
                    placeholder="Masukkan kata sandi"
                    className={`${fieldBase} pl-8 pr-9 ${fieldErrors.password ? 'border-rose-400 focus:border-rose-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.password}</p>
                )}
              </FieldLabel>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full justify-center"
              >
                Masuk
              </Button>
            </form>
          </Panel>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Belum aktivasi akun baru?</span>
            <Link to="/activate" className="font-medium text-foreground hover:underline">
              Aktivasi Akun
            </Link>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>Sistem Pengadaan Barang & Jasa</span>
          <div className="flex items-center gap-4">
            <Link to="/forgot-password" className="hover:text-foreground">
              Reset Sandi
            </Link>
            <Link to="/activate" className="hover:text-foreground">
              Aktivasi
            </Link>
            <Link to="/verify-email" className="hover:text-foreground">
              Verifikasi Email
            </Link>
          </div>
        </footer>
      </main>
    </div>
  )
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState<'send' | 'reset'>('send')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingToken, setCheckingToken] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenVerified, setTokenVerified] = useState(false)
  const sendForm = useFormValidation(forgotPasswordSendSchema)
  const resetForm = useFormValidation(forgotPasswordResetSchema)

  const handleSendToken = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = sendForm.validate({ email })
    if (!parsed.success) return
    setLoading(true)
    try {
      await authApi.sendForgotPassword({ email: parsed.data.email.trim() })
      toast.push({
        title: 'Token terkirim',
        description: 'Periksa kotak masuk email Anda untuk kode token reset kata sandi.',
        tone: 'success',
      })
      resetForm.clearErrors()
      setStep('reset')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal mengirim token reset kata sandi.'))
    } finally {
      setLoading(false)
    }
  }

  const handleCheckToken = async () => {
    if (!email.trim() || !token.trim()) {
      setError('Isi email dan token terlebih dahulu untuk memeriksa validitas token.')
      return
    }
    setError(null)
    setCheckingToken(true)
    try {
      await authApi.checkForgotPasswordToken({ email: email.trim(), token: token.trim() })
      setTokenVerified(true)
      toast.push({
        title: 'Token valid',
        description: 'Token pemulihan kata sandi terverifikasi.',
        tone: 'success',
      })
    } catch (err) {
      setTokenVerified(false)
      setError(getApiErrorMessage(err, 'Token tidak valid atau sudah kedaluwarsa.'))
    } finally {
      setCheckingToken(false)
    }
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = resetForm.validate({ email, token, password })
    if (!parsed.success) return
    setLoading(true)
    try {
      await authApi.resetPassword({
        email: parsed.data.email.trim(),
        token: parsed.data.token.trim(),
        password: parsed.data.password,
      })
      toast.push({
        title: 'Kata sandi diperbarui',
        description: 'Silakan masuk dengan kata sandi baru Anda.',
        tone: 'success',
      })
      navigate({ to: '/sign-in' })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memperbarui kata sandi.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      title="Pemulihan Kata Sandi"
      subtitle={
        step === 'send'
          ? 'Masukkan alamat email terdaftar untuk menerima token pemulihan kata sandi.'
          : 'Masukkan token dari email beserta kata sandi baru minimal 8 karakter.'
      }
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(step === 'send' ? 'reset' : 'send')}
            className="text-foreground hover:underline cursor-pointer"
          >
            {step === 'send' ? 'Sudah punya token?' : 'Kirim ulang token email'}
          </button>
          <Link to="/sign-in" className="font-medium text-foreground hover:underline">
            Kembali ke Masuk →
          </Link>
        </div>
      }
    >
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {step === 'send' ? (
        <form onSubmit={handleSendToken} noValidate className="space-y-3">
          <FieldLabel label="Email Terdaftar" required error={sendForm.errors.email}>
            <input
              type="email"
              aria-invalid={Boolean(sendForm.errors.email)}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                sendForm.clearError('email')
              }}
              placeholder="nama@instansi.go.id"
              className={fieldBase}
            />
          </FieldLabel>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full justify-center"
          >
            Kirim Token Pemulihan
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} noValidate className="space-y-3">
          <FieldLabel label="Email" required error={resetForm.errors.email}>
            <input
              type="email"
              aria-invalid={Boolean(resetForm.errors.email)}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                resetForm.clearError('email')
              }}
              placeholder="nama@instansi.go.id"
              className={fieldBase}
            />
          </FieldLabel>

          <FieldLabel
            label="Token Pemulihan"
            required
            error={resetForm.errors.token}
            hint={
              tokenVerified ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="size-3" /> Valid
                </span>
              ) : null
            }
          >
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                aria-invalid={Boolean(resetForm.errors.token)}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                  setTokenVerified(false)
                  resetForm.clearError('token')
                }}
                placeholder="Kode token dari email"
                className={`${fieldBase} font-mono`}
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                loading={checkingToken}
                onClick={handleCheckToken}
              >
                Cek Token
              </Button>
            </div>
          </FieldLabel>

          <FieldLabel
            label="Kata Sandi Baru"
            required
            hint="Minimal 8 karakter"
            error={resetForm.errors.password}
          >
            <input
              type="password"
              aria-invalid={Boolean(resetForm.errors.password)}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                resetForm.clearError('password')
              }}
              placeholder="Kata sandi baru"
              className={fieldBase}
            />
          </FieldLabel>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full justify-center"
          >
            Simpan Kata Sandi Baru
          </Button>
        </form>
      )}
    </AuthFrame>
  )
}

export function ActivateAccountPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { errors, validate, clearError } = useFormValidation(activateAccountSchema)

  const handleCheckToken = async () => {
    if (!email.trim() || !token.trim()) {
      setError('Masukkan email dan token aktivasi terlebih dahulu.')
      return
    }
    setError(null)
    setChecking(true)
    try {
      await authApi.checkActivationToken({ email: email.trim(), token: token.trim() })
      setTokenValid(true)
      toast.push({
        title: 'Token aktivasi valid',
        description: 'Silakan tetapkan kata sandi untuk mengaktifkan akun Anda.',
        tone: 'success',
      })
    } catch (err) {
      setTokenValid(false)
      setError(getApiErrorMessage(err, 'Token aktivasi tidak ditemukan atau kedaluwarsa.'))
    } finally {
      setChecking(false)
    }
  }

  const handleActivate = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = validate({ email, token, password })
    if (!parsed.success) return
    setLoading(true)
    try {
      await authApi.activate({
        email: parsed.data.email.trim(),
        token: parsed.data.token.trim(),
        password: parsed.data.password,
      })
      toast.push({
        title: 'Akun berhasil diaktifkan',
        description: 'Silakan masuk menggunakan email dan kata sandi baru Anda.',
        tone: 'success',
      })
      navigate({ to: '/sign-in' })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal mengaktifkan akun.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      title="Aktivasi Akun Pengguna Baru"
      subtitle="Gunakan token aktivasi yang dikirimkan ke email Anda untuk mengaktifkan akun dan membuat kata sandi."
      footer={
        <div className="flex items-center justify-between">
          <span>Sudah aktif?</span>
          <Link to="/sign-in" className="font-medium text-foreground hover:underline">
            Masuk ke akun →
          </Link>
        </div>
      }
    >
      <form onSubmit={handleActivate} noValidate className="space-y-3">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <FieldLabel label="Email Akun" required error={errors.email}>
          <input
            type="email"
            aria-invalid={Boolean(errors.email)}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearError('email')
            }}
            placeholder="nama@instansi.go.id"
            className={fieldBase}
          />
        </FieldLabel>

        <FieldLabel
          label="Token Aktivasi"
          required
          error={errors.token}
          hint={
            tokenValid ? (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="size-3" /> Token valid
              </span>
            ) : null
          }
        >
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              aria-invalid={Boolean(errors.token)}
              value={token}
              onChange={(e) => {
                setToken(e.target.value)
                setTokenValid(false)
                clearError('token')
              }}
              placeholder="Token dari email undangan"
              className={`${fieldBase} font-mono`}
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              loading={checking}
              onClick={handleCheckToken}
            >
              Validasi
            </Button>
          </div>
        </FieldLabel>

        <FieldLabel
          label="Buat Kata Sandi"
          required
          hint="Minimal 8 karakter"
          error={errors.password}
        >
          <input
            type="password"
            aria-invalid={Boolean(errors.password)}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearError('password')
            }}
            placeholder="Kata sandi baru"
            className={fieldBase}
          />
        </FieldLabel>

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="w-full justify-center"
        >
          <KeyRound className="size-3.5" />
          Aktifkan Akun
        </Button>
      </form>
    </AuthFrame>
  )
}

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { errors, validate, clearError } = useFormValidation(emailTokenSchema)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = validate({ email, token })
    if (!parsed.success) return
    setLoading(true)
    try {
      await authApi.verifyEmail({
        email: parsed.data.email.trim(),
        token: parsed.data.token.trim(),
      })
      toast.push({
        title: 'Email berhasil diverifikasi',
        description: 'Alamat email baru Anda telah dikonfirmasi.',
        tone: 'success',
      })
      navigate({ to: '/profile' })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memverifikasi perubahan email.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      title="Verifikasi Perubahan Email"
      subtitle="Masukkan alamat email baru dan kode token verifikasi untuk menyelesaikan pembaruan email profil."
      footer={
        <div className="flex items-center justify-between">
          <Link to="/profile" className="text-foreground hover:underline">
            ← Kembali ke Profil
          </Link>
          <Link to="/sign-in" className="font-medium text-foreground hover:underline">
            Halaman Masuk →
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <FieldLabel label="Email Baru" required error={errors.email}>
          <input
            type="email"
            aria-invalid={Boolean(errors.email)}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearError('email')
            }}
            placeholder="email.baru@instansi.go.id"
            className={fieldBase}
          />
        </FieldLabel>

        <FieldLabel label="Token Verifikasi" required error={errors.token}>
          <input
            type="text"
            aria-invalid={Boolean(errors.token)}
            value={token}
            onChange={(e) => {
              setToken(e.target.value)
              clearError('token')
            }}
            placeholder="Kode token verifikasi"
            className={`${fieldBase} font-mono`}
          />
        </FieldLabel>

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="w-full justify-center"
        >
          <ShieldCheck className="size-3.5" />
          Konfirmasi Email
        </Button>
      </form>
    </AuthFrame>
  )
}
