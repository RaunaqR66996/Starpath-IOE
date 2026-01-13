import { NextResponse } from 'next/server'

export interface ApiErrorPayload {
  error: string
  details?: unknown
}

export function successResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      data
    },
    init
  )
}

export function errorResponse(error: string | ApiErrorPayload, status = 500, details?: unknown) {
  if (typeof error === 'string') {
    return NextResponse.json(
      {
        success: false,
        error,
        details
      },
      { status }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: error.error,
      details: error.details ?? details
    },
    { status }
  )
}

