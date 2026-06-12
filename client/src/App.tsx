import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home, {
  AccessPage,
  AgentsPage,
  ApprovalsPage,
  AuditPage,
  ConnectorsPage,
  EvaluationsPage,
  GuardrailsPage,
  ObservabilityPage,
  PoliciesPage,
} from "./pages/ControlPlane";
import ApiKeys from "./pages/ApiKeys";
import HelpCenterPage from "./pages/HelpCenter";
import Login from "./pages/Login";

function DashboardShell({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <DashboardShell>
          <Home />
        </DashboardShell>
      </Route>
      <Route path="/agents">
        <DashboardShell>
          <AgentsPage />
        </DashboardShell>
      </Route>
      <Route path="/policies">
        <DashboardShell>
          <PoliciesPage />
        </DashboardShell>
      </Route>
      <Route path="/access">
        <DashboardShell>
          <AccessPage />
        </DashboardShell>
      </Route>
      <Route path="/approvals">
        <DashboardShell>
          <ApprovalsPage />
        </DashboardShell>
      </Route>
      <Route path="/audit">
        <DashboardShell>
          <AuditPage />
        </DashboardShell>
      </Route>
      <Route path="/connectors">
        <DashboardShell>
          <ConnectorsPage />
        </DashboardShell>
      </Route>
      <Route path="/evaluations">
        <DashboardShell>
          <EvaluationsPage />
        </DashboardShell>
      </Route>
      <Route path="/guardrails">
        <DashboardShell>
          <GuardrailsPage />
        </DashboardShell>
      </Route>
      <Route path="/observability">
        <DashboardShell>
          <ObservabilityPage />
        </DashboardShell>
      </Route>
      <Route path="/integration">
        <DashboardShell>
          <ApiKeys />
        </DashboardShell>
      </Route>
      <Route path="/help">
        <DashboardShell>
          <HelpCenterPage />
        </DashboardShell>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
