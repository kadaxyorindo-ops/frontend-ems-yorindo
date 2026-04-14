import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send } from "lucide-react";

const EmailAIPortal = () => {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar for AI Tools */}
      <aside className="w-80 border-r bg-white p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Assistant
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            What kind of email are we writing today?
          </p>
          <Textarea 
            placeholder="e.g. Write a follow-up email for a conference..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px]"
          />
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Generate Draft
          </Button>
        </div>
        
        <div className="mt-auto border-t pt-4">
          <p className="text-xs font-medium uppercase text-gray-400 mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">Fix Grammar</Button>
            <Button variant="outline" size="sm">Change Tone</Button>
          </div>
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 p-10">
        <div className="max-w-3xl mx-auto bg-white shadow-sm border rounded-lg h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <input 
              type="text" 
              placeholder="Subject Line" 
              className="w-full text-xl font-bold focus:outline-none"
            />
            <Button size="sm" variant="ghost"><Send className="w-4 h-4" /></Button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Rich Text Editor Component would go here */}
            <textarea 
              className="w-full h-full resize-none focus:outline-none leading-relaxed"
              placeholder="Start writing or let AI help..."
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmailAIPortal;