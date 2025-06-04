import { NextRequest, NextResponse } from 'next/server'
import { getServerStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    console.log('[Stripe Cancel] Processing subscription cancellation...')
    
    // Validate environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Stripe Cancel] Missing Supabase environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey
      })
      return NextResponse.json(
        { error: 'Server configuration error - missing Supabase credentials' },
        { status: 500 }
      )
    }
    
    // Check authentication via Bearer token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Stripe Cancel] Authentication missing')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify user with Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('[Stripe Cancel] Invalid user token:', userError)
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    console.log('[Stripe Cancel] Cancelling subscription for user:', user.id, 'subscription:', subscriptionId)

    // Create user-authenticated Supabase client
    const userSupabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Count total notes across ALL tables (including video_upload_notes)
    console.log('[Stripe Cancel] Counting user notes from all tables...')
    const [textNotesResult, fileNotesResult, videoNotesResult, uploadVideoNotesResult] = await Promise.all([
      userSupabase.from('text_notes').select('id, created_at', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: true }),
      userSupabase.from('file_notes').select('id, created_at', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: true }),
      userSupabase.from('video_notes').select('id, created_at', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: true }),
      // Add video upload notes support
      userSupabase.from('video_upload_notes').select('id, created_at', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: true }).then(
        result => result,
        error => {
          console.warn('[Stripe Cancel] video_upload_notes table might not exist, skipping:', error.message)
          return { data: [], count: 0 }
        }
      )
    ])

    const textNotes = textNotesResult.data || []
    const fileNotes = fileNotesResult.data || []
    const videoNotes = videoNotesResult.data || []
    const uploadVideoNotes = uploadVideoNotesResult.data || []
    
    const allNotes = [
      ...textNotes.map(note => ({ ...note, type: 'text' })),
      ...fileNotes.map(note => ({ ...note, type: 'file' })),
      ...videoNotes.map(note => ({ ...note, type: 'video' })),
      ...uploadVideoNotes.map(note => ({ ...note, type: 'video_upload' }))
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const totalNotes = allNotes.length
    console.log('[Stripe Cancel] Total notes found:', {
      text: textNotes.length,
      file: fileNotes.length,
      video: videoNotes.length,
      video_upload: uploadVideoNotes.length,
      total: totalNotes
    })

    // Prepare note deletion statistics
    let notesDeleted = {
      text: 0,
      file: 0,
      video: 0,
      video_upload: 0,
      total: 0
    }

    // If user has more than 3 notes, delete the excess (keep the 3 oldest)
    if (totalNotes > 3) {
      const notesToDelete = allNotes.slice(3) // Remove everything after the first 3 (oldest)
      console.log('[Stripe Cancel] Notes to delete:', notesToDelete.length)

      // Group notes to delete by type for batch deletion
      const textNotesToDelete = notesToDelete.filter(note => note.type === 'text').map(note => note.id)
      const fileNotesToDelete = notesToDelete.filter(note => note.type === 'file').map(note => note.id)
      const videoNotesToDelete = notesToDelete.filter(note => note.type === 'video').map(note => note.id)
      const uploadVideoNotesToDelete = notesToDelete.filter(note => note.type === 'video_upload').map(note => note.id)

      // Delete notes in batches by type
      const deletionPromises = []

      if (textNotesToDelete.length > 0) {
        deletionPromises.push(
          userSupabase
            .from('text_notes')
            .delete()
            .in('id', textNotesToDelete)
            .then(result => {
              if (result.error) {
                console.error('[Stripe Cancel] Error deleting text notes:', result.error)
                return { type: 'text', count: 0, error: result.error }
              } else {
                notesDeleted.text = textNotesToDelete.length
                console.log('[Stripe Cancel] Deleted text notes:', textNotesToDelete.length)
                return { type: 'text', count: textNotesToDelete.length, error: null }
              }
            })
        )
      }

      if (fileNotesToDelete.length > 0) {
        deletionPromises.push(
          userSupabase
            .from('file_notes')
            .delete()
            .in('id', fileNotesToDelete)
            .then(result => {
              if (result.error) {
                console.error('[Stripe Cancel] Error deleting file notes:', result.error)
                return { type: 'file', count: 0, error: result.error }
              } else {
                notesDeleted.file = fileNotesToDelete.length
                console.log('[Stripe Cancel] Deleted file notes:', fileNotesToDelete.length)
                return { type: 'file', count: fileNotesToDelete.length, error: null }
              }
            })
        )
      }

      if (videoNotesToDelete.length > 0) {
        deletionPromises.push(
          userSupabase
            .from('video_notes')
            .delete()
            .in('id', videoNotesToDelete)
            .then(result => {
              if (result.error) {
                console.error('[Stripe Cancel] Error deleting video notes:', result.error)
                return { type: 'video', count: 0, error: result.error }
              } else {
                notesDeleted.video = videoNotesToDelete.length
                console.log('[Stripe Cancel] Deleted video notes:', videoNotesToDelete.length)
                return { type: 'video', count: videoNotesToDelete.length, error: null }
              }
            })
        )
      }

      if (uploadVideoNotesToDelete.length > 0) {
        deletionPromises.push(
          userSupabase
            .from('video_upload_notes')
            .delete()
            .in('id', uploadVideoNotesToDelete)
            .then(result => {
              if (result.error) {
                console.error('[Stripe Cancel] Error deleting video upload notes:', result.error)
                return { type: 'video_upload', count: 0, error: result.error }
              } else {
                notesDeleted.video_upload = uploadVideoNotesToDelete.length
                console.log('[Stripe Cancel] Deleted video upload notes:', uploadVideoNotesToDelete.length)
                return { type: 'video_upload', count: uploadVideoNotesToDelete.length, error: null }
              }
            })
        )
      }

      // Wait for all deletions to complete
      try {
        const deletionResults = await Promise.all(deletionPromises)
        console.log('[Stripe Cancel] Deletion results:', deletionResults)
        
        // Update counts based on actual deletion results
        deletionResults.forEach(result => {
          if (!result.error) {
            if (result.type === 'text') {
              notesDeleted.text = result.count
            } else if (result.type === 'file') {
              notesDeleted.file = result.count
            } else if (result.type === 'video') {
              notesDeleted.video = result.count
            } else if (result.type === 'video_upload') {
              notesDeleted.video_upload = result.count
            }
          }
        })

        notesDeleted.total = notesDeleted.text + notesDeleted.file + notesDeleted.video + notesDeleted.video_upload
        console.log('[Stripe Cancel] Final deletion statistics:', notesDeleted)

      } catch (deleteError) {
        console.error('[Stripe Cancel] Error during note deletion:', deleteError)
        // Continue with cancellation even if note deletion fails
      }
    }

    // Cancel the subscription in Stripe
    const stripe = getServerStripe()
    
    if (!stripe) {
      console.error('[Stripe Cancel] Failed to initialize Stripe')
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      )
    }
    
    let cancelledSubscription = null
    let stripeError = null
    
    // Try to retrieve and cancel the subscription in Stripe
    try {
      console.log('[Stripe Cancel] Attempting to retrieve subscription from Stripe...')
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      console.log('[Stripe Cancel] Retrieved subscription:', subscription.id, 'status:', subscription.status)
      
      // Check if subscription belongs to user (if metadata exists)
      if (subscription.metadata?.userId && subscription.metadata.userId !== user.id) {
        console.error('[Stripe Cancel] Subscription does not belong to user')
        return NextResponse.json(
          { error: 'Unauthorized subscription access' },
          { status: 403 }
        )
      }

      // Cancel the subscription immediately (not at period end)
      cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId)
      console.log('[Stripe Cancel] Subscription cancelled in Stripe:', {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status
      })
      
    } catch (error: any) {
      stripeError = error
      console.warn('[Stripe Cancel] Could not cancel subscription in Stripe:', error.message)
      
      // Check if subscription doesn't exist (404) or is already cancelled
      if (error.code === 'resource_missing' || error.statusCode === 404) {
        console.log('[Stripe Cancel] Subscription not found in Stripe, proceeding with database cleanup only')
      } else if (error.message?.includes('already canceled')) {
        console.log('[Stripe Cancel] Subscription already cancelled in Stripe, proceeding with database cleanup')
      } else {
        // For other Stripe errors, we still try to proceed with database cleanup
        console.warn('[Stripe Cancel] Stripe error occurred, but proceeding with database cleanup:', error.message)
      }
    }

    // Update user subscription to free plan in the database (always do this)
    console.log('[Stripe Cancel] Updating user subscription to free plan...')
    const { error: updateError } = await userSupabase
      .from('user_subscriptions')
      .update({
        plan_id: 'free',
        status: 'cancelled',
        cancel_at_period_end: false,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscriptionId)

    if (updateError) {
      console.error('[Stripe Cancel] Error updating subscription in database:', updateError)
      
      // If we couldn't update the database and also failed in Stripe, return error
      if (stripeError) {
        return NextResponse.json(
          { 
            error: 'Failed to cancel subscription both in Stripe and database',
            details: `Stripe: ${stripeError.message}, Database: ${updateError.message}`
          },
          { status: 500 }
        )
      }
    } else {
      console.log('[Stripe Cancel] Successfully updated subscription to free plan in database')
    }

    // Update the saved notes count in usage table
    try {
      const remainingNotesCount = Math.min(totalNotes, 3)
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      const { error: usageError } = await userSupabase
        .from('user_usage')
        .upsert({
          user_id: user.id,
          month_year: currentMonth,
          total_saved_notes: remainingNotesCount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,month_year'
        })

      if (usageError) {
        console.error('[Stripe Cancel] Error updating usage count:', usageError)
      } else {
        console.log('[Stripe Cancel] Updated saved notes count to:', remainingNotesCount)
      }
    } catch (usageUpdateError) {
      console.error('[Stripe Cancel] Error updating usage:', usageUpdateError)
    }

    // Prepare response
    const responseData: any = {
      success: true,
      message: 'Subscription cancelled and downgraded to free plan successfully',
      subscription: {
        id: cancelledSubscription?.id || subscriptionId,
        status: cancelledSubscription?.status || 'cancelled',
        newPlan: 'free'
      },
      notesDeleted: notesDeleted,
      remainingNotes: Math.min(totalNotes, 3)
    }

    // Add warning if Stripe cancellation failed but database was updated
    if (stripeError && !updateError) {
      responseData.warning = 'Subscription cancelled in database, but Stripe operation had issues. Your subscription should still be inactive.'
    }

    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error('[Stripe Cancel] Unexpected error cancelling subscription:', error)
    
    // Check if it's a Stripe error
    if (error.type) {
      return NextResponse.json(
        { 
          error: 'Stripe error: ' + error.message,
          type: error.type
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error.message
      },
      { status: 500 }
    )
  }
} 