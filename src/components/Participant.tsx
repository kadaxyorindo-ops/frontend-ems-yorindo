import {Sidebar} from "./Sidebar";
import { Topbar } from "./Topbar";
import { useState } from "react";

const dummyParticipants = [
  { id: 1, Name: "Alice Johnson", Email: "alice.johnson@example.com", Company: "Tech Innovators Inc.", Industry: "Technology", Role: "HR Manager", status: "Approved"},
  { id: 2, Name: "Bob Smith", Email: "bob.smith@example.com", Company: "Global Solutions Ltd.", Industry: "Finance", Role: "Financial Analyst", status: "Rejected" },
  { id: 3, Name: "Charlie Davis", Email: "charlie.davis@example.com", Company: "St. Helen Hospital", Industry: "Health", Role: "Nurse", status: "Pending" }
];

const eventName = "Global Innovation Summit 2026";
const approvedParticipants = dummyParticipants.filter(p => p.status === "Approved").length;
const totalParticipants = dummyParticipants.length;



export function Participants() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    return(
        <div className="min-h-screen flex bg-background relative overflow-hidden">
            <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)} 
            />

            <main className="flex-1 flex flex-col min-w-0 w-full">
                <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />
                <header className="flex flex-col p-4 md:p-8 md:flex-row md:items-end justify-between">
                    <div className="flex flex-col justify-between items-start mb-6 pb-2 ml-10 mr-10 gap-3">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#001a4e]">
                            {eventName}
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-[#fed174] text-[#785800] rounded-full text-xs font-bold tracking-wider uppercase">Active Tracking</span>
                            <span className="text-slate-500 text-sm font-medium">Updated 2 minutes ago</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-6 pb-2 ml-10 mr-10">
                        <div className="text-right mr-4">
                            <div className="text-2xl font-bold text-primary">
                                {approvedParticipants}
                                <span className="text-sm font-normal text-slate-400">
                                    / {totalParticipants}
                                </span>
                            </div>
                            <div className="text-xs font-medium text-[#72a688] bg-[#9cd3b2]/20 px-2 py-0.5 rounded">
                                Approved Participants
                            </div>
                        </div>
                        <button className="bg-[#e8e7ef] text-primary px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-xl transition-colors active:scale-95">
                            Reject Selected
                        </button>
                        <button className="bg-[linear-gradient(135deg,#002d7a_0%,#15439f_100%)] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-xl transition-all active:scale-95">
                            Approve Selected
                        </button>
                    </div>
                </header>
            </main>
        </div>
    )
}