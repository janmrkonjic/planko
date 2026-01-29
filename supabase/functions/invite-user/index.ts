import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { boardId, email } = await req.json()

    if (!boardId || !email) {
      return new Response(
        JSON.stringify({ error: 'boardId and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is the board owner
    const { data: board, error: boardError } = await supabaseClient
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single()

    if (boardError || !board) {
      return new Response(
        JSON.stringify({ error: 'Board not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (board.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only board owners can invite members' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the invited email already belongs to a board member
    // First, find if there's a profile with this email
    const { data: invitedProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    // If profile exists, check if they're already a member
    if (invitedProfile) {
      const { data: existingMember } = await supabaseClient
        .from('board_members')
        .select('id')
        .eq('board_id', boardId)
        .eq('user_id', invitedProfile.id)
        .single()

      if (existingMember) {
        return new Response(
          JSON.stringify({ error: 'User is already a member of this board' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create invite
    const { data: invite, error: inviteError } = await supabaseClient
      .from('board_invites')
      .insert({
        board_id: boardId,
        email: email,
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return new Response(
        JSON.stringify({ error: 'Failed to create invite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the origin from the request
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const inviteLink = `${origin}/join?token=${invite.token}`

    // Send email using Resend
    try {
      const RESEND_API_KEY = 're_AjTEHYn3_9fCgkhU9t9h2vRCFiaGjRT3B'
      
      if (RESEND_API_KEY) {
        // Get board details for email
        const { data: boardData } = await supabaseClient
          .from('boards')
          .select('title')
          .eq('id', boardId)
          .single()

        const boardTitle = boardData?.title || 'a board'

        // Create HTML email template
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Board Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1a1a1a;">You're Invited!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                You've been invited to collaborate on <strong style="color: #1a1a1a;">${boardTitle}</strong> in Planko.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                Click the button below to accept the invitation and start collaborating with your team.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 20px; color: #718096;">
                Or copy and paste this link into your browser:<br>
                <a href="${inviteLink}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #718096;">
                This invitation was sent to <strong>${email}</strong>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #a0aec0;">
                © ${new Date().getFullYear()} Planko. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Planko <onboarding@resend.dev>',
            to: email,
            subject: `You've been invited to join ${boardTitle}`,
            html: emailHtml,
          }),
        })

        const emailResult = await emailResponse.json()
        
        if (!emailResponse.ok) {
          console.error('Resend API error:', emailResult)
          console.error('Status:', emailResponse.status)
          // Log but don't fail the invite
        } else {
          console.log('Email sent successfully:', emailResult)
        }
      } else {
        console.log('RESEND_API_KEY not set, skipping email')
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the invite if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        inviteLink,
        message: `Invite sent to ${email}. They will receive an email with the invitation link.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
