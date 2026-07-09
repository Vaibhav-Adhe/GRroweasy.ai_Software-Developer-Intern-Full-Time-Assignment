import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Search, RefreshCw, FileDown, Eye, ChevronDown, ChevronUp, Download, EyeOff } from "lucide-react";
import { CRMRecord, SkipReason, CRMStatus, DataSource } from "../types";
import Papa from "papaparse";

interface ResultStepProps {
  successful: CRMRecord[];
  skipped: SkipReason[];
  onReset: () => void;
}

export default function ResultStep({ successful, skipped, onReset }: ResultStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<CRMRecord | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);

  // Filter successful records
  const filteredRecords = successful.filter((record) => {
    const matchesSearch =
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.mobile_without_country_code.includes(searchTerm) ||
      record.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || record.crm_status === statusFilter;
    const matchesSource = sourceFilter === "all" || record.data_source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  // Export functions
  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(successful, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "groweasy_crm_import.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
  };

  const downloadCSV = () => {
    try {
      const csv = Papa.unparse(successful);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "groweasy_crm_import.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV export failure:", err);
    }
  };

  const getStatusBadge = (status: CRMStatus | '') => {
    switch (status) {
      case "GOOD_LEAD_FOLLOW_UP":
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Good Lead</span>;
      case "DID_NOT_CONNECT":
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Not Dialed</span>;
      case "BAD_LEAD":
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-100">Bad Lead</span>;
      case "SALE_DONE":
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-100">Sale Done</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-400 border border-slate-100">None</span>;
    }
  };

  const getSourceBadge = (source: DataSource | '') => {
    switch (source) {
      case "leads_on_demand":
        return <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-100 uppercase">Leads on Demand</span>;
      case "meridian_tower":
        return <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-100 uppercase">Meridian Tower</span>;
      case "eden_park":
        return <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-medium border border-teal-100 uppercase">Eden Park</span>;
      case "varah_swamy":
        return <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-700 text-[10px] font-medium border border-pink-100 uppercase">Varah Swamy</span>;
      case "sarjapur_plots":
        return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100 uppercase">Sarjapur Plots</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-400 text-[10px] font-medium border border-slate-100">None</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="result-step-container">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-sans font-semibold text-slate-800">
            Import Completed
          </h2>
          <p className="text-sm text-slate-500">
            GrowEasy CRM has successfully extracted and aligned lead records from your file.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-import-another"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-150"
          >
            <RefreshCw className="h-4 w-4" />
            Import Another CSV
          </button>
          <div className="relative inline-block text-left group">
            <button
              type="button"
              id="btn-export-dropdown"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-xl transition-all duration-150"
            >
              <FileDown className="h-4 w-4" />
              Export Records
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg hidden group-hover:block hover:block z-20">
              <div className="py-1">
                <button
                  type="button"
                  onClick={downloadCSV}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  Download CRM CSV
                </button>
                <button
                  type="button"
                  onClick={downloadJSON}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  Download CRM JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-mono uppercase font-semibold">Successfully Parsed</p>
            <p className="text-xl font-sans font-bold text-slate-800">{successful.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-mono uppercase font-semibold">Skipped Records</p>
            <p className="text-xl font-sans font-bold text-slate-800">{skipped.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <FileDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-mono uppercase font-semibold">Total Imported</p>
            <p className="text-xl font-sans font-bold text-slate-800">{successful.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
            <EyeOff className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-mono uppercase font-semibold">Total Skipped</p>
            <p className="text-xl font-sans font-bold text-slate-800">{skipped.length}</p>
          </div>
        </div>
      </div>

      {/* Main CRM View & Sidebar Detail Panel Layout */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Table & Controls Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search lead by Name, Email, Phone, Company, or City..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors bg-white cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="GOOD_LEAD_FOLLOW_UP">Good Lead</option>
                  <option value="DID_NOT_CONNECT">Not Dialed</option>
                  <option value="BAD_LEAD">Bad Lead</option>
                  <option value="SALE_DONE">Sale Done</option>
                </select>

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors bg-white cursor-pointer"
                >
                  <option value="all">All Sources</option>
                  <option value="leads_on_demand">Leads on Demand</option>
                  <option value="meridian_tower">Meridian Tower</option>
                  <option value="eden_park">Eden Park</option>
                  <option value="varah_swamy">Varah Swamy</option>
                  <option value="sarjapur_plots">Sarjapur Plots</option>
                </select>
              </div>
            </div>

            {/* Responsive Table of Mapped CRM records */}
            <div className="border border-slate-100 rounded-xl overflow-hidden flex flex-col max-h-[400px]">
              <div className="overflow-x-auto overflow-y-auto scrollbar-thin">
                <table className="w-full text-left border-collapse" id="crm-result-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                      <th className="px-4 py-3 text-slate-500 font-sans text-[11px] font-semibold whitespace-nowrap">Lead Name</th>
                      <th className="px-4 py-3 text-slate-500 font-sans text-[11px] font-semibold whitespace-nowrap">Email & Contact</th>
                      <th className="px-4 py-3 text-slate-500 font-sans text-[11px] font-semibold whitespace-nowrap">Date Created</th>
                      <th className="px-4 py-3 text-slate-500 font-sans text-[11px] font-semibold whitespace-nowrap">Company</th>
                      <th className="px-4 py-3 text-slate-500 font-sans text-[11px] font-semibold whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-slate-500 font-sans text-[11px] font-semibold whitespace-nowrap text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record, index) => (
                        <tr
                          key={index}
                          onClick={() => setSelectedRecord(record)}
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                            selectedRecord?.email === record.email ? "bg-emerald-50/40" : ""
                          }`}
                        >
                          <td className="px-4 py-2.5">
                            <p className="text-xs font-semibold text-slate-800">{record.name || "—"}</p>
                            <p className="text-[10px] text-slate-400">{record.city || record.country ? `${record.city}, ${record.country}`.replace(/^,\s*/, '') : "—"}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-xs text-slate-600">{record.email || "—"}</p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {record.country_code ? `${record.country_code} ` : ""}
                              {record.mobile_without_country_code || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">
                            {record.created_at ? new Date(record.created_at).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-600 font-sans">
                            {record.company || <span className="text-slate-300 italic">none</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            {getStatusBadge(record.crm_status)}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecord(record);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                          No matching records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Toggle Skipped Records Section */}
          {skipped.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSkipped(!showSkipped)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
                id="btn-toggle-skipped"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    Skipped Records Log ({skipped.length})
                  </span>
                </div>
                {showSkipped ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>

              {showSkipped && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                  <div className="border border-slate-100 bg-white rounded-xl overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-2 text-slate-500 font-sans text-[10px] uppercase font-semibold text-center w-12">Row #</th>
                          <th className="px-4 py-2 text-slate-500 font-sans text-[10px] uppercase font-semibold">Identified Details</th>
                          <th className="px-4 py-2 text-slate-500 font-sans text-[10px] uppercase font-semibold">Skip Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {skipped.map((skip, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/10">
                            <td className="px-4 py-2 text-slate-400 font-mono text-[11px] text-center">{skip.rowNumber}</td>
                            <td className="px-4 py-2">
                              <p className="text-[11px] font-semibold text-slate-800">
                                {skip.originalRow["Lead Name"] || skip.originalRow["Prospect"] || skip.originalRow["name"] || skip.originalRow["full_name"] || "—"}
                              </p>
                              <p className="text-[9px] text-slate-400 truncate max-w-[250px]">
                                {Object.entries(skip.originalRow).map(([k, v]) => `${k}:${v}`).join(" | ")}
                              </p>
                            </td>
                            <td className="px-4 py-2 text-[11px] text-amber-600 font-medium">{skip.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Lead Details Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">Lead Record Inspector</h3>
            {selectedRecord && (
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            )}
          </div>

          {selectedRecord ? (
            <div className="space-y-4 animate-fade-in" id="record-inspector-details">
              {/* Header card */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-xs font-bold text-slate-800">{selectedRecord.name || "—"}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedRecord.crm_status && getStatusBadge(selectedRecord.crm_status)}
                  {selectedRecord.data_source && getSourceBadge(selectedRecord.data_source)}
                </div>
              </div>

              {/* Data fields stack */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Email</span>
                  <span className="text-slate-700 break-all">{selectedRecord.email || <span className="text-slate-300 italic">none</span>}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mobile Number</span>
                  <span className="text-slate-700 font-mono">
                    {selectedRecord.country_code ? `${selectedRecord.country_code} ` : ""}
                    {selectedRecord.mobile_without_country_code || <span className="text-slate-300 italic">none</span>}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Company Info</span>
                  <span className="text-slate-700">{selectedRecord.company || <span className="text-slate-300 italic">none</span>}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Location Block</span>
                  <span className="text-slate-700">
                    {[selectedRecord.city, selectedRecord.state, selectedRecord.country].filter(Boolean).join(", ") || <span className="text-slate-300 italic">none</span>}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lead Owner</span>
                  <span className="text-slate-700">{selectedRecord.lead_owner || <span className="text-slate-300 italic">none</span>}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date Created</span>
                  <span className="text-slate-700 font-mono">
                    {selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : <span className="text-slate-300 italic">none</span>}
                  </span>
                </div>

                {selectedRecord.possession_time && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Possession Time</span>
                    <span className="text-slate-700">{selectedRecord.possession_time}</span>
                  </div>
                )}

                {selectedRecord.crm_note && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">CRM Note</span>
                    <div className="mt-1 p-2 bg-amber-50/50 border border-amber-100 rounded-lg text-slate-600 font-sans text-[11px] whitespace-pre-wrap leading-relaxed">
                      {selectedRecord.crm_note}
                    </div>
                  </div>
                )}

                {selectedRecord.description && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Additional Description</span>
                    <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 font-sans text-[11px] whitespace-pre-wrap leading-relaxed">
                      {selectedRecord.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a lead from the table list to inspect parsed details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
