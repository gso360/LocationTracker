import { 
  locations, 
  barcodes, 
  reports, 
  users,
  type User, 
  type InsertUser,
  type Location,
  type InsertLocation,
  type Barcode,
  type InsertBarcode,
  type Report,
  type InsertReport
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Location operations
  getLocation(id: number): Promise<Location | undefined>;
  getLocationByName(name: string): Promise<Location | undefined>;
  getLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  getNextLocationNumber(): Promise<string>;

  // Barcode operations
  getBarcode(id: number): Promise<Barcode | undefined>;
  getBarcodesByLocation(locationId: number): Promise<Barcode[]>;
  getAllBarcodes(): Promise<Barcode[]>;
  createBarcode(barcode: InsertBarcode): Promise<Barcode>;
  deleteBarcode(id: number): Promise<boolean>;

  // Report operations
  getReport(id: number): Promise<Report | undefined>;
  getReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private locations: Map<number, Location>;
  private barcodes: Map<number, Barcode>;
  private reports: Map<number, Report>;
  
  private currentUserId: number;
  private currentLocationId: number;
  private currentBarcodeId: number;
  private currentReportId: number;

  constructor() {
    this.users = new Map();
    this.locations = new Map();
    this.barcodes = new Map();
    this.reports = new Map();
    
    this.currentUserId = 1;
    this.currentLocationId = 1;
    this.currentBarcodeId = 1;
    this.currentReportId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocationByName(name: string): Promise<Location | undefined> {
    return Array.from(this.locations.values()).find(
      (location) => location.name === name,
    );
  }

  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.currentLocationId++;
    const location: Location = { 
      ...insertLocation, 
      id, 
      createdAt: new Date() 
    };
    this.locations.set(id, location);
    return location;
  }

  async updateLocation(id: number, updateData: Partial<InsertLocation>): Promise<Location | undefined> {
    const location = this.locations.get(id);
    if (!location) return undefined;

    const updatedLocation = { ...location, ...updateData };
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<boolean> {
    const deleted = this.locations.delete(id);
    
    // Also delete associated barcodes
    if (deleted) {
      const barcodeIdsToDelete: number[] = [];
      
      this.barcodes.forEach((barcode, barcodeId) => {
        if (barcode.locationId === id) {
          barcodeIdsToDelete.push(barcodeId);
        }
      });
      
      barcodeIdsToDelete.forEach(barcodeId => {
        this.barcodes.delete(barcodeId);
      });
    }
    
    return deleted;
  }

  async getNextLocationNumber(): Promise<string> {
    const existingLocations = await this.getLocations();
    let maxNumber = 0;
    
    // Find the highest location number
    existingLocations.forEach(location => {
      const match = location.name.match(/^(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    // Format with leading zeros (e.g., 001, 002, etc.)
    return (maxNumber + 1).toString().padStart(3, '0');
  }

  // Barcode operations
  async getBarcode(id: number): Promise<Barcode | undefined> {
    return this.barcodes.get(id);
  }

  async getBarcodesByLocation(locationId: number): Promise<Barcode[]> {
    return Array.from(this.barcodes.values()).filter(
      (barcode) => barcode.locationId === locationId,
    );
  }

  async getAllBarcodes(): Promise<Barcode[]> {
    return Array.from(this.barcodes.values());
  }

  async createBarcode(insertBarcode: InsertBarcode): Promise<Barcode> {
    const id = this.currentBarcodeId++;
    const barcode: Barcode = { 
      ...insertBarcode, 
      id, 
      createdAt: new Date() 
    };
    this.barcodes.set(id, barcode);
    return barcode;
  }

  async deleteBarcode(id: number): Promise<boolean> {
    return this.barcodes.delete(id);
  }

  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const report: Report = { 
      ...insertReport, 
      id, 
      createdAt: new Date() 
    };
    this.reports.set(id, report);
    return report;
  }
}

export const storage = new MemStorage();
