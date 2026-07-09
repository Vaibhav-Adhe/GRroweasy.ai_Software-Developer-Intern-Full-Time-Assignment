export interface SampleCSV {
  id: string;
  name: string;
  description: string;
  headers: string[];
  rows: string[][];
}

export const SAMPLE_DATASETS: SampleCSV[] = [
  {
    id: "facebook_leads",
    name: "Facebook Leads Export (Messy)",
    description: "Contains mismatched columns like 'full_name', 'phone_number', 'created_time', and custom status codes.",
    headers: ["created_time", "full_name", "email", "phone_number", "company_name", "city_region", "campaign_source", "current_status"],
    rows: [
      ["2026-05-13 14:20:48", "John Doe", "john.doe@example.com", "+91 9876543210", "GrowEasy", "Mumbai", "leads_on_demand", "GOOD_LEAD_FOLLOW_UP"],
      ["2026-05-13 14:25:30", "Sarah Johnson", "sarah.johnson@example.com", "+919876543211", "Tech Solutions", "Bangalore", "meridian_tower", "DID_NOT_CONNECT"],
      ["2026-05-13 14:30:15", "Rajesh Patel", "rajesh.patel@example.com", "+91 9876543212", "Startup Inc", "Delhi", "eden_park", "BAD_LEAD"],
      ["2026-05-13 14:35:22", "Priya Singh", "priya.singh@example.com", "+919876543213", "Enterprise Corp", "Pune", "sarjapur_plots", "SALE_DONE"],
      ["2026-05-13 14:40:00", "Anonymous User", "", "", "Hidden Inc", "Chennai", "eden_park", "DID_NOT_CONNECT"], // Should be skipped (neither email nor mobile)
      ["2026-05-13 14:45:10", "Aravind Swamy", "aravind@swamy.com", "+91 9876543215", "", "Hyderabad", "varah_swamy", "GOOD_LEAD_FOLLOW_UP"],
      ["2026-05-13 14:50:00", "Missing Contact Info", "", "   ", "No Contact Ltd", "Kolkata", "leads_on_demand", "BAD_LEAD"] // Should be skipped (neither email nor mobile)
    ]
  },
  {
    id: "marketing_agency",
    name: "Marketing Agency Spreadsheet",
    description: "Uses highly ambiguous headers like 'Prospect', 'Mail', 'Dialing Code', 'Phone No', 'Source_Value'.",
    headers: ["Date", "Prospect", "Mail", "Dialing Code", "Phone No", "Organization", "Location", "Source_Value", "Current Status", "Remarks"],
    rows: [
      ["05/14/2026", "Amit Kumar", "amit@marketing.co", "+91", "9811223344", "Kumar & Co", "Noida", "leads_on_demand", "Interested - follow up", "Wants a demo next Tuesday at 3 PM"],
      ["05/14/2026", "Vikram Rathore", "vikram@rathore.in", "+91", "9822334455", "Rathore Logistics", "Gurgaon", "meridian_tower", "Unreachable", "Tried twice, switched off"],
      ["05/14/2026", "Nisha Sharma", "", "+91", "9833445566", "", "Chandigarh", "eden_park", "Closed Deal", "Paid advance, onboarding scheduled"],
      ["05/14/2026", "Stray Record", "", "", "", "Stray LLC", "Mumbai", "sarjapur_plots", "Spam", "No details provided"], // Should be skipped
      ["05/14/2026", "Rohan Das", "rohan@das.net; rohan.backup@das.net", "+91", "9844556677; 9844556688", "Das Ventures", "Bhubaneswar", "varah_swamy", "Not Interested", "Extra emails: rohan.backup@das.net, Extra phones: 9844556688"] // Multiple emails/phones
    ]
  },
  {
    id: "manually_created",
    name: "Manually Created Excel Sheet",
    description: "Has missing columns, wrong casing, and empty fields representing a highly realistic custom layout.",
    headers: ["Lead Name", "Email Address", "Phone", "Employer", "City/Town", "Campaign", "Status Code", "Possession Info", "Comments"],
    rows: [
      ["Karan Johar", "karan@dharmaprod.com", "9855667788", "Dharma Productions", "Mumbai", "sarjapur_plots", "GOOD_LEAD_FOLLOW_UP", "Ready in 6 months", "Highly interested in premium plots"],
      ["Siddharth Malhotra", "sid@malhotra.com", "9866778899", "Malhotra Films", "Delhi", "eden_park", "SALE_DONE", "Immediate possession", "Deal closed, documents signed"],
      ["Kiara Advani", "kiara@advani.com", "", "", "Mumbai", "", "GOOD_LEAD_FOLLOW_UP", "By December 2026", "Needs phone number later"],
      ["Empty Row Info", "", "", "Unknown Corp", "Pune", "leads_on_demand", "", "", "Will skip this lead"] // Should be skipped
    ]
  }
];

export function generateCSVContent(sample: SampleCSV): string {
  const headerLine = sample.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",");
  const rowsLines = sample.rows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
  );
  return [headerLine, ...rowsLines].join("\n");
}
