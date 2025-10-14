import { useEffect, useState } from "react";
import { useAI4HStore } from "./store/ai4h-store";
import { TabBar } from "./components/TabBar";
import { UserView } from "./views/UserView";
import { EnhancedAmbulanceView } from "./views/EnhancedAmbulanceView";
import { HospitalView } from "./views/HospitalView";
import { HospitalCapacityConsole } from "./views/HospitalCapacityConsole";
import { AdminDashboard } from "./views/AdminDashboard";
import { loadLastTab } from "./utils/bus";
import type { TabType } from "./types";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("user");
  const initializeStore = useAI4HStore((state) => state.initializeStore);

  useEffect(() => {
    // Initialize the store and load persisted state
    initializeStore();
    
    // Load last active tab
    const lastTab = loadLastTab();
    setActiveTab(lastTab as TabType);

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [initializeStore]);

  const renderView = () => {
    switch (activeTab) {
      case "user":
        return <UserView />;
      case "ambulance":
        return <EnhancedAmbulanceView />;
      case "hospital":
        return <HospitalCapacityConsole />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <UserView />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="bg-card border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-600 p-2 rounded-lg">
                    <i className="fas fa-heartbeat text-white text-xl"></i>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">AI4Health Emergency</h1>
                    <p className="text-sm text-muted-foreground">Real-time Emergency Response System</p>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" data-testid="status-live"></div>
                  <span className="text-sm text-muted-foreground">Live</span>
                </div>
              </div>
            </div>
          </header>

          {/* Tab Navigation */}
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main Content */}
          {renderView()}
        </div>
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
