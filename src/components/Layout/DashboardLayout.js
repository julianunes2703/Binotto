// src/components/DashboardLayout.jsx
import React, { useState } from "react";
import ObrasDashboard from "../Obra/ObrasDashboard"
import ComprasDashboard from "../Compras/ComprasDashboard"
import DREDashboard from "../DRE/DREDashboard";
import BudgetDashboard from "../Budget/BudgetDashboard";

import "./DashboardLayout.css";
import DREvsBudgetDashboard from "../DRExBudget/DREvBudgetDashboard";

export default function DashboardLayout() {
  const [selectedMenu, setSelectedMenu] = useState("obras");

  const renderContent = () => {
    switch (selectedMenu) {
      // Financeiro
      case "dre":
        return <DREDashboard />;
      case "budget":
        return <BudgetDashboard />;
        case "drexbudget":
          return <DREvsBudgetDashboard/>

      // Obras
      case "obras":
        return <ObrasDashboard />;
      case "compras":
        return <ComprasDashboard />;

      case "obrasxcompras":
        return (
          <div className="content-placeholder">
            📊 Comparativo Obras x Compras
          </div>
        );
      default:
        return <ObrasDashboard />;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Binotto</h2>
          <h3 className="blue">By Consulting Blue</h3>
        </div>

        <nav>
          <ul>
            {/* Seção Financeiro */}
            <li className="submenu-title">💰 Financeiro</li>
            <li
              className={selectedMenu === "dre" ? "active" : ""}
              onClick={() => setSelectedMenu("dre")}
            >
              • DRE
            </li>
            <li
              className={selectedMenu === "budget" ? "active" : ""}
              onClick={() => setSelectedMenu("budget")}
            >
              • Budget
            </li>
            <li
              className={selectedMenu === "drexbudget" ? "active" : ""}
              onClick={() => setSelectedMenu("drexbudget")}
            >
              • DRE × Budget
            </li>


            {/* Seção Obras */}
            <li className="submenu-title">🏗️ Obras</li>
            <li
              className={selectedMenu === "obras" ? "active" : ""}
              onClick={() => setSelectedMenu("obras")}
            >
              • Obras
            </li>
            <li
              className={selectedMenu === "compras" ? "active" : ""}
              onClick={() => setSelectedMenu("compras")}
            >
              • Compras
            </li>
          </ul>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="dashboard-content">{renderContent()}</main>
    </div>
  );
}
