import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RestoreRequest {
  filename: string
  confirm: boolean
}

interface RestoreResult {
  success: boolean
  filename?: string
  error?: string
  duration?: number
  preBackupFile?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  const startTime = Date.now()
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin authorization
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: user } = await supabase.auth.getUser(token)
    
    if (!user.user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.user.id)
      .single()

    if (!profile?.is_admin) {
      return new Response('Forbidden - Admin access required', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    const body: RestoreRequest = await req.json()
    
    if (!body.filename || !body.confirm) {
      return new Response('Filename and confirmation required', {
        status: 400,
        headers: corsHeaders
      })
    }

    // Get GCS credentials
    const gcsCredentialsJson = Deno.env.get('GCS_BACKUP_CREDENTIALS_JSON')
    if (!gcsCredentialsJson) {
      throw new Error('GCS_BACKUP_CREDENTIALS_JSON secret not found')
    }

    const gcsCredentials = JSON.parse(gcsCredentialsJson)
    const bucketName = 'psiclo-backups'

    // Get database connection details
    const dbUrl = Deno.env.get('SUPABASE_DB_URL')
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL secret not found')
    }

    console.log(`Starting database restore from: ${body.filename}`)

    // First, create a safety backup before restore
    const preRestoreTimestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                                new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]
    const preBackupFilename = `pre-restore/backup_${preRestoreTimestamp}.sql`

    console.log('Creating safety backup before restore...')

    // Create safety backup
    const backupCmd = [
      'pg_dump',
      '--verbose',
      '--no-password',
      '--format=custom',
      '--compress=9',
      '--no-owner',
      '--no-privileges',
      dbUrl
    ]

    const backupProcess = new Deno.Command(backupCmd[0], {
      args: backupCmd.slice(1),
      stdout: 'piped',
      stderr: 'piped'
    })

    const backupResult = await backupProcess.output()
    if (backupResult.code !== 0) {
      const errorMsg = new TextDecoder().decode(backupResult.stderr)
      throw new Error(`Safety backup failed: ${errorMsg}`)
    }

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

    // Upload safety backup to GCS
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(preBackupFilename)}`
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: backupResult.stdout
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Safety backup upload failed: ${uploadResponse.status} ${errorText}`)
    }

    console.log('Safety backup created successfully')

    // Download the restore file from GCS
    const downloadUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(body.filename)}?alt=media`
    
    const downloadResponse = await fetch(downloadUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    })

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download backup file: ${downloadResponse.status}`)
    }

    const backupData = await downloadResponse.arrayBuffer()
    console.log(`Downloaded backup file: ${(backupData.byteLength / 1024 / 1024).toFixed(2)} MB`)

    // Write backup data to temporary file
    const tempFile = `/tmp/restore_${Date.now()}.sql`
    await Deno.writeFile(tempFile, new Uint8Array(backupData))

    // Execute pg_restore
    const restoreCmd = [
      'pg_restore',
      '--verbose',
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '--dbname', dbUrl,
      tempFile
    ]

    const restoreProcess = new Deno.Command(restoreCmd[0], {
      args: restoreCmd.slice(1),
      stdout: 'piped',
      stderr: 'piped'
    })

    const restoreResult = await restoreProcess.output()
    
    // Clean up temporary file
    try {
      await Deno.remove(tempFile)
    } catch (e) {
      console.warn('Failed to remove temporary file:', e)
    }

    if (restoreResult.code !== 0) {
      const errorMsg = new TextDecoder().decode(restoreResult.stderr)
      console.error('pg_restore failed:', errorMsg)
      throw new Error(`Database restore failed: ${errorMsg}`)
    }

    console.log('Database restore completed successfully')

    const duration = Date.now() - startTime
    const result: RestoreResult = {
      success: true,
      filename: body.filename,
      duration,
      preBackupFile: preBackupFilename
    }

    // Log restore success
    await supabase.from('admin_audit_log').insert({
      user_id: user.user.id,
      admin_user_id: user.user.id,
      action: 'database_restore_success',
      new_value: result
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Restore failed:', error)
    
    const duration = Date.now() - startTime
    const result: RestoreResult = {
      success: false,
      error: error.message,
      duration
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})