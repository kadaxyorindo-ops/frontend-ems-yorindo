
const dummyParticipants = [
  { id: 1, Name: "Alice Johnson", Email: "alice.johnson@example.com", Company: "Tech Innovators Inc.", Industry: "Technology", Role: "HR Manager", status: "Approved"},
  { id: 2, Name: "Bob Smith", Email: "bob.smith@example.com", Company: "Global Solutions Ltd.", Industry: "Finance", Role: "Financial Analyst", status: "Rejected" },
  { id: 3, Name: "Charlie Davis", Email: "charlie.davis@example.com", Company: "St. Helen Hospital", Industry: "Health", Role: "Nurse", status: "Pending" }
];

const eventName = "Global Innovation Summit 2026";

export function Participants() {
    return(
        <div>
            <h1 className="text-3xl font-bold">{eventName}</h1>
            <h2 className="text-2xl font-semibold">Participants</h2>
        </div>
    )
}