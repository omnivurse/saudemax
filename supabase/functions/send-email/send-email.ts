import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    const { to, subject, template_id, data } = await req.json()

    if (!to || !subject || !template_id) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
    }

    // Fetch template from Supabase table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const response = await fetch(`${supabaseUrl}/rest/v1/email_templates?select=html_body&template_id=eq.${template_id}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
    })

    const templates = await response.json()
    if (!templates || !templates.length) {
      return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404 })
    }

    // Replace mustache-style variables like {{name}} with actual data
    let htmlBody = templates[0].html_body
    Object.entries(data || {}).forEach(([key, value]) => {
      const pattern = new RegExp(`{{\s*${key}\s*}}`, 'g')
      htmlBody = htmlBody.replace(pattern, String(value))
    })

    const { data: sendResult, error } = await resend.emails.send({
      from: 'SaudeMax <hello@saudemax.com>',
      to,
      subject,
      html: htmlBody
    })

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
