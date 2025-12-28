
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { url, apiKey, apiSecret } = await req.json();

        if (!url) {
            return NextResponse.json({ success: false, message: 'URL is required' }, { status: 400 });
        }

        // Ensure URL has protocol
        let targetUrl = url;
        if (!targetUrl.startsWith('http')) {
            targetUrl = `https://${targetUrl}`;
        }

        // Clean trailing slash
        targetUrl = targetUrl.replace(/\/$/, '');

        console.log(`[ERPNext] Verifying connection to: ${targetUrl}`);

        // Call Frappe Auth Endpoint
        // This is the standard "Who am I" endpoint in ERPNext/Frappe
        const authUrl = `${targetUrl}/api/method/frappe.auth.get_logged_user`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (apiKey && apiSecret) {
            headers['Authorization'] = `token ${apiKey}:${apiSecret}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        try {
            const response = await fetch(authUrl, {
                method: 'GET',
                headers,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                // If 401/403, implementation exists but auth failed
                if (response.status === 401 || response.status === 403) {
                    return NextResponse.json({
                        success: false,
                        message: 'Connection effective, but authentication failed. Check API Key/Secret.'
                    });
                }
                if (response.status === 404) {
                    return NextResponse.json({
                        success: false,
                        message: 'Host reachable, but ERPNext API not found at this URL.'
                    });
                }
                return NextResponse.json({
                    success: false,
                    message: `Host returned error: ${response.status} ${response.statusText}`
                });
            }

            const data = await response.json();
            return NextResponse.json({
                success: true,
                message: 'Connection Verified',
                user: data.message
            });

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            return NextResponse.json({
                success: false,
                message: `Network Error: ${fetchError.message || 'Host Unreachable'}`
            });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
