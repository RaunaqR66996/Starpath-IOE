
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGovernance() {
    console.log("🌱 Seeding Governance Demo Data...");

    // 1. Seed Projects
    const projects = [
        {
            name: "NextGen Warehouse Automation",
            manager: "Sarah Conner",
            status: "IN_PROGRESS",
            budget: 5000000,
            startDate: new Date("2025-01-10"),
            endDate: new Date("2026-06-30"),
            description: "implementation of autonomous mobile robots (AMRs) in Texas facility."
        },
        {
            name: "ERP Migration Phase 2",
            manager: "", // INTENTIONAL COMPLIANCE GAP
            status: "PLANNED",
            budget: 1200000,
            startDate: new Date("2025-11-01"),
            description: "Migrating legacy finance modules to StarPath."
        },
        {
            name: "Sustainability Initiative Q1",
            manager: "David Chen",
            status: "IN_PROGRESS",
            budget: 75000,
            startDate: new Date("2026-01-05"),
            description: "Solar panel installation assessment."
        }
    ];

    for (const p of projects) {
        // Upsert by name to avoid dupes if run multiple times
        // Since name isn't unique in schema, we'll check first
        const exists = await prisma.project.findFirst({ where: { name: p.name } });
        if (!exists) {
            await prisma.project.create({ data: p });
            console.log(`+ Created Project: ${p.name}`);
        }
    }

    // 2. Seed Risks
    const risks = [
        {
            title: "Global Chip Shortage Impact",
            owner: "Procurement Lead",
            category: "Strategic",
            likelihood: "High",
            impact: "High",
            mitigation: "Buffer stock increased to 6 months for critical controllers."
        },
        {
            title: "Vendor Data Breach (Vendor-X)",
            owner: "", // INTENTIONAL COMPLIANCE GAP
            category: "Operational",
            likelihood: "Medium",
            impact: "High",
            mitigation: "" // INTENTIONAL COMPLIANCE GAP
        },
        {
            title: "Warehouse Labor Strike",
            owner: "Union Rep",
            category: "Operational",
            likelihood: "Low",
            impact: "High",
            mitigation: "Cross-training plan in place."
        },
        {
            title: "Regulatory Change in Carbon Tax",
            owner: "Legal Team",
            category: "Financial",
            likelihood: "High",
            impact: "Medium",
            mitigation: "" // INTENTIONAL GAP
        }
    ];

    for (const r of risks) {
        const exists = await prisma.risk.findFirst({ where: { title: r.title } });
        if (!exists) {
            await prisma.risk.create({ data: r });
            console.log(`+ Created Risk: ${r.title}`);
        }
    }

    console.log("✅ Seeding Complete.");
}

seedGovernance()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
