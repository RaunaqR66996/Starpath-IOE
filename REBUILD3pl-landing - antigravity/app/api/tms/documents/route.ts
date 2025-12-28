import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/tms/documents - Get all documents with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')
    const relatedEntityType = searchParams.get('relatedEntityType')
    const relatedEntityId = searchParams.get('relatedEntityId')
    const status = searchParams.get('status')

    const where: any = {}
    
    if (documentType) where.documentType = documentType
    if (relatedEntityType) where.relatedEntityType = relatedEntityType
    if (relatedEntityId) where.relatedEntityId = relatedEntityId
    if (status) where.status = status

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// POST /api/tms/documents - Create new document
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['documentType', 'documentNumber', 'title']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const document = await prisma.document.create({
      data: {
        organizationId: data.organizationId || 'default-org', // In real app, get from auth
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        title: data.title,
        description: data.description,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: data.status || 'DRAFT',
        isRequired: data.isRequired || false,
        nfcDeviceId: data.nfcDeviceId,
        digitalSignature: data.digitalSignature,
        signatureVerified: data.signatureVerified || false,
        metadata: data.metadata || {}
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}

// PUT /api/tms/documents/[id] - Update document
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    const data = await request.json()
    
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        title: data.title,
        description: data.description,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: data.status,
        isRequired: data.isRequired,
        nfcDeviceId: data.nfcDeviceId,
        digitalSignature: data.digitalSignature,
        signatureVerified: data.signatureVerified,
        metadata: data.metadata
      }
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

// DELETE /api/tms/documents/[id] - Delete document
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    await prisma.document.delete({
      where: { id: documentId }
    })

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}





