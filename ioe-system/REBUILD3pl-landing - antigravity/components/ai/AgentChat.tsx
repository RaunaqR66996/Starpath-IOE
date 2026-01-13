'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, MessageSquare, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AgentChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 z-50 transition-all duration-300 hover:scale-110"
            >
                <Bot className="h-8 w-8 text-white" />
            </Button>
        );
    }

    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out",
            isMinimized ? "w-72" : "w-[400px] h-[600px]"
        )}>
            <Card className="h-full shadow-2xl border-blue-200 flex flex-col overflow-hidden bg-white/95 backdrop-blur-sm">
                <CardHeader className="bg-blue-600 text-white p-4 flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        <CardTitle className="text-sm font-medium">BlueShip Agent</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-blue-500/50"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-blue-500/50"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                {!isMinimized && (
                    <>
                        <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col">
                            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                                <div className="space-y-4 pb-4">
                                    {messages.length === 0 && (
                                        <div className="text-center text-gray-500 mt-10">
                                            <Bot className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">Hi! I'm your logistics AI.</p>
                                            <p className="text-xs mt-1">Ask me to check inventory, find orders, or create loads.</p>
                                        </div>
                                    )}

                                    {messages.map(m => (
                                        <div
                                            key={m.id}
                                            className={cn(
                                                "flex w-full",
                                                m.role === 'user' ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm",
                                                    m.role === 'user'
                                                        ? "bg-blue-600 text-white rounded-br-none"
                                                        : "bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200"
                                                )}
                                            >
                                                {m.content}
                                                {/* Render tool invocations if any (simplified) */}
                                                {m.toolInvocations?.map(tool => (
                                                    <div key={tool.toolCallId} className="mt-2 text-xs bg-black/10 rounded p-1 font-mono">
                                                        Using tool: {tool.toolName}...
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 rounded-lg px-3 py-2 rounded-bl-none flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                                                <span className="text-xs text-gray-400">Thinking...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="p-3 border-t bg-gray-50">
                                <form onSubmit={handleSubmit} className="flex gap-2">
                                    <Input
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder="Type a command..."
                                        className="flex-1 bg-white"
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}
