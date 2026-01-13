// Security Dashboard API for BlueShip Sync 3PL Platform
import { threatProtectionManager } from '@/lib/security/threat-protection';
import { auditComplianceManager } from '@/lib/security/audit-compliance';
import { zeroTrustManager } from '@/lib/security/zero-trust';
import { advancedAuthManager } from '@/lib/security/advanced-auth';
import { dataProtectionManager } from '@/lib/security/data-protection';

// Security dashboard data aggregation
export async function GET(request: Request) {
  try {
    // Get current timestamp for time-based queries
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Aggregate threat statistics
    const threatStats = threatProtectionManager.getThreatStatistics('day');
    const recentThreats = threatProtectionManager.getRecentThreatEvents(10);
    
    // Get authentication metrics
    const authMetrics = await getAuthenticationMetrics();
    
    // Get compliance data
    const complianceData = await getComplianceMetrics();
    
    // Get network security metrics
    const networkMetrics = await getNetworkSecurityMetrics();
    
    // Get active security incidents
    const activeIncidents = await getActiveSecurityIncidents();
    
    // Get compliance findings
    const complianceFindings = auditComplianceManager.getComplianceFindings('open');

    // Compile dashboard response
    const dashboardData = {
      timestamp: now.toISOString(),
      metrics: {
        threats: {
          total: threatStats.totalThreats,
          blocked: threatStats.threatsBlocked,
          active: threatStats.totalThreats - threatStats.threatsBlocked,
          severity: threatStats.threatsBySeverity,
        },
        authentication: authMetrics,
        compliance: complianceData,
        network: networkMetrics,
      },
      recentThreats: recentThreats.map(threat => ({
        id: threat.id,
        timestamp: threat.timestamp,
        type: threat.threatType,
        severity: threat.severity,
        sourceIP: threat.sourceIP,
        details: threat.details?.signature || threat.threatType,
        status: threat.type === 'blocked' ? 'blocked' : 'detected',
      })),
      activeIncidents,
      complianceFindings: complianceFindings.slice(0, 10).map(finding => ({
        id: finding.id,
        regulation: finding.regulation,
        type: finding.type,
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        status: finding.status,
        deadline: finding.deadline,
        responsible: finding.responsible,
      })),
      systemHealth: {
        uptime: getSystemUptime(),
        securityScore: calculateSecurityScore(threatStats, complianceData),
        lastUpdate: now.toISOString(),
      },
    };

    return Response.json(dashboardData);

  } catch (error) {
    console.error('Error generating security dashboard:', error);
    
    return Response.json(
      { 
        error: 'Failed to generate security dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for security actions (incident response, etc.)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'block_ip':
        await handleBlockIP(data);
        break;
      case 'create_incident':
        await handleCreateIncident(data);
        break;
      case 'update_incident':
        await handleUpdateIncident(data);
        break;
      case 'run_security_scan':
        await handleSecurityScan(data);
        break;
      default:
        return Response.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error handling security action:', error);
    
    return Response.json(
      { 
        error: 'Failed to execute security action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions for data aggregation

async function getAuthenticationMetrics() {
  // In production, query your user database
  const mockData = {
    successfulLogins: 1847,
    failedLogins: 23,
    activeSessions: 342,
    mfaEnabled: 87, // percentage
    passwordlessLogins: 156,
    suspiciousActivity: 5,
  };

  return mockData;
}

async function getComplianceMetrics() {
  // Generate compliance report
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  try {
    const gdprReport = await auditComplianceManager.generateGDPRReport(last30Days, now);
    const soc2Report = await auditComplianceManager.generateSOC2Report(last30Days, now);
    
    return {
      gdprRequests: gdprReport.summary.accessRequests + gdprReport.summary.accountDeletions,
      auditEvents: gdprReport.summary.totalEvents,
      complianceScore: gdprReport.status === 'compliant' ? 95 : 
                      gdprReport.status === 'needs_review' ? 78 : 45,
      lastAudit: last30Days.toLocaleDateString(),
      violations: gdprReport.findings.filter(f => f.type === 'violation').length,
      risks: gdprReport.findings.filter(f => f.type === 'risk').length,
    };
  } catch (error) {
    console.error('Error generating compliance metrics:', error);
    
    return {
      gdprRequests: 0,
      auditEvents: 0,
      complianceScore: 0,
      lastAudit: 'Error',
      violations: 0,
      risks: 0,
    };
  }
}

async function getNetworkSecurityMetrics() {
  const blockedIPs = threatProtectionManager.getBlockedIPs();
  const threatStats = threatProtectionManager.getThreatStatistics('day');
  
  return {
    blockedIPs: blockedIPs.length,
    rateLimitHits: threatStats.threatsByType.rate_limit || 0,
    geoBlocked: threatStats.threatsByType.geo_block || 0,
    cleanTraffic: 94, // percentage
    totalRequests: 125000,
    maliciousRequests: threatStats.totalThreats,
  };
}

async function getActiveSecurityIncidents() {
  // In production, query your incidents database
  const mockIncidents = [
    {
      id: 'INC-001',
      title: 'Suspicious Login Pattern Detected',
      description: 'Multiple failed login attempts from various geographic locations',
      severity: 'medium' as const,
      status: 'investigating' as const,
      assignedTo: 'security-team@blueship.com',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      affectedSystems: ['Authentication Service', 'User Management'],
      mitigation: [
        'Increased monitoring on affected accounts',
        'Implemented additional rate limiting',
        'Notified affected users via email',
      ],
      timeline: [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          action: 'Incident Created',
          user: 'Security Monitoring System',
          details: 'Automated detection of suspicious login pattern',
        },
        {
          timestamp: new Date(Date.now() - 90 * 60 * 1000),
          action: 'Investigation Started',
          user: 'security-team@blueship.com',
          details: 'Analysis of login logs and IP addresses',
        },
      ],
    },
    {
      id: 'INC-002',
      title: 'Potential SQL Injection Attempt',
      description: 'WAF detected SQL injection patterns in API requests',
      severity: 'high' as const,
      status: 'contained' as const,
      assignedTo: 'security-team@blueship.com',
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      affectedSystems: ['API Gateway', 'Database Layer'],
      mitigation: [
        'Blocked suspicious IP addresses',
        'Enhanced input validation deployed',
        'Database query monitoring increased',
      ],
      timeline: [
        {
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          action: 'Threat Detected',
          user: 'WAF System',
          details: 'SQL injection patterns detected in API requests',
        },
        {
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          action: 'Containment Measures Applied',
          user: 'security-team@blueship.com',
          details: 'IP blocks and enhanced validation deployed',
        },
      ],
    },
  ];

  return mockIncidents;
}

function getSystemUptime(): string {
  // In production, calculate actual system uptime
  const startTime = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
  const uptime = Date.now() - startTime.getTime();
  const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
  const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  return `${days}d ${hours}h`;
}

function calculateSecurityScore(threatStats: any, complianceData: any): number {
  let score = 100;
  
  // Deduct for active threats
  score -= threatStats.totalThreats * 2;
  
  // Deduct more for high/critical severity threats
  const highSeverityThreats = (threatStats.threatsBySeverity.high || 0) + 
                              (threatStats.threatsBySeverity.critical || 0);
  score -= highSeverityThreats * 5;
  
  // Deduct for compliance violations
  score -= (complianceData.violations || 0) * 10;
  score -= (complianceData.risks || 0) * 3;
  
  // Ensure score doesn't go below 0
  return Math.max(0, Math.min(100, score));
}

// Security action handlers

async function handleBlockIP(data: { ip: string; reason: string; duration?: number }) {
  await threatProtectionManager.blockIP(data.ip, data.reason, data.duration);
  
  // Log the action
  await auditComplianceManager.logAuditEvent({
    eventType: 'manual_ip_block',
    category: 'security',
    severity: 'warning',
    ipAddress: data.ip,
    action: 'block_ip',
    outcome: 'success',
    details: {
      reason: data.reason,
      duration: data.duration,
      method: 'manual',
    },
    dataClassification: 'internal',
  });
}

async function handleCreateIncident(data: {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
}) {
  const incidentId = `INC-${Date.now()}`;
  
  // In production, save to incidents database
  
  // Log the incident creation
  await auditComplianceManager.logAuditEvent({
    eventType: 'security_incident_created',
    category: 'security',
    severity: data.severity === 'critical' ? 'critical' : 'warning',
    ipAddress: 'system',
    resourceType: 'security_incident',
    resourceId: incidentId,
    action: 'create_incident',
    outcome: 'success',
    details: {
      title: data.title,
      severity: data.severity,
      affectedSystems: data.affectedSystems,
    },
    dataClassification: 'internal',
  });
  
  return { incidentId };
}

async function handleUpdateIncident(data: {
  incidentId: string;
  status?: string;
  assignedTo?: string;
  notes?: string;
}) {
  // In production, update incidents database
  
  // Log the incident update
  await auditComplianceManager.logAuditEvent({
    eventType: 'security_incident_updated',
    category: 'security',
    severity: 'info',
    ipAddress: 'system',
    resourceType: 'security_incident',
    resourceId: data.incidentId,
    action: 'update_incident',
    outcome: 'success',
    details: {
      status: data.status,
      assignedTo: data.assignedTo,
      notes: data.notes,
    },
    dataClassification: 'internal',
  });
}

async function handleSecurityScan(data: { scanType: string; scope?: string[] }) {
  const scanId = `SCAN-${Date.now()}`;
  
  // In production, initiate security scan
  
  // Log the scan initiation
  await auditComplianceManager.logAuditEvent({
    eventType: 'security_scan_initiated',
    category: 'security',
    severity: 'info',
    ipAddress: 'system',
    resourceType: 'security_scan',
    resourceId: scanId,
    action: 'initiate_scan',
    outcome: 'success',
    details: {
      scanType: data.scanType,
      scope: data.scope,
    },
    dataClassification: 'internal',
  });
  
  return { scanId };
} 