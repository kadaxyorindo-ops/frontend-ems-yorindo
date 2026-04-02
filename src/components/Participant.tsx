import {Sidebar} from "./Sidebar";
import { Topbar } from "./Topbar";
import { useState } from "react";
import {Search} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";
import { Button } from "./ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.tsx"
import { Input } from "./ui/input.tsx";

const dummyParticipants = [
  { id: 1, Name: "Alice Johnson", Email: "alice.johnson@example.com", Company: "Tech Innovators Inc.", Industry: "Technology", Role: "HR Manager", City: "Jakarta", status: "Approved"},
  { id: 2, Name: "Bob Smith", Email: "bob.smith@example.com", Company: "Global Solutions Ltd.", Industry: "Finance", Role: "Financial Analyst", City: "Bandung", status: "Rejected" },
  { id: 3, Name: "Charlie Davis", Email: "charlie.davis@example.com", Company: "St. Helen Hospital", Industry: "Health", Role: "Nurse", City: "Surabaya", status: "Pending" },
  { id: 4, Name: "Diana Prince", Email: "diana.prince@example.com", Company: "Creative Minds", Industry: "Marketing", Role: "Marketing Specialist", City: "Medan", status: "Approved" },
  { id: 5, Name: "Ethan Hunt", Email: "ethan.hunt@example.com", Company: "SecureTech", Industry: "Security", Role: "Security Consultant", City: "Denpasar", status: "Rejected" },
  { id: 6, Name: "Fiona Gallagher", Email: "fiona.gallagher@example.com", Company: "Innovate Solutions", Industry: "Technology", Role: "Software Engineer", City: "Makassar", status: "Pending" },
  { id: 7, Name: "George Washington", Email: "george.washington@example.com", Company: "Patriot Ventures", Industry: "Politics", Role: "Political Advisor", City: "Balikpapan", status: "Approved" }
];

const eventName = "Global Innovation Summit 2026";
const approvedParticipants = dummyParticipants.filter(p => p.status === "Approved").length;
const totalParticipants = dummyParticipants.length;



