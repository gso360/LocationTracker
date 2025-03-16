import { Request, Response, NextFunction } from 'express';
import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import { storage } from './storage';
import { insertUserSchema, User, InsertUser } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import bcrypt from 'bcryptjs';
import fs from 'fs';

// Setup Passport local strategy
export function setupPassport() {
  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Configure local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find user by username
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        // Check if user is approved (except for superadmin)
        if (user.role !== 'superadmin' && !user.approved) {
          return done(null, false, { message: 'Your account is pending approval by an administrator' });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    })
  );
}

// Create initial superadmin if no users exist
export async function createInitialSuperadmin() {
  try {
    const users = await storage.getAllUsers();
    
    if (users.length === 0) {
      // Create a superadmin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await storage.createUser({
        username: 'superadmin',
        password: hashedPassword,
        role: 'superadmin',
        approved: true,
      });
      console.log('Created initial superadmin account');
    }
  } catch (error) {
    console.error('Error creating initial superadmin:', error);
  }
}

// Register a new user
export async function register(req: Request, res: Response) {
  try {
    // Validate request body
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if username is already taken
    const existingUser = await storage.getUserByUsername(validatedData.username);
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Check if this is the first user (make them superadmin)
    const allUsers = await storage.getAllUsers();
    const isFirstUser = allUsers.length === 0;
    
    // Prepare user data
    const userData: InsertUser = {
      username: validatedData.username,
      password: hashedPassword,
      role: isFirstUser ? 'superadmin' : (validatedData.role || 'user'),
      approved: isFirstUser, // First user is automatically approved
    };
    
    // Create user
    const user = await storage.createUser(userData);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    
    res.status(500).json({ message: 'Error creating user' });
  }
}

// Login middleware
export function login(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('local', (err: Error, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ message: info.message || 'Authentication failed' });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      
      return res.status(200).json(user);
    });
  })(req, res, next);
}

// Get current user
export function getCurrentUser(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  res.json(req.user);
}

// Logout
export function logout(req: Request, res: Response) {
  req.logout(err => {
    if (err) {
      return res.status(500).json({ message: 'Error during logout' });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: 'Not authenticated' });
}

// Admin authorization middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const user = req.user as User;
  
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Not authorized. Admin access required.' });
  }
  
  next();
}

// Super admin authorization middleware
export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const user = req.user as User;
  
  if (user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Not authorized. Super admin access required.' });
  }
  
  next();
}

// Get all users (admin only)
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await storage.getAllUsers();
    // Remove passwords from users
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
}

// Approve a user (admin only)
export async function approveUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const admin = req.user as User;
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user approval status
    const updatedUser = await storage.updateUser(userId, {
      approved: true,
      approvedAt: new Date(),
      approvedBy: admin.id
    });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error approving user' });
  }
}

// Update user role (super admin only)
export async function updateUserRole(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    // Validate role
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be user, admin, or superadmin.' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user role
    const updatedUser = await storage.updateUser(userId, { role });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
}