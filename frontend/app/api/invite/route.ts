import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { email, roadmapName, role, ownerEmail } = await req.json()

    if (!email || !roadmapName || !role || !ownerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Configure SMTP transport using environment variables
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASSWORD
    const smtpFrom = process.env.SMTP_FROM || 'FlowMap <invitations@flowmap.dev>'

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn(
        `SMTP is not configured. Collaborator invitation email to ${email} was skipped. ` +
        `Define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in .env.local to enable email sending.`
      )
      return NextResponse.json({ 
        success: true, 
        warning: 'SMTP server is not configured in .env.local. Email sending skipped.' 
      })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const origin = req.headers.get('origin') || 'http://localhost:3000'

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: `Collaboration Invitation: ${roadmapName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #050810; color: #ffffff; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.04em; margin: 0; background: linear-gradient(135deg, #c7d2fe, #818cf8, #6ee7b7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">FlowMap</h1>
            <p style="color: rgba(255,255,255,0.4); font-size: 14px; margin: 4px 0 0 0;">Your learning universe</p>
          </div>
          
          <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.85); margin: 0 0 16px 0;">
              Hello,
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.8); margin: 0 0 20px 0;">
              <strong>${ownerEmail}</strong> has invited you to collaborate on their FlowMap learning roadmap <strong>"${roadmapName}"</strong> as an <strong>${role}</strong>.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${origin}" style="background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 10px 20px rgba(99,102,241,0.25);">
                Accept Invitation & Open Roadmap
              </a>
            </div>
          </div>
          
          <p style="font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.3); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin: 0;">
            Note: If you do not yet have a FlowMap account, please register an account using the email address <strong>${email}</strong> to gain access to the shared workspace.
          </p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to send collaborator invitation email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send collaborator invitation email' },
      { status: 500 }
    )
  }
}
