import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackupResult {
  success: boolean
  filename?: string
  size?: number
  error?: string
  duration?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get GCS credentials
    const gcsCredentialsJson = Deno.env.get('GCS_BACKUP_CREDENTIALS_JSON')
    if (!gcsCredentialsJson) {
      throw new Error('GCS_BACKUP_CREDENTIALS_JSON secret not found')
    }

    const gcsCredentials = JSON.parse(gcsCredentialsJson)
    const projectId = gcsCredentials.project_id
    const bucketName = 'psiclo-backups'

    // Get database connection details
    const dbUrl = Deno.env.get('SUPABASE_DB_URL')
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL secret not found')
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]
    const filename = `daily/backup_${timestamp}.sql`

    console.log(`Starting database backup: ${filename}`)

    // Create pg_dump command
    const cmd = [
      'pg_dump',
      '--verbose',
      '--no-password',
      '--format=custom',
      '--compress=9',
      '--no-owner',
      '--no-privileges',
      dbUrl
    ]

    // Execute pg_dump
    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: 'piped',
      stderr: 'piped'
    })

    const { code, stdout, stderr } = await process.output()

    if (code !== 0) {
      const errorMsg = new TextDecoder().decode(stderr)
      console.error('pg_dump failed:', errorMsg)
      throw new Error(`pg_dump failed: ${errorMsg}`)
    }

    const backupData = stdout
    const backupSize = backupData.length

    console.log(`Backup created successfully. Size: ${(backupSize / 1024 / 1024).toFixed(2)} MB`)

    // Get OAuth2 token for GCS
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const now = Math.floor(Date.now() / 1000)
    const jwtPayload = btoa(JSON.stringify({
      iss: gcsCredentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }))

    // Import private key for signing
    const privateKeyPem = gcsCredentials.private_key
    const pemHeader = '-----BEGIN PRIVATE KEY-----'
    const pemFooter = '-----END PRIVATE KEY-----'
    const pemContents = privateKeyPem.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '')
    
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const jwtUnsigned = `${jwtHeader}.${jwtPayload}`
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(jwtUnsigned)
    )
    
    const jwtSigned = `${jwtUnsigned}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`

    // Get OAuth2 token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtSigned}`
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) {
      throw new Error('Failed to get GCS access token')
    }

    // Upload to GCS
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filename)}`
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: backupData
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`GCS upload failed: ${uploadResponse.status} ${errorText}`)
    }

    console.log(`Backup uploaded successfully to GCS: ${filename}`)

    // Cleanup old backups (keep last 15 days)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 15)
    const cutoffTimestamp = cutoffDate.toISOString().split('T')[0].replace(/-/g, '')

    try {
      const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=daily/`
      const listResponse = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })

      if (listResponse.ok) {
        const listData = await listResponse.json()
        const filesToDelete = listData.items?.filter((item: any) => {
          const fileTimestamp = item.name.match(/backup_(\d{4}-\d{2}-\d{2})/)?.[1]?.replace(/-/g, '')
          return fileTimestamp && fileTimestamp < cutoffTimestamp
        }) || []

        for (const file of filesToDelete) {
          const deleteUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(file.name)}`
          await fetch(deleteUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
          })
          console.log(`Deleted old backup: ${file.name}`)
        }
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup old backups:', cleanupError)
    }

    const duration = Date.now() - startTime
    const result: BackupResult = {
      success: true,
      filename,
      size: backupSize,
      duration
    }

    // Log backup success
    await supabase.from('admin_audit_log').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      admin_user_id: '00000000-0000-0000-0000-000000000000',
      action: 'database_backup_success',
      new_value: result
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Backup failed:', error)
    
    const duration = Date.now() - startTime
    const result: BackupResult = {
      success: false,
      error: error.message,
      duration
    }

    // Log backup failure
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      
      await supabase.from('admin_audit_log').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        admin_user_id: '00000000-0000-0000-0000-000000000000',
        action: 'database_backup_failed',
        new_value: result
      })
    } catch (logError) {
      console.error('Failed to log backup failure:', logError)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
