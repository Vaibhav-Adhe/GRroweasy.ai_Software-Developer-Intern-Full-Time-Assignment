import React, { useState, useRef } from "react";
import { Upload, FileText, Download, Play, Info } from "lucide-react";
import { SAMPLE_DATASETS, generateCSVContent, SampleCSV } from "../data/samples";
import Papa from "papaparse";

interface UploadStepProps {
  onCSVParsed: (fileName: string, headers: string[], rows: Record<string, string>[]) => void;
  onError: (msg: string) => void;
}

export default function UploadStep({ onCSVParsed, onError }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handles raw CSV file processing
  const handleCSVFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      onError("Invalid file format. Please upload a valid CSV file (.csv).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        parseCSVText(file.name, text);
      }
    };
    reader.onerror = () => {
      onError("Failed to read the file. Please try again.");
    };
    reader.readAsText(file);
  };

  const parseCSVText = (fileName: string, text: string) => {
    try {
      const parseResult = Papa.parse(text, {
        header: true,
        skipEmptyLines: "greedy",
      });

      if (parseResult.errors.length > 0) {
        console.warn("CSV Parsing errors:", parseResult.errors);
      }

      const headers = parseResult.meta.fields || [];
      const rows = parseResult.data as Record<string, string>[];

      if (headers.length === 0 || rows.length === 0) {
        onError("The CSV file appears to be empty or formatted incorrectly.");
        return;
      }

      onCSVParsed(fileName, headers, rows);
    } catch (err: any) {
      onError(`Failed to parse CSV: ${err.message || err}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleCSVFile(e.target.files[0]);
    }
  };

  const handleLoadSample = (sample: SampleCSV) => {
    const csvContent = generateCSVContent(sample);
    parseCSVText(`${sample.id}_sample.csv`, csvContent);
  };

  const downloadSampleFile = (sample: SampleCSV) => {
    const csvContent = generateCSVContent(sample);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${sample.id}_template.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="upload-step-container">
      {/* Visual Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-3xl font-sans font-semibold tracking-tight text-slate-800">
          Import Leads via CSV
        </h2>
        <p className="text-slate-500 text-sm">
          Intelligently import, map, and clean CRM leads using our AI-powered mapper. Upload any custom layout, and watch our LLM convert it to GrowEasy CRM format.
        </p>
      </div>

      {/* Drop Zone Area */}
      <div
        id="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
            : "border-slate-300 hover:border-slate-400 bg-white hover:shadow-md"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
          id="csv-file-input"
        />
        <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
          <Upload className="h-10 w-10 animate-bounce" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium text-slate-700">
            {isDragging ? "Drop your CSV file here" : "Drag & Drop your CSV file here"}
          </p>
          <p className="text-slate-400 text-xs">
            or click to browse from your device
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-mono">
          <Info className="h-3 w-3" />
          Supported file: .csv (max 5MB)
        </div>
      </div>

      {/* Template Sandbox */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 font-sans flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            Don't have a file? Use our Sandbox Templates
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col justify-between space-y-3 hover:shadow transition-shadow duration-200"
              id={`sample-card-${sample.id}`}
            >
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-800 font-sans">
                  {sample.name}
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {sample.description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  id={`btn-load-${sample.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSample(sample);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors duration-150"
                >
                  <Play className="h-3 w-3" />
                  Load Sample
                </button>
                <button
                  type="button"
                  id={`btn-dl-${sample.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleFile(sample);
                  }}
                  className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150"
                  title="Download CSV file template"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
