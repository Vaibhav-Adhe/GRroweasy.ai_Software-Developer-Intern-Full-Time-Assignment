import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Papa from "papaparse";

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Map dirty records into GrowEasy CRM format using Gemini
async function processBatchWithAI(rawRecords: any[]): Promise<any[]> {
  const ai = getGeminiClient();

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      records: {
        type: Type.ARRAY,
        description: "List of mapped and cleaned CRM records corresponding to the input rows",
        items: {
          type: Type.OBJECT,
          properties: {
            created_at: {
              type: Type.STRING,
              description: "Lead creation date. Must be a parseable date string (e.g. ISO format or 'YYYY-MM-DD HH:mm:ss'). If missing, provide a valid date string representing when the row was created or the current timestamp."
            },
            name: {
              type: Type.STRING,
              description: "Lead name. Clean up any weird symbols or casing."
            },
            email: {
              type: Type.STRING,
              description: "Primary email. Ensure it is a clean valid email address. If multiple are present in input, extract the first one here."
            },
            country_code: {
              type: Type.STRING,
              description: "Country dialing code prefix, e.g., '+91', '+1', '+44' if available. Otherwise, leave empty."
            },
            mobile_without_country_code: {
              type: Type.STRING,
              description: "Mobile/phone number WITHOUT the country code prefix or dialing code. Extract the first one here if multiple exist."
            },
            company: {
              type: Type.STRING,
              description: "Company name. Leave empty if none found."
            },
            city: {
              type: Type.STRING,
              description: "City name."
            },
            state: {
              type: Type.STRING,
              description: "State name."
            },
            country: {
              type: Type.STRING,
              description: "Country name."
            },
            lead_owner: {
              type: Type.STRING,
              description: "Lead owner or assigned representative name."
            },
            crm_status: {
              type: Type.STRING,
              description: "Lead status. MUST be exactly one of: 'GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'. Closely map any raw status input. If none exists or can't be matched, leave it empty."
            },
            crm_note: {
              type: Type.STRING,
              description: "Notes/remarks. MUST also append any extra emails or phone numbers here if multiple were present (e.g., 'Extra Emails: email2@test.com' or 'Extra Phones: 9876543211')."
            },
            data_source: {
              type: Type.STRING,
              description: "Lead source. MUST be exactly one of: 'leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'. If none match confidently, leave it empty."
            },
            possession_time: {
              type: Type.STRING,
              description: "Property possession time or date details if present."
            },
            description: {
              type: Type.STRING,
              description: "Any other useful description or details."
            }
          },
          required: [
            "created_at",
            "name",
            "email",
            "country_code",
            "mobile_without_country_code",
            "company",
            "city",
            "state",
            "country",
            "lead_owner",
            "crm_status",
            "crm_note",
            "data_source",
            "possession_time",
            "description"
          ]
        }
      }
    },
    required: ["records"]
  };

  const prompt = `
Analyze the following raw, dirty data rows from an uploaded CSV and intelligently map, clean, and convert them into the standard GrowEasy CRM format.

Raw Input Rows (JSON format):
${JSON.stringify(rawRecords, null, 2)}

AI Extraction Instructions:
1. CRM Status: Clean the status and map to one of: 'GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'.
2. Data Source: Map to one of: 'leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'. If none matches confidently, leave blank.
3. Date Format: Convert any date into a string convertible by JS via \`new Date(created_at)\`.
4. Multiple Emails/Mobiles:
   - For multiple emails, put the first email in the "email" field and append the rest to "crm_note".
   - For multiple phones/mobiles, put the first mobile in "mobile_without_country_code" (extract dialing prefix to "country_code" if possible) and append the rest to "crm_note".
5. Note and Remarks: Use "crm_note" for all remarks, extra comments, and secondary emails/phone numbers.
6. Return structured JSON matching the provided schema exactly. Maintain a 1:1 mapping with the input row order.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        systemInstruction: "You are a professional CRM Data Integrator. Map the provided custom layout fields into GrowEasy CRM records.",
        temperature: 0.1,
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    return parsedResponse.records || [];
  } catch (err: any) {
    console.error("Gemini API error during mapping:", err);
    throw new Error(`Failed to map records with AI: ${err.message || err}`);
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // API Check Status
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 1. Bulk Parse CSV and AI Extraction
  app.post("/api/import", async (req, res) => {
    const { csvText, batchSize = 10 } = req.body;

    if (!csvText || typeof csvText !== "string") {
      return res.status(400).json({ error: "Missing csvText parameter" });
    }

    try {
      // Parse CSV text via PapaParse
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: "greedy",
      });

      if (parseResult.errors.length > 0) {
        console.warn("CSV parsing warnings:", parseResult.errors);
      }

      const rawRows = parseResult.data as any[];
      if (rawRows.length === 0) {
        return res.json({
          successful: [],
          skipped: [],
          totalImported: 0,
          totalSkipped: 0,
        });
      }

      const successful: any[] = [];
      const skipped: any[] = [];

      // Process in batches
      for (let i = 0; i < rawRows.length; i += batchSize) {
        const chunk = rawRows.slice(i, i + batchSize);
        try {
          const mappedChunk = await processBatchWithAI(chunk);

          mappedChunk.forEach((record, index) => {
            const rawRow = chunk[index];
            const rowNumber = i + index + 1;

            // Validate constraints: If record contains neither email nor mobile, then skip
            const emailValue = record.email ? record.email.trim() : "";
            const mobileValue = record.mobile_without_country_code ? record.mobile_without_country_code.toString().trim() : "";

            if (!emailValue && !mobileValue) {
              skipped.push({
                rowNumber,
                originalRow: rawRow,
                reason: "Skipped: Lead contains neither email nor mobile number.",
              });
            } else {
              successful.push(record);
            }
          });
        } catch (batchErr: any) {
          console.error(`Error processing batch ${i / batchSize + 1}:`, batchErr);
          // Mark this entire batch as skipped due to mapping error
          chunk.forEach((rawRow, index) => {
            skipped.push({
              rowNumber: i + index + 1,
              originalRow: rawRow,
              reason: `Batch mapping failed: ${batchErr.message || batchErr}`,
            });
          });
        }
      }

      res.json({
        successful,
        skipped,
        totalImported: successful.length,
        totalSkipped: skipped.length,
      });
    } catch (err: any) {
      console.error("Import handler error:", err);
      res.status(500).json({ error: err.message || "An unexpected error occurred during import." });
    }
  });

  // 2. Incremental Batch Process Endpoint
  app.post("/api/import-batch", async (req, res) => {
    const { rawRows, startRowIndex = 1 } = req.body;

    if (!Array.isArray(rawRows)) {
      return res.status(400).json({ error: "Missing or invalid rawRows. Must be an array." });
    }

    try {
      const mappedChunk = await processBatchWithAI(rawRows);
      const successful: any[] = [];
      const skipped: any[] = [];

      mappedChunk.forEach((record, index) => {
        const rawRow = rawRows[index];
        const rowNumber = startRowIndex + index;

        // Validate constraints: If record contains neither email nor mobile, then skip
        const emailValue = record.email ? record.email.trim() : "";
        const mobileValue = record.mobile_without_country_code ? record.mobile_without_country_code.toString().trim() : "";

        if (!emailValue && !mobileValue) {
          skipped.push({
            rowNumber,
            originalRow: rawRow,
            reason: "Lead contains neither email nor mobile number.",
          });
        } else {
          successful.push(record);
        }
      });

      res.json({
        successful,
        skipped,
      });
    } catch (err: any) {
      console.error("Import-batch handler error:", err);
      res.status(500).json({ error: err.message || "Failed to process batch." });
    }
  });

  // Vite development vs Production setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
