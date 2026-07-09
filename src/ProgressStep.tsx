import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";
import { CRMRecord, SkipReason } from "../types";

interface ProgressStepProps {
  rows: Record<string, string>[];
  batchSize?: number;
  onCompleted: (successful: CRMRecord[], skipped: SkipReason[]) => void;
  onCancel: () => void;
}

interface BatchState {
  index: number;
  status: "idle" | "processing" | "completed" | "failed";
  error?: string;
  successfulCount: number;
  skippedCount: number;
}

export default function ProgressStep({ rows, batchSize = 10, onCompleted, onCancel }: ProgressStepProps) {
  const [batches, setBatches] = useState<BatchState[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [aggregatedSuccessful, setAggregatedSuccessful] = useState<CRMRecord[]>([]);
  const [aggregatedSkipped, setAggregatedSkipped] = useState<SkipReason[]>([]);
  const [activeMessage, setActiveMessage] = useState("Initializing importer...");

  const totalBatches = Math.ceil(rows.length / batchSize);

  // Initialize batch states
  useEffect(() => {
    const initialBatches: BatchState[] = [];
    for (let i = 0; i < totalBatches; i++) {
      initialBatches.push({
        index: i,
        status: "idle",
        successfulCount: 0,
        skippedCount: 0,
      });
    }
    setBatches(initialBatches);
    setCurrentBatchIndex(0);
  }, [rows, batchSize, totalBatches]);

  // Run batch process trigger
  useEffect(() => {
    if (batches.length === 0) return;
    if (currentBatchIndex >= totalBatches) {
      // Completed all batches!
      onCompleted(aggregatedSuccessful, aggregatedSkipped);
      return;
    }

    const currentBatch = batches[currentBatchIndex];
    if (currentBatch.status === "idle") {
      processBatch(currentBatchIndex);
    }
  }, [batches, currentBatchIndex, totalBatches]);

  const processBatch = async (index: number) => {
    // Update batch status to processing
    setBatches((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status: "processing" };
      return copy;
    });

    const startIdx = index * batchSize;
    const endIdx = Math.min(startIdx + batchSize, rows.length);
    const chunk = rows.slice(startIdx, endIdx);

    setActiveMessage(`AI Mapping rows ${startIdx + 1} to ${endIdx} of ${rows.length}...`);

    try {
      const response = await fetch("/api/import-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawRows: chunk,
          startRowIndex: startIdx + 1,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      setAggregatedSuccessful((prev) => [...prev, ...data.successful]);
      setAggregatedSkipped((prev) => [...prev, ...data.skipped]);

      setBatches((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          status: "completed",
          successfulCount: data.successful.length,
          skippedCount: data.skipped.length,
        };
        return copy;
      });

      // Move to the next batch
      setCurrentBatchIndex((prev) => prev + 1);
    } catch (err: any) {
      console.error(`Failed to process batch ${index + 1}:`, err);
      setBatches((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          status: "failed",
          error: err.message || "Unknown error occurred.",
        };
        return copy;
      });
      setActiveMessage(`Error occurred processing batch ${index + 1}.`);
    }
  };

  const handleRetryCurrentBatch = () => {
    setBatches((prev) => {
      const copy = [...prev];
      copy[currentBatchIndex] = {
        ...copy[currentBatchIndex],
        status: "idle",
        error: undefined,
      };
      return copy;
    });
  };

  const handleSkipCurrentBatch = () => {
    // Treat as complete with 0 success and current rows skipped
    const startIdx = currentBatchIndex * batchSize;
    const endIdx = Math.min(startIdx + batchSize, rows.length);
    const chunk = rows.slice(startIdx, endIdx);

    const fallbackSkipped: SkipReason[] = chunk.map((row, idx) => ({
      rowNumber: startIdx + idx + 1,
      originalRow: row,
      reason: "Skipped: Batch processing failed or was skipped by user.",
    }));

    setAggregatedSkipped((prev) => [...prev, ...fallbackSkipped]);

    setBatches((prev) => {
      const copy = [...prev];
      copy[currentBatchIndex] = {
        ...copy[currentBatchIndex],
        status: "completed",
        successfulCount: 0,
        skippedCount: chunk.length,
      };
      return copy;
    });

    setCurrentBatchIndex((prev) => prev + 1);
  };

  // Calculate overall progress percentage
  const processedRows = Math.min(currentBatchIndex * batchSize, rows.length);
  const progressPercentage = rows.length > 0 ? Math.round((processedRows / rows.length) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto py-12 space-y-8 animate-fade-in" id="progress-step-container">
      {/* Icon Spinner */}
      <div className="flex flex-col items-center justify-center space-y-4">
        {batches[currentBatchIndex]?.status === "failed" ? (
          <div className="p-4 bg-rose-50 text-rose-500 rounded-full border border-rose-100">
            <AlertTriangle className="h-10 w-10 animate-pulse" />
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 relative">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        )}

        <div className="text-center space-y-1">
          <h3 className="text-lg font-sans font-semibold text-slate-800">
            {batches[currentBatchIndex]?.status === "failed" ? "Batch Mapping Paused" : "Intelligent AI Extraction"}
          </h3>
          <p className="text-slate-400 text-xs font-mono">{activeMessage}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500 font-sans">
          <span>Processed {processedRows} of {rows.length} rows</span>
          <span className="font-mono font-bold text-emerald-600">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats indicators during import */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center space-y-1">
          <p className="text-slate-400 text-[10px] font-mono uppercase font-semibold">Leads Extracted</p>
          <p className="text-2xl font-bold font-sans text-emerald-700">{aggregatedSuccessful.length}</p>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-center space-y-1">
          <p className="text-slate-400 text-[10px] font-mono uppercase font-semibold">Leads Skipped</p>
          <p className="text-2xl font-bold font-sans text-amber-700">{aggregatedSkipped.length}</p>
        </div>
      </div>

      {/* Error / Recovery Menu */}
      {batches[currentBatchIndex]?.status === "failed" && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-4 animate-fade-in" id="batch-error-box">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-rose-800">Batch Error details:</p>
            <p className="text-xs text-rose-600 font-mono leading-normal bg-white/60 p-2.5 rounded-lg border border-rose-100/50 max-h-[80px] overflow-y-auto">
              {batches[currentBatchIndex].error}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-retry-batch"
              onClick={handleRetryCurrentBatch}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all duration-150 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Current Batch
            </button>
            <button
              type="button"
              id="btn-skip-batch"
              onClick={handleSkipCurrentBatch}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-150"
            >
              Skip Current Batch
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Cancel Action */}
      {batches[currentBatchIndex]?.status !== "failed" && (
        <div className="text-center">
          <button
            type="button"
            id="btn-cancel-import"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-600 underline font-sans"
          >
            Cancel import process
          </button>
        </div>
      )}
    </div>
  );
}
