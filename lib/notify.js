import { Resend } from 'resend'

export async function notifyLandscaperOfRequest({
  landscaperEmail,
  landscaperBusinessName,
  clientName,
  service,
  message,
}) {
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !fromAddress || !landscaperEmail) {
    return
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: fromAddress,
      to: landscaperEmail,
      subject: `A client is interested in your services: ${service}`,
      text: [
        `${landscaperBusinessName}, a client has shown interest in your services on LandscapeLeads!`,
        '',
        `Client: ${clientName}`,
        `Service: ${service}`,
        message ? `Message: ${message}` : null,
        '',
        'Log in to your LandscapeLeads dashboard and buy the lead to see their contact info.',
      ]
        .filter(Boolean)
        .join('\n'),
    })
  } catch (err) {
    console.error('Failed to send landscaper notification email:', err)
  }
}
