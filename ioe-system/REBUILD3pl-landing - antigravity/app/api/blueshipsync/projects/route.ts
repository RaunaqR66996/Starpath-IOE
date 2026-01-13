import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/blueshipsync/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const client = searchParams.get("client")

    let whereClause: any = {}

    if (status) {
      whereClause.status = status
    }

    if (client) {
      whereClause.client = {
        contains: client,
        mode: "insensitive"
      }
    }

    // Mock projects data
    const projects = [
      {
        id: 'project-1',
        name: 'Sample Project 1',
        client: 'Sample Client 1',
        facilitySize: 1000,
        location: 'Sample Location 1',
        status: 'active',
        priority: 'high',
        progress: 75,
        accuracy: 95,
        phases: [],
        deliverables: [],
        team: [],
        actualCost: 50000,
        mappingData: [],
        wmsIntegrations: [],
        createdAt: new Date()
      }
    ]

    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

// POST /api/blueshipsync/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      client,
      facilitySize,
      location,
      priority,
      budget,
      estimatedCompletion,
      team
    } = body

    // Validate required fields
    if (!name || !client || !facilitySize || !location) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Mock project creation
    const project = {
      id: 'project-' + Date.now(),
      name,
      client,
      facilitySize,
      location,
      priority: priority || "medium",
      budget: budget || 0,
      estimatedCompletion: new Date(estimatedCompletion),
      status: "planning",
      progress: 0,
      accuracy: 0,
      phases: {
        planning: false,
        lidar: false,
        visual: false,
        fusion: false,
        wms: false,
        delivery: false
      },
      deliverables: {
        pointCloud: false,
        texturedMesh: false,
        cadDrawings: false,
        wmsConfig: false,
        analyticsReport: false
      },
      team: team || {
        projectManager: "",
        droneOperator: "",
        dataProcessor: "",
        wmsSpecialist: ""
      },
      createdAt: new Date()
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create project" },
      { status: 500 }
    )
  }
}

