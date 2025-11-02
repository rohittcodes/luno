import { createClient } from '@/lib/supabase/server'
import { encryptConnectionMetadata } from '@/lib/subscriptions/secure-storage'

/**
 * Save external connection to database
 */
export async function saveConnection(
  userId: string,
  integrationType: 'bank' | 'payment' | 'receipt_scanner' | 'credit_monitor' | 'investment' | 'tax_service',
  toolkitName: string,
  connectionData: {
    connectionId?: string
    entityId: string
    entityName: string
    credentials?: Record<string, any> // Sensitive data to encrypt
    metadata?: Record<string, any>
  }
) {
  const supabase = await createClient()

  // Encrypt credentials if provided
  const secureMetadata = connectionData.credentials
    ? encryptConnectionMetadata(connectionData.credentials)
    : null

  const { data, error } = await supabase
    .from('external_connections')
    .insert({
      user_id: userId,
      integration_type: integrationType,
      toolkit_name: toolkitName,
      connection_id: connectionData.connectionId,
      connected_entity_id: connectionData.entityId,
      connected_entity_name: connectionData.entityName,
      status: 'active',
      secure_metadata: secureMetadata,
      metadata: connectionData.metadata || {},
      last_synced_at: new Date().toISOString(),
    } as any)
    .select()
    .single()

  if (error) {
    console.error('Error saving connection:', error)
    throw error
  }

  return data
}

/**
 * Get user's connections
 */
export async function getConnections(
  userId: string,
  integrationType?: string
) {
  const supabase = await createClient()

  let query = supabase
    .from('external_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (integrationType) {
    query = query.eq('integration_type', integrationType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching connections:', error)
    throw error
  }

  return data || []
}

/**
 * Disconnect an external connection
 */
export async function disconnectConnection(connectionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('external_connections')
    .update({ status: 'disconnected', updated_at: new Date().toISOString() } as any)
    .eq('id', connectionId)

  if (error) {
    console.error('Error disconnecting:', error)
    throw error
  }
}

/**
 * Update connection sync status
 */
export async function updateConnectionSync(
  connectionId: string,
  status: 'active' | 'error' | 'disconnected',
  errorMessage?: string
) {
  const supabase = await createClient()

  const updateData: any = {
    status,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (errorMessage) {
    updateData.metadata = { last_error: errorMessage }
  }

  const { error } = await supabase
    .from('external_connections')
    .update(updateData)
    .eq('id', connectionId)

  if (error) {
    console.error('Error updating connection:', error)
    throw error
  }
}

