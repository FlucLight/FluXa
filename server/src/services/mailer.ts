import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../config/env'

let transporter: Transporter | null = null

export function isMailerConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT)
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST ?? undefined,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      ...(env.SMTP_USER && env.SMTP_PASS
        ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
        : {}),
    })
  }
  return transporter
}

export async function sendPasswordReset(input: { to: string; name: string; token: string }): Promise<void> {
  if (!isMailerConfigured()) {
    throw new Error('SMTP belum dikonfigurasi')
  }
  const url = `${env.PUBLIC_BASE}/reset-password?token=${encodeURIComponent(input.token)}`
  await getTransporter().sendMail({
    from: env.SMTP_FROM ?? 'FluXa <no-reply@fluclight.my.id>',
    to: input.to,
    subject: 'Atur ulang kata sandi FluXa',
    text: `Halo ${input.name},\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun FluXa Anda.\n\nBuka tautan berikut dalam 30 menit:\n${url}\n\nJika bukan Anda yang meminta, abaikan email ini dan kata sandi Anda tidak akan berubah.`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px">
  <div style="max-width:420px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:24px">
    <div style="font-size:20px;font-weight:bold;color:#111827;margin-bottom:12px">FluXa</div>
    <p style="font-size:14px;color:#374151">Halo, ${input.name}</p>
    <p style="font-size:14px;color:#374151">Klik tombol di bawah untuk mengatur ulang kata sandi Anda. Tautan berlaku <strong>30 menit</strong>.</p>
    <p style="margin:20px 0"><a href="${url}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 20px;border-radius:6px">Atur ulang kata sandi</a></p>
    <p style="font-size:13px;color:#6b7280">Jika bukan Anda yang meminta, abaikan email ini.</p>
  </div>
</div>`,
  })
}