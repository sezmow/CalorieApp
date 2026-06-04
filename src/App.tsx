/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AppProvider, useAppStore } from "./lib/store";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./views/Dashboard";
import { LogFood } from "./views/LogFood";
import { Analytics } from "./views/Analytics";
import { Profile } from "./views/Profile";
import { Welcome } from "./views/Welcome";
import { Setup } from "./views/Setup";

function AppContent() {
  const { user, loading } = useAuth();
  const { profile, loading: storeLoading, initializeUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "log" | "analytics" | "profile">("dashboard");

  useEffect(() => {
    if (user) {
      initializeUser(user.uid);
    } else {
      initializeUser(null);
    }
  }, [user]);

  if (loading || (user && storeLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-600 border-dashed animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Welcome />;
  }

  if (!profile) {
    return <Setup />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "log" && <LogFood onLogComplete={() => setActiveTab("dashboard")} />}
      {activeTab === "analytics" && <Analytics />}
      {activeTab === "profile" && <Profile />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

