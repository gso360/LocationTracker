import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AppLayout from "./components/AppLayout";
import Locations from "./pages/Locations";
import Reports from "./pages/Reports";
import AddLocation from "./pages/AddLocation";
import Projects from "./pages/Projects";
import ProjectLocations from "./pages/ProjectLocations";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPage from "./pages/Admin";
import MobileQRCode from "./components/MobileQRCode";
import BluetoothBarcodeProvider from "./components/locations/BluetoothBarcodeManager";
import WelcomeTour from "./components/WelcomeTour";
import { AuthProvider, useAuth, withAuth } from "./contexts/AuthContext";
import { TourProvider } from "./contexts/TourContext";
import "./styles/tour.css";

// Wrap components that require authentication
const ProtectedProjects = withAuth(Projects);
const ProtectedLocations = withAuth(Locations);
const ProtectedReports = withAuth(Reports);
const ProtectedAddLocation = withAuth(AddLocation);
const ProtectedProjectLocations = withAuth(ProjectLocations);
const ProtectedAdmin = withAuth(AdminPage);

// Home component that redirects to the appropriate page based on auth status
function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2962FF]"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Redirect to="/projects" />;
  } else {
    return <Redirect to="/login" />;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/locations" component={ProtectedLocations} />
      <Route path="/reports" component={ProtectedReports} />
      <Route path="/add-location" component={ProtectedAddLocation} />
      <Route path="/edit-location/:id" component={ProtectedAddLocation} />
      <Route path="/projects" component={ProtectedProjects} />
      <Route path="/projects/:id" component={ProtectedProjectLocations} />
      <Route path="/projects/:projectId/add-location" component={ProtectedAddLocation} />
      <Route path="/projects/:id/reports" component={ProtectedReports} />
      <Route path="/admin" component={ProtectedAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TourProvider>
          <BluetoothBarcodeProvider>
            <AppLayout>
              <Router />
            </AppLayout>
            <WelcomeTour />
            <Toaster />
            <div id="mobile-qr">
              <MobileQRCode />
            </div>
          </BluetoothBarcodeProvider>
        </TourProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
