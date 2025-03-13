import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AppLayout from "./components/AppLayout";
import Locations from "./pages/Locations";
import Reports from "./pages/Reports";
import AddLocation from "./pages/AddLocation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Locations} />
      <Route path="/reports" component={Reports} />
      <Route path="/add-location" component={AddLocation} />
      <Route path="/edit-location/:id" component={AddLocation} />
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
    </QueryClientProvider>
  );
}

export default App;
