import { cn } from "@/lib/utils";
import { saveLastTab } from "../utils/bus";
import type { TabType } from "../types";

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "user", label: "User", icon: "fas fa-user" },
  { id: "ambulance", label: "Ambulance", icon: "fas fa-ambulance" },
  { id: "hospital", label: "Hospital", icon: "fas fa-hospital" },
  { id: "admin", label: "Admin", icon: "fas fa-cog" },
] as const;

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const handleTabClick = (tabId: TabType) => {
    onTabChange(tabId);
    saveLastTab(tabId);
  };

  return (
    <nav className="bg-card border-b border-border" data-testid="tab-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id as TabType)}
              className={cn(
                "px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              data-testid={`tab-${tab.id}`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
