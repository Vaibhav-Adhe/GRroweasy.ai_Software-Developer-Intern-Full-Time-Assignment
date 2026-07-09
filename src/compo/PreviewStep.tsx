import React from "react";
import { ArrowLeft, Check, AlertCircle, FileSpreadsheet } from "lucide-react";

interface PreviewStepProps {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
  onBack: () => void;
  onConfirm: () => void;
}

export default function PreviewStep({ fileName, headers, rows, onBack, onConfirm }: PreviewStepProps) {
  return (
    <div className="space-y-6 animate-fade-in" id="preview-step-container">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-sans font-semibold text-slate-800 flex items-center gap-2">
              Verify CSV Upload
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              File: {fileName} &bull; {rows.length} rows detected &bull; {headers.length} columns detected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-preview-back"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-150"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            id="btn-preview-confirm"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-xl transition-all duration-150"
          >
            <Check className="h-4 w-4" />
            Confirm & Start AI Mapping
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/70 border border-amber-100 rounded-2xl text-amber-800 text-xs">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Ready for AI processing</p>
          <p className="text-amber-600 leading-normal">
            No AI processing has occurred yet. Review the raw data in the table below. When you click <strong>Confirm & Start AI Mapping</strong>, our Gemini LLM will intelligently translate, map, and clean these headers and rows to GrowEasy CRM specifications in batches.
          </p>
        </div>
      </div>

      {/* Preview Table Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[450px]">
        {/* Table wrapper for sticky headers and scrollability */}
        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin">
          <table className="w-full text-left border-collapse" id="preview-raw-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <th className="px-4 py-3 text-slate-400 font-mono text-[10px] uppercase font-semibold text-center w-12 sticky left-0 bg-slate-50 border-r border-slate-100">
                  #
                </th>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-slate-600 font-sans text-xs uppercase font-semibold tracking-wider whitespace-nowrap min-w-[150px]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-slate-400 font-mono text-xs text-center sticky left-0 bg-white border-r border-slate-100 font-medium">
                    {index + 1}
                  </td>
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-4 py-2.5 text-slate-700 font-sans text-xs whitespace-nowrap overflow-hidden max-w-[220px] text-ellipsis"
                      title={row[header] || ""}
                    >
                      {row[header] === undefined || row[header] === null || row[header].trim() === "" ? (
                        <span className="text-slate-300 italic">empty</span>
                      ) : (
                        row[header]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
