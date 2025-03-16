import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// New table for projects/showrooms
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),            // Showroom Name
  lineVendor: text("line_vendor"),         // Line/Vendor
  scannerName: text("scanner_name"),       // Scanner's Name
  tourId: text("tour_id"),                 // Tour ID (Market, Season, Year)
  scanDate: text("scan_date"),             // Date of scanning
  groupIdType: text("group_id_type"),      // GroupID Type (1-400, S1-X, Custom)
  description: text("description"),        // Additional description
  status: text("status").default('in_progress').notNull(), // Project status: in_progress, completed
  submitted: boolean("submitted").default(false).notNull(), // Whether project has been submitted
  submittedAt: timestamp("submitted_at"),  // When the project was submitted
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  lineVendor: true,
  scannerName: true,
  tourId: true,
  scanDate: true,
  groupIdType: true,
  description: true,
  status: true,
  submitted: true,
  submittedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),             // Location number/name
  notes: text("notes"),                     // Additional notes
  imageData: text("image_data"),            // Photo data
  pinPlacement: text("pin_placement"),      // Where to place pin (optional)
  projectId: integer("project_id"),         // Foreign key to projects table
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  notes: true,
  imageData: true,
  pinPlacement: true,
  projectId: true,
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export const barcodes = pgTable("barcodes", {
  id: serial("id").primaryKey(),
  value: text("value").notNull(),
  locationId: integer("location_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBarcodeSchema = createInsertSchema(barcodes).pick({
  value: true,
  locationId: true,
});

export type InsertBarcode = z.infer<typeof insertBarcodeSchema>;
export type Barcode = typeof barcodes.$inferSelect;

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),              // "excel" or "pdf" 
  projectId: integer("project_id").notNull(), // Related project
  emailCopy: boolean("email_copy").default(false),  // Email me a copy
  syncAfter: boolean("sync_after").default(true),   // Sync after tapping Submit
  showPdf: boolean("show_pdf").default(false),      // Show PDF after sync
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports).pick({
  name: true,
  type: true,
  projectId: true,
  emailCopy: true,
  syncAfter: true, 
  showPdf: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
