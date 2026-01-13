import { NextResponse } from 'next/server';
import { getTasks, createTask } from '@/lib/data-service';
import { TaskStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TaskStatus | undefined;

    const tasks = await getTasks(status);
    return NextResponse.json(tasks);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const task = await createTask(body);
        if (!task) {
            return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
        }
        return NextResponse.json(task);
    } catch (e) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
