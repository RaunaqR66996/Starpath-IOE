# ERP Integration Module Guide

## Overview
The ERP Integration Module allows StarPath to seamlessly connect with external manufacturing facility systems. This "Universal Bridge" is designed to be plug-and-play during on-site deployments.

## Supported Providers
1. **ERPNext (Frappe)** - *Primary Support*
   - Uses REST API v2
   - Supports Document Linking & Webhooks
2. **SAP S/4HANA** - *Roadmap*
3. **Oracle NetSuite** - *Roadmap*
4. **Microsoft Dynamics 365** - *Roadmap*

## Deployment Workflow
To integrate with a new facility:

1. **Access the Interface**: Navigate to `/integration`.
2. **Configuration**:
   - **Host URL**: The public or intranet URL of the ERP instance (e.g., `https://erp.factory.com`).
   - **Credentials**: Generate an API Key and Secret in the ERP's user settings.
3. **Handshake**:
   - Click "Initiate Handshake".
   - The system will attempt to `PING` the host and validate credentials.
   - Upon success, it fetches the available `DocType` schema.

## Technical Details
- **Component**: `components/integration/ERPConnector.tsx`
- **Logic**: `lib/erp/client.ts`
- **Security**: Credentials are never stored in plain text (in a real production env, use Vault/Env vars).

## Roadmap for Phase 2
- Real-time Webhook listener setup.
- Field Mapping UI (Drag & Drop schema matching).
- Bi-directional inventory sync.
