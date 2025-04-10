import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { dataValidationResponseSchema, type DataValidationResponse } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod-validation-error";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV and Excel files are allowed.") as any);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to save onboarding step data
  app.post("/api/onboarding/step", async (req, res) => {
    try {
      const { step, ...data } = req.body;
      
      // For now using a default userId since we don't have auth
      const userId = 1;
      
      // Update or create onboarding data
      const onboardingData = await storage.saveOnboardingStep(userId, step, data);
      
      res.json({ success: true, data: onboardingData });
    } catch (error) {
      console.error("Error saving onboarding step:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "An error occurred while saving onboarding data"
      });
    }
  });

  // API endpoint to get current onboarding progress
  app.get("/api/onboarding/progress", async (req, res) => {
    try {
      // For now using a default userId since we don't have auth
      const userId = 1;
      
      const onboardingData = await storage.getOnboardingData(userId);
      
      res.json({ success: true, data: onboardingData || {} });
    } catch (error) {
      console.error("Error getting onboarding progress:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "An error occurred while fetching onboarding data"
      });
    }
  });

  // API endpoint to upload files
  app.post("/api/upload/file", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      // For now using a default userId since we don't have auth
      const userId = 1;
      
      // Save file metadata to storage
      const fileData = await storage.saveUploadedFile(userId, {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      });
      
      res.json({ 
        success: true, 
        data: {
          id: fileData.id,
          filename: fileData.originalName,
          size: fileData.size,
        }
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "An error occurred while uploading the file"
      });
    }
  });

  // API endpoint to analyze uploaded file data
  app.post("/api/analyze/data", async (req, res) => {
    try {
      // For now using a default userId since we don't have auth
      const userId = 1;

      // Get uploaded files for the user
      const files = await storage.getUploadedFiles(userId);
      
      if (files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No files have been uploaded for analysis" 
        });
      }

      // For simplicity, just analyze the most recent file
      const file = files[0];
      
      // Parse the file based on its type
      let parsedData: any[] = [];
      let columns: string[] = [];
      
      if (file.mimetype.includes('csv')) {
        const fileContent = fs.readFileSync(file.path, 'utf8');
        const result = Papa.parse(fileContent, { header: true });
        parsedData = result.data as any[];
        columns = result.meta.fields || [];
      } else if (file.mimetype.includes('spreadsheet') || file.path.endsWith('.xlsx') || file.path.endsWith('.xls')) {
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(worksheet);
        
        // Extract columns from the first row
        if (parsedData.length > 0) {
          columns = Object.keys(parsedData[0]);
        }
      }

      // Basic validation - check for required fields
      const requiredColumns = ['date', 'channel', 'campaign', 'spend'];
      const errors: { row: number, column: string, message: string }[] = [];
      
      const lowerCaseColumns = columns.map(col => col.toLowerCase());
      
      // Check if required columns exist (case insensitive)
      const missingColumns = requiredColumns.filter(
        col => !lowerCaseColumns.includes(col) && 
               !lowerCaseColumns.includes(col.replace('_', ' '))
      );
      
      if (missingColumns.length > 0) {
        return res.json({
          status: "error",
          errors: missingColumns.map(col => ({
            row: 0,
            column: col,
            message: `Required column "${col}" is missing from the data file`
          }))
        } as DataValidationResponse);
      }

      // Validate individual rows
      parsedData.forEach((row, index) => {
        // Find the actual column names in the file (accounting for case differences)
        const dateCol = Object.keys(row).find(key => key.toLowerCase() === 'date');
        const channelCol = Object.keys(row).find(key => key.toLowerCase() === 'channel');
        const campaignCol = Object.keys(row).find(key => key.toLowerCase() === 'campaign');
        const spendCol = Object.keys(row).find(key => key.toLowerCase() === 'spend' || key.toLowerCase().includes('cost'));
        
        if (dateCol && !row[dateCol]) {
          errors.push({
            row: index + 2, // +2 to account for 0-indexing and header row
            column: dateCol,
            message: "Missing date value"
          });
        }
        
        if (spendCol) {
          const spend = row[spendCol];
          // Check if spend is a number or can be converted to one
          if (spend === undefined || spend === null || spend === '') {
            errors.push({
              row: index + 2,
              column: spendCol,
              message: "Missing spend value"
            });
          } else if (isNaN(Number(spend.toString().replace(/[$,]/g, '')))) {
            errors.push({
              row: index + 2,
              column: spendCol,
              message: "Invalid spend format (must be numeric)"
            });
          }
        }
        
        if (channelCol && typeof row[channelCol] === 'string') {
          // Check for special characters in channel name
          if (/[^a-zA-Z0-9 _-]/.test(row[channelCol])) {
            errors.push({
              row: index + 2,
              column: channelCol,
              message: "Channel name contains special characters"
            });
          }
        }
      });

      // Prepare response based on validation results
      const response: DataValidationResponse = {
        status: errors.length > 0 ? "error" : "success",
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          timePeriod: "Sample period",
          dataPoints: parsedData.length,
          channels: new Set(parsedData.map(row => {
            const channelCol = Object.keys(row).find(key => key.toLowerCase() === 'channel');
            return channelCol ? row[channelCol] : null;
          }).filter(Boolean)).size
        },
        preview: errors.length > 0 
          ? parsedData.slice(0, Math.min(5, parsedData.length)) 
          : parsedData.slice(0, Math.min(5, parsedData.length)),
        columns: columns
      };

      // Update onboarding data with analysis results
      await storage.saveOnboardingStep(userId, "analyze", {
        dataStatus: response.status,
        dataErrors: response.errors || []
      });

      // Return analysis results
      res.json(response);
    } catch (error) {
      console.error("Error analyzing data:", error);
      res.status(400).json({ 
        status: "error",
        message: error instanceof Error ? error.message : "An error occurred while analyzing the data"
      });
    }
  });

  // API endpoint to connect integrations
  app.post("/api/integrations/connect", async (req, res) => {
    try {
      const { integration } = req.body;
      
      if (!integration || !integration.type) {
        return res.status(400).json({ success: false, message: "Integration type is required" });
      }
      
      // For now using a default userId since we don't have auth
      const userId = 1;
      
      // Save integration data
      const data = await storage.saveIntegration(userId, integration);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error("Error connecting integration:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "An error occurred while connecting the integration"
      });
    }
  });

  // API endpoint to disconnect an integration
  app.post("/api/integrations/disconnect", async (req, res) => {
    try {
      const { integrationId } = req.body;
      
      if (!integrationId) {
        return res.status(400).json({ success: false, message: "Integration ID is required" });
      }
      
      // For now using a default userId since we don't have auth
      const userId = 1;
      
      // Update integration status
      const success = await storage.disconnectIntegration(userId, integrationId);
      
      res.json({ success });
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "An error occurred while disconnecting the integration"
      });
    }
  });

  // API endpoint to get user's integrations
  app.get("/api/integrations", async (req, res) => {
    try {
      // For now using a default userId since we don't have auth
      const userId = 1;
      
      const integrations = await storage.getUserIntegrations(userId);
      
      res.json({ success: true, data: integrations });
    } catch (error) {
      console.error("Error getting integrations:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "An error occurred while fetching integrations"
      });
    }
  });

  // API endpoint to complete onboarding
  app.post("/api/onboarding/complete", async (req, res) => {
    try {
      // For now using a default userId since we don't have auth
      const userId = 1;
      
      const onboardingData = await storage.completeOnboarding(userId);
      
      res.json({ success: true, data: onboardingData });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "An error occurred while completing onboarding"
      });
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
