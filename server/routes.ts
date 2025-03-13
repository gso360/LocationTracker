import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertLocationSchema, 
  insertBarcodeSchema, 
  insertReportSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Helper function to handle validation errors
  const validateRequest = (schema: any, data: any) => {
    try {
      return { data: schema.parse(data), error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { data: null, error: fromZodError(error).message };
      }
      return { data: null, error: "Invalid request data" };
    }
  };

  // Locations endpoints
  
  // Get all locations
  router.get("/locations", async (req: Request, res: Response) => {
    try {
      const locations = await storage.getLocations();
      
      // For each location, get associated barcodes
      const locationsWithBarcodes = await Promise.all(
        locations.map(async (location) => {
          const barcodes = await storage.getBarcodesByLocation(location.id);
          return {
            ...location,
            barcodes
          };
        })
      );
      
      res.json(locationsWithBarcodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve locations" });
    }
  });

  // Get a single location
  router.get("/locations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      const barcodes = await storage.getBarcodesByLocation(id);
      
      res.json({
        ...location,
        barcodes
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve location" });
    }
  });

  // Get next available location number
  router.get("/locations/next-number", async (req: Request, res: Response) => {
    try {
      const nextNumber = await storage.getNextLocationNumber();
      res.json({ nextNumber });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate next location number" });
    }
  });

  // Create a new location
  router.post("/locations", async (req: Request, res: Response) => {
    const { data, error } = validateRequest(insertLocationSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    try {
      const newLocation = await storage.createLocation(data);
      res.status(201).json(newLocation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  // Update a location
  router.patch("/locations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      // Validate only the fields that are present in the request
      const updateData: any = {};
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      if (req.body.imageData !== undefined) updateData.imageData = req.body.imageData;
      
      const updatedLocation = await storage.updateLocation(id, updateData);
      res.json(updatedLocation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Delete a location
  router.delete("/locations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteLocation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // Barcodes endpoints
  
  // Get all barcodes
  router.get("/barcodes", async (req: Request, res: Response) => {
    try {
      const barcodes = await storage.getAllBarcodes();
      res.json(barcodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve barcodes" });
    }
  });

  // Get barcodes for a specific location
  router.get("/locations/:id/barcodes", async (req: Request, res: Response) => {
    try {
      const locationId = parseInt(req.params.id, 10);
      const location = await storage.getLocation(locationId);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      const barcodes = await storage.getBarcodesByLocation(locationId);
      res.json(barcodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve barcodes" });
    }
  });

  // Add a barcode to a location
  router.post("/barcodes", async (req: Request, res: Response) => {
    const { data, error } = validateRequest(insertBarcodeSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    try {
      // Check if the location exists
      const location = await storage.getLocation(data.locationId);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      const newBarcode = await storage.createBarcode(data);
      res.status(201).json(newBarcode);
    } catch (error) {
      res.status(500).json({ message: "Failed to create barcode" });
    }
  });

  // Delete a barcode
  router.delete("/barcodes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteBarcode(id);
      
      if (!success) {
        return res.status(404).json({ message: "Barcode not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete barcode" });
    }
  });

  // Reports endpoints
  
  // Get all reports
  router.get("/reports", async (req: Request, res: Response) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve reports" });
    }
  });

  // Create a new report
  router.post("/reports", async (req: Request, res: Response) => {
    const { data, error } = validateRequest(insertReportSchema, req.body);
    
    if (error) {
      return res.status(400).json({ message: error });
    }
    
    try {
      const newReport = await storage.createReport(data);
      res.status(201).json(newReport);
    } catch (error) {
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Data export endpoints
  
  // Generate Excel/CSV report with barcodes and locations
  router.get("/exports/excel", async (req: Request, res: Response) => {
    try {
      // This endpoint will return data for excel report generation on the client
      const locations = await storage.getLocations();
      const locationsWithBarcodes = await Promise.all(
        locations.map(async (location) => {
          const barcodes = await storage.getBarcodesByLocation(location.id);
          return {
            ...location,
            barcodes
          };
        })
      );
      
      res.json({
        success: true,
        data: locationsWithBarcodes
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to generate Excel report" 
      });
    }
  });

  // Generate PDF report with location photos
  router.get("/exports/pdf", async (req: Request, res: Response) => {
    try {
      // This endpoint will return data for PDF report generation on the client
      const locations = await storage.getLocations();
      
      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to generate PDF report" 
      });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
