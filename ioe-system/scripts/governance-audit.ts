
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {
    console.log("\n🔍 INITIATING GOVERNANCE AUDIT SCAN...\n");

    // 1. Project Governance Audit
    const projects = await prisma.project.findMany();
    const headlessProjects = projects.filter(p => !p.manager || p.manager.trim() === '');
    const budgetProjects = projects.filter(p => p.budget > 1000000); // High Value

    console.log(`📋 AUDITING PROJECTS (${projects.length} Active Records)`);
    console.log(`------------------------------------------------`);

    if (headlessProjects.length > 0) {
        console.log(`❌ CRITICAL: ${headlessProjects.length} Projects missing designated Manager!`);
        headlessProjects.forEach(p => console.log(`   - [${p.status}] ${p.name} (Budget: $${p.budget.toLocaleString()})`));
    } else {
        console.log(`✅ All projects have assigned managers.`);
    }

    if (budgetProjects.length > 0) {
        console.log(`ℹ️  High Value Projects Monitoring (> $1M): ${budgetProjects.length}`);
    }

    console.log("");

    // 2. Risk & Compliance Audit
    const risks = await prisma.risk.findMany();
    const highRisks = risks.filter(r => r.impact === 'High' || r.impact === 'Critical');
    const unmitigated = highRisks.filter(r => !r.mitigation || r.mitigation.trim() === '');
    const ownerless = risks.filter(r => !r.owner || r.owner.trim() === '');

    console.log(`🛡️  AUDITING RISK REGISTER (${risks.length} Active Entires)`);
    console.log(`------------------------------------------------`);

    console.log(`📊 Risk Profile: ${highRisks.length} High Impact Risks detected.`);

    if (unmitigated.length > 0) {
        console.log(`❌ ALERT: ${unmitigated.length} HIGH IMPACT risks have NO mitigation strategy!`);
        unmitigated.forEach(r => console.log(`   - [${r.category}] ${r.title}`));
    } else {
        console.log(`✅ All high-impact risks have mitigation strategies.`);
    }

    if (ownerless.length > 0) {
        console.log(`⚠️  WARNING: ${ownerless.length} risks have no assigned owner.`);
        ownerless.forEach(r => console.log(`   - ${r.title}`));
    }

    console.log("\n------------------------------------------------");
    console.log("🏁 AUDIT COMPLETE.");
}

runAudit()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
