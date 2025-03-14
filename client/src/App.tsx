import { Switch, Route } from "wouter";
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
import MobileQRCode from "./components/MobileQRCode";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Projects} />
      <Route path="/locations" component={Locations} />
      <Route path="/reports" component={Reports} />
      <Route path="/add-location" component={AddLocation} />
      <Route path="/edit-location/:id" component={AddLocation} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectLocations} />
      <Route path="/projects/:projectId/add-location" component={AddLocation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>
        <Router />
      </AppLayout>
      <Toaster />
      <div id="mobile-qr">
        <MobileQRCode />
      </div>
    </QueryClientProvider>
  );
}

export default App;