export function Participants() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [industryFilter, setIndustryFilter] = useState("");

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const filteredParticipants = dummyParticipants.filter((p) => {
        const matchesSearch = searchQuery === "" || p.Name.toLowerCase().includes(searchQuery.toLowerCase()) || p.Company.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "" || statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();

        const matchesIndustry = industryFilter === "" || industryFilter === "all" || p.Industry.toLowerCase() === industryFilter.toLowerCase();
        
        return matchesSearch && matchesStatus && matchesIndustry;
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const totalPages = Math.ceil(filteredParticipants.length / rowsPerPage);
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = filteredParticipants.slice(indexOfFirstItem, indexOfLastItem);
    

    const toggleSelectAll = () => {
        if (selectedIds.length === currentItems.length && currentItems.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentItems.map((p) => p.id));
        }
    };

    const toggleSelectOne =(participant: any) =>{
       const id = participant.id;
        setSelectedIds(prev => {
        const isCurrentlySelected = prev.includes(id);
        
        if (isCurrentlySelected) {
            // Jika di-uncheck, hapus dari list ID
            const newIds = prev.filter(item => item !== id);
            
            // LOGIKA TAMBAHAN: Jika partisipan yang di-uncheck adalah yang sedang tampil di sidebar, tutup sidebarnya
            if (selectedParticipant?.id === id) {
                setSelectedParticipant(null);
            }
            return newIds;
        } else {
            // Jika di-check, tambahkan ke list dan tampilkan di sidebar
            setSelectedParticipant(participant);
            return [...prev, id];
        }
    });
    }

    // Mengambil daftar status unik (Approved, Pending, Rejected, dll)
    const uniqueStatuses = Array.from(new Set(dummyParticipants.map(p => p.status)));

    // Mengambil daftar industri unik (Technology, Finance, Health, dll)
    const uniqueIndustries = Array.from(new Set(dummyParticipants.map(p => p.Industry)));

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case "approved":
            return "bg-[#9cd3b2] text-[#002112] w-[100px]";
            case "pending":
            return "bg-[#fed174] text-[#785800] w-[100px]";
            case "rejected":
            return "bg-[#f8d7da] text-[#721c24] w-[100px]";
            default:
            return "bg-slate-50 text-slate-700 border-slate-200"; 
        }
    };

    return(
        <div className="min-h-screen flex bg-background relative overflow-hidden">
            <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)} 
            />

            <main className="flex-1 flex flex-col min-w-0 w-full">
                <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />
                <header className="flex flex-col p-4 md:px-8 md:pt-8 md:flex-row md:items-end justify-between">
                    <div className="flex flex-col justify-between items-start mb-6 pb-2 ml-10 mr-10 gap-3">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#001a4e]">
                            {eventName}
                        </h1>
                        {/* <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-[#fed174] text-[#785800] rounded-full text-xs font-bold tracking-wider uppercase">Active Tracking</span>
                            <span className="text-slate-500 text-sm font-medium">Updated 2 minutes ago</span>
                        </div> */}
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
                        <button 
                        className="bg-[#e8e7ef]/50 text-primary px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-xl transition-all active:scale-95"
                        >
                            Reject Selected
                        </button>
                        <button className="bg-[linear-gradient(135deg,#002d7a_0%,#15439f_100%)] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-xl transition-all active:scale-95">
                            Approve Selected
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6 px-10">
                    <div className={`transition-all duration-300 ${selectedParticipant ? "col-span-12 lg:col-span-9":"col-span-12"}`}>
                        <div className="bg-white p-6 rounded-2xl">
                            {/* filter and search */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                {/* search input */}
                                <div className="relative flex-1">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 z-10">
                                        <Search className="h-4 w-4" />
                                    </span>
                                    
                                    <Input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value); 
                                            setCurrentPage(1);
                                        }} 
                                        placeholder="Search participants or companies..."
                                        // Tambahkan pl-10 agar teks tidak menabrak ikon Search
                                        className="pl-10 bg-background border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-400 transition-all"
                                    />
                                </div>

                                {/* Filter Status */}
                                <Select 
                                value={statusFilter} 
                                onValueChange={(value) => {setStatusFilter(value === "all" ? "" : value);    setCurrentPage(1);}}
                                >
                                    <SelectTrigger className="w-[180px] rounded-xl border-slate-200 bg-background focus:ring-1 focus:ring-indigo-400 transition-all">
                                        <SelectValue placeholder="All Status"/>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                        <SelectItem value="all">All Status</SelectItem>
                                        {uniqueStatuses.map((status) => (
                                        <SelectItem key={status} value={status.toLowerCase()}>
                                            {status}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                {/* Filter Industry */}
                                {/* <Select
                                value={industryFilter}
                                onValueChange={(value) => {setIndustryFilter(value === "all" ? "" : value); setCurrentPage(1);}}
                                >
                                    <SelectTrigger className="w-[180px] rounded-xl border-slate-200 bg-background focus:ring-1 focus:ring-indigo-400 transition-all">
                                        <SelectValue placeholder="All Industries" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                        <SelectItem value="all">All Industries</SelectItem>
                                        {uniqueIndustries.map((industry) => (
                                        <SelectItem key={industry} value={industry.toLowerCase()}>
                                            {industry}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select> */}
                            </div>

                            {/* Tabel Participants */}
                            <div className="overflow-x-auto">
                                <Table className="w-full border border-sm">
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[50px] text-center">
                                                <input 
                                                type="checkbox" 
                                                checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
                                                onChange={toggleSelectAll}
                                                className="translate-y-[2px] h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </TableHead>
                                            <TableHead className="font-bold text-primary pl-10">Name</TableHead>
                                            <TableHead className="font-bold text-primary text-center">Company</TableHead>
                                            <TableHead className="font-bold text-primary text-center">Industry</TableHead>
                                            <TableHead className="font-bold text-primary text-center">Role</TableHead>
                                            <TableHead className="font-bold text-primary text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentItems.map((participant) => (
                                            <TableRow 
                                            key={participant.id}
                                            className={selectedIds.includes(participant.id) ? "bg-blue-50/50" : ""}
                                            >
                                                <TableCell className="w-[50px] text-center">
                                                    <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.includes(participant.id)}
                                                    onChange={() => {toggleSelectOne(participant)}}
                                                    className="translate-y-[2px] h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium pl-10">{participant.Name}</TableCell>
                                                <TableCell className="text-center">{participant.Company}</TableCell>
                                                <TableCell className="text-center">{participant.Industry}</TableCell>
                                                <TableCell className="text-center">{participant.Role}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center justify-center w-24 px-3 py-1 rounded-full text-[13px] font-bold tracking-tight ${getStatusStyles(participant.status)}`}>
                                                    {participant.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* pagination */}
                        <div className="flex items-center justify-between px-6 py-3 bg-background">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-500">Rows per page</p>
                                <Select
                                    value={rowsPerPage.toString()}
                                    onValueChange={(value) => {
                                    setRowsPerPage(Number(value));
                                    setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px] rounded-lg border-slate-200 bg-white">
                                    <SelectValue placeholder={rowsPerPage} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                    {[5, 10, 20, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="text-sm text-slate-500">
                                Showing <span className="font-medium text-slate-700"> {filteredParticipants.length > 0 ? indexOfFirstItem + 1 : 0} </span> to{" "}
                                <span className="font-medium text-slate-700">{Math.min(indexOfLastItem, filteredParticipants.length)}</span> of{" "} 
                                <span className="font-medium text-slate-700">{filteredParticipants.length}</span> results
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-medium text-slate-600">
                                    Page {currentPage} of {totalPages || 1}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={()=> setCurrentPage(prev => Math.max(prev-1, 1))}
                                        disabled={currentPage === 1}
                                        className="border border-md border-slate-500"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={()=> setCurrentPage(prev => Math.min(prev+1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="border border-md border-slate-500"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>  
                    </div>

                    <div className={`transition-all duration-300 ${selectedParticipant ? "block lg:block col-span-3":"hidden lg:hidden"}`}>
                        <div className="bg-white p-6 rounded-2xl relative overflow-hidden shadow-xl shadow-slate-300 h-full">
                            {selectedParticipant ? (
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <p className="text-[13px] font-bold text-slate-500">Participant Details</p>
                                    </div>
                                    <div className="items-center pt-3">
                                        <h2 className="text-3xl font-bold tracking-loose text-primary text-center">{selectedParticipant.Name}</h2>
                                        <h3 className="text-sm text-[#002D7A] text-center">{selectedParticipant.Email}</h3>
                                    </div>
                                    <div className="pt-5 flex justify-between text-left">
                                        <div>
                                            <div className="text-[11px] text-muted-foreground uppercase font-bold ">COmpany</div>
                                            <div className="text-sm font-bold text-primary">{selectedParticipant.Company}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] text-muted-foreground uppercase font-bold">Role</div>
                                            <div className="text-sm font-bold text-[#002D7A]">{selectedParticipant.Role}</div>
                                        </div>
                                    </div>
                                    <div className="pt-3 flex justify-between text-left">
                                        <div>
                                            <div className="text-[11px] text-muted-foreground uppercase font-bold ">Industry</div>
                                            <div className="text-sm font-bold text-primary">{selectedParticipant.Industry}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] text-muted-foreground uppercase font-bold">City</div>
                                            <div className="text-sm font-bold text-[#002D7A]">{selectedParticipant?.City}</div>
                                        </div>
                                    </div>
                                    <div className="pt-5 px-3 flex flex-row justify-around">
                                        <button 
                                        className="bg-[#DDDCE3] text-foreground px-6 py-2 rounded-lg font-bold text-sm hover:shadow-xl transition-all active:scale-95 w-[100px]"
                                        >
                                            Reject
                                        </button>
                                        <button className="bg-[#15439F] text-white px-6 py-2 rounded-lg font-bold text-sm hover:shadow-xl transition-all active:scale-95 w-[100px]">
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                        </div>
                    </div>
                </div>
                
            </main>
        </div>
    )
}
