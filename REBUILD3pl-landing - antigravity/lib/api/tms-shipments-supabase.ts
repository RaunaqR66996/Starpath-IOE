// TMS Shipments API - Supabase Direct Implementation
// Simplified but robust implementation using Supabase directly

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/shipments - List shipments with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const mode = searchParams.get('mode')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('shipments')
      .select(`
        *,
        shipment_stops (
          id,
          sequence,
          type,
          name,
          city,
          state,
          zip_code,
          status,
          scheduled_date,
          actual_date
        ),
        shipment_pieces (
          id,
          sku,
          description,
          quantity,
          weight,
          length,
          width,
          height,
          unit_value,
          total_value
        ),
        tracking_events (
          id,
          type,
          timestamp,
          location,
          description
        )
      `)
      .eq('organization_id', 'default-org')
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (mode) {
      query = query.eq('mode', mode)
    }

    if (search) {
      query = query.or(`shipment_number.ilike.%${search}%,carrier_name.ilike.%${search}%,tracking_number.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: shipments, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'FETCH_SHIPMENTS_ERROR',
            message: 'Failed to fetch shipments',
            details: error.message
          }
        },
        { status: 500 }
      )
    }

    // Transform data to match expected format
    const transformedShipments = (shipments || []).map(shipment => ({
      ...shipment,
      stops: shipment.shipment_stops || [],
      pieces: shipment.shipment_pieces || [],
      events: shipment.tracking_events || []
    }))

    return NextResponse.json({
      success: true,
      data: transformedShipments,
      meta: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    })
  } catch (error) {
    console.error('Error fetching shipments:', error)
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/shipments - Create new shipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Basic validation
    if (!body.stops || body.stops.length < 2) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least 2 stops required (pickup and delivery)'
          }
        },
        { status: 400 }
      )
    }

    if (!body.pieces || body.pieces.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one piece is required'
          }
        },
        { status: 400 }
      )
    }

    // Generate shipment number
    const { data: lastShipment } = await supabase
      .from('shipments')
      .select('shipment_number')
      .eq('organization_id', 'default-org')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const shipmentCount = lastShipment 
      ? parseInt(lastShipment.shipment_number.split('-').pop() || '0') + 1 
      : 1
    const shipmentNumber = `SHIP-${new Date().getFullYear()}-${String(shipmentCount).padStart(6, '0')}`

    // Calculate totals
    const totalWeight = body.pieces.reduce((sum: number, piece: any) => sum + (piece.weight || 0), 0)
    const totalValue = body.pieces.reduce((sum: number, piece: any) => sum + (piece.totalValue || 0), 0)

    // Create shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        organization_id: 'default-org',
        shipment_number: shipmentNumber,
        status: 'CREATED',
        mode: body.mode || 'PARCEL',
        consolidation: body.consolidation || 'NONE',
        total_weight: body.totalWeight || totalWeight,
        total_value: body.totalValue || totalValue,
        declared_value: body.declaredValue,
        is_hazardous: body.isHazardous || false,
        requires_signature: body.requiresSignature || false,
        is_cod: body.isCod || false,
        cod_amount: body.codAmount,
        notes: body.notes,
        metadata: body.metadata || {}
      })
      .select()
      .single()

    if (shipmentError) {
      console.error('Supabase error creating shipment:', shipmentError)
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'CREATE_SHIPMENT_ERROR',
            message: 'Failed to create shipment',
            details: shipmentError.message
          }
        },
        { status: 500 }
      )
    }

    // Create stops
    const stopsData = body.stops.map((stop: any) => ({
      shipment_id: shipment.id,
      sequence: stop.sequence,
      type: stop.type,
      name: stop.name,
      company: stop.company,
      address_line1: stop.addressLine1,
      address_line2: stop.addressLine2,
      city: stop.city,
      state: stop.state,
      zip_code: stop.zipCode,
      country: stop.country || 'USA',
      latitude: stop.latitude,
      longitude: stop.longitude,
      contact_name: stop.contactName,
      contact_phone: stop.contactPhone,
      contact_email: stop.contactEmail,
      scheduled_date: stop.scheduledDate,
      time_window_start: stop.timeWindowStart,
      time_window_end: stop.timeWindowEnd,
      access_instructions: stop.accessInstructions,
      dock_requirements: stop.dockRequirements,
      equipment_needed: stop.equipmentNeeded || [],
      status: 'PENDING'
    }))

    const { error: stopsError } = await supabase
      .from('shipment_stops')
      .insert(stopsData)

    if (stopsError) {
      console.error('Supabase error creating stops:', stopsError)
      // Continue anyway - shipment was created
    }

    // Create pieces
    const piecesData = body.pieces.map((piece: any) => ({
      shipment_id: shipment.id,
      sku: piece.sku,
      description: piece.description,
      quantity: piece.quantity,
      weight: piece.weight,
      length: piece.length,
      width: piece.width,
      height: piece.height,
      volume: piece.volume,
      orientation: piece.orientation || 'NORMAL',
      stackable: piece.stackable || 'YES',
      stop_sequence: piece.stopSequence || 1,
      unit_value: piece.unitValue,
      total_value: piece.totalValue
    }))

    const { error: piecesError } = await supabase
      .from('shipment_pieces')
      .insert(piecesData)

    if (piecesError) {
      console.error('Supabase error creating pieces:', piecesError)
      // Continue anyway - shipment was created
    }

    // Create initial tracking event
    const { error: eventError } = await supabase
      .from('tracking_events')
      .insert({
        shipment_id: shipment.id,
        type: 'CREATED',
        description: 'Shipment created',
        metadata: { source: 'api' }
      })

    if (eventError) {
      console.error('Supabase error creating tracking event:', eventError)
      // Continue anyway - shipment was created
    }

    // Return created shipment with relations
    const { data: createdShipment } = await supabase
      .from('shipments')
      .select(`
        *,
        shipment_stops (
          id,
          sequence,
          type,
          name,
          city,
          state,
          zip_code,
          status,
          scheduled_date,
          actual_date
        ),
        shipment_pieces (
          id,
          sku,
          description,
          quantity,
          weight,
          length,
          width,
          height,
          unit_value,
          total_value
        ),
        tracking_events (
          id,
          type,
          timestamp,
          location,
          description
        )
      `)
      .eq('id', shipment.id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        ...createdShipment,
        stops: createdShipment?.shipment_stops || [],
        pieces: createdShipment?.shipment_pieces || [],
        events: createdShipment?.tracking_events || []
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      },
      { status: 500 }
    )
  }
}












