# StarPath IOE

StarPath IOE (Integrated Operations Environment) is an operating system designed to unify logistics operations. It replaces fragmented siloed systems (ERP, WMS, TMS) with a unified data environment.

![StarPath Interface](starpath_interface.png)

## Overview

Traditional supply chain management creates information lag where ERPs, WMS, and TMS operate disconnected. StarPath creates a real-time data fabric for the operation.

### Key Capabilities

**1. 3D Digital Twin**
Provides a high-fidelity 3D visualization of the facility.
- **Spatial Intelligence**: Real-time warehouse heatmaps and pick-path optimization.
- **Hardware Agnostic**: Integration with AMR (Autonomous Mobile Robots) and LiDAR telemetry.
- **Asset Health**: Predictive maintenance tracking.

**2. Enterprise TMS & Financial Controller**
High-fidelity logistics and resource management suite.
- **Dispatcher Workbench**: Integrated Load Planner with dock scheduling and driver availability.
- **Continuous Audit**: Automated freight bill rating and cost estimation for every shipment.
- **ESG Framework**: Architecture for tracking CO2 impact and renewable energy usage metrics.

## Core Functionality

*   **Real-Time Inventory Tracking**: Monitor stock levels, status (Available/Blocked), and bin locations across multiple facilities.
*   **Logistics & Dispatch**: Plan shipments, assign drivers, view route optimizations, and manage dock schedules.
*   **Supply Chain Visualization**: Visualize global network nodes and in-transit shipments on an interactive map.
*   **Hardware Telemetry Stream**: Ingest and display live sensor data from warehouse robotics and forklifts.
*   **Financial Estimation**: Calculate estimated shipment costs and audit freight bills against rates.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Visualization**: Three.js, React Three Fiber, Mapbox GL
- **Backend**: Prisma ORM, Supabase/PostgreSQL
- **State Management**: Zustand
- **Animations**: Framer Motion



## License

This project is proprietary software. All rights reserved.
