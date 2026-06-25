"use client";

import * as React from "react";
import { AdminScreen } from "@/components/AdminScreen";
import { AppShell } from "@/components/AppShell";
import { DashboardScreen } from "@/components/DashboardScreen";
import { HistoryScreen } from "@/components/HistoryScreen";
import { AbsenceScreen } from "@/components/AbsenceScreen";
import { HomeMenu } from "@/components/HomeMenu";
import { InspectionFlow } from "@/components/InspectionFlow";
import { LoginScreen } from "@/components/LoginScreen";
import { SavedRecordsScreen } from "@/components/SavedRecordsScreen";
import { StaffingDashboardScreen } from "@/components/StaffingDashboardScreen";
import { StaffingScreen } from "@/components/StaffingScreen";
import { getStoredUser, setStoredUser } from "@/lib/storage";
import type { Usuario } from "@/types";

type Tab = "inicio" | "estacoes" | "ausencia" | "efetivo" | "dashboardEfetivo" | "registros" | "historico" | "dashboard" | "admin";

export default function Home() {
  const [user, setUser] = React.useState<Usuario | null>(null);
  const [active, setActive] = React.useState<Tab>("inicio");
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    const stored = getStoredUser();
    if (stored.email) setUser(stored);
  }, []);

  function handleLogin(nextUser: Usuario) {
    setStoredUser(nextUser);
    setUser(nextUser);
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <AppShell
      active={active}
      user={user}
      onNavigate={setActive}
      onLogout={() => {
        window.localStorage.clear();
        setUser(null);
      }}
    >
      {active === "inicio" && <HomeMenu user={user} onOpen={setActive} />}
      {active === "estacoes" && <InspectionFlow user={user} onSaved={() => setRefreshKey((key) => key + 1)} />}
      {active === "ausencia" && <AbsenceScreen user={user} />}
      {active === "efetivo" && <StaffingScreen user={user} />}
      {active === "dashboardEfetivo" && <StaffingDashboardScreen />}
      {active === "registros" && <SavedRecordsScreen />}
      {active === "historico" && <HistoryScreen user={user} refreshKey={refreshKey} />}
      {active === "dashboard" && <DashboardScreen refreshKey={refreshKey} />}
      {active === "admin" && <AdminScreen />}
    </AppShell>
  );
}
