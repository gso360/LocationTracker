import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '../../../shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Lock, Shield, User as UserIcon } from 'lucide-react';
import { useLocation } from 'wouter';

// Type definition for user without password
type SafeUser = Omit<User, 'password'>;

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [_, navigate] = useLocation();

  // Check if current user is admin or superadmin
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  
  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [user, isAdmin, toast, navigate]);
  
  if (!user || !isAdmin) {
    return null;
  }

  // Query all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin
  });

  // Query for pending users
  const { data: pendingUsers = [] } = useQuery({
    queryKey: ['/api/admin/users/pending'],
    enabled: isAdmin
  });

  // Mutation to approve a user
  const approveMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest('POST', `/api/admin/users/${userId}/approve`),
    onSuccess: () => {
      toast({
        title: "User Approved",
        description: "The user has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/pending'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Mutation to update user role
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => 
      apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Handle role change
  const handleRoleChange = (userId: number, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  // Handle approval
  const handleApprove = (userId: number) => {
    approveMutation.mutate(userId);
  };

  // Get readable date format
  const formatDate = (date?: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Render role badge with appropriate color
  const RoleBadge = ({ role }: { role: string }) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-red-500">{role}</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500">{role}</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Shield className="mr-2" /> User Administration
      </h1>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p>Loading users...</p>
            ) : (
              users.map((user: SafeUser) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center">
                        <UserIcon className="mr-2 h-5 w-5" /> 
                        {user.username}
                      </CardTitle>
                      <RoleBadge role={user.role} />
                    </div>
                    <CardDescription>
                      Created: {formatDate(user.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">Status:</span>
                        {user.approved ? (
                          <div className="flex items-center text-green-500">
                            <CheckCircle className="h-4 w-4 mr-1" /> Approved
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-500">
                            <AlertCircle className="h-4 w-4 mr-1" /> Pending
                          </div>
                        )}
                      </div>
                      {user.approvedAt && (
                        <div>
                          <span className="font-semibold">Approved on:</span> {formatDate(user.approvedAt)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-between">
                    {!user.approved && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user.id)}
                        disabled={approveMutation.isPending}
                      >
                        Approve User
                      </Button>
                    )}
                    
                    {isSuperAdmin && user.id !== (user as SafeUser).id && (
                      <div className="flex items-center">
                        <span className="mr-2 text-sm">Role:</span>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="pending">
          {pendingUsers.length === 0 ? (
            <div className="text-center p-6 bg-muted rounded-lg">
              <CheckCircle className="h-10 w-10 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg">No Pending Approvals</h3>
              <p className="text-sm text-muted-foreground">All user registrations have been processed.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingUsers.map((user: SafeUser) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center">
                        <UserIcon className="mr-2 h-5 w-5" /> 
                        {user.username}
                      </CardTitle>
                      <RoleBadge role={user.role} />
                    </div>
                    <CardDescription>
                      Created: {formatDate(user.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-amber-500">
                      <Lock className="h-4 w-4 mr-1" /> Waiting for approval
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-3">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      disabled={approveMutation.isPending}
                    >
                      Approve User
                    </Button>
                    
                    {isSuperAdmin && (
                      <div className="flex items-center ml-4">
                        <span className="mr-2 text-sm">Role:</span>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}