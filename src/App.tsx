import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Estoque from "./pages/Estoque";
import Niv from "./pages/Niv";
import Importacao from "./pages/Importacao";
import Sugestao from "./pages/Sugestao";
import Pedido from "./pages/Pedido";
import PedidoDetalhes from "./pages/PedidoDetalhes";
import NotFound from "./pages/NotFound";
import ImportDialog from "@/components/ImportDialog";
import ClearDatabaseButton from "@/components/ClearDatabaseButton";
import ImportDialogNiv from "@/components/ImportDialogNiv";

const queryClient = new QueryClient();

const PageHeader = () => {
  const location = useLocation();
  
  const getPageInfo = () => {
    if (location.pathname === "/estoque") {
      return { title: "Gestão de Estoque" };
    }
    if (location.pathname === "/niv") {
      return { title: "NIV - Condições Comerciais" };
    }
    if (location.pathname === "/importacao") {
      return { title: "Importação NIV" };
    }
    if (location.pathname.startsWith("/sugestao")) {
      return { title: "Sugestão" };
    }
    if (location.pathname.startsWith("/pedido") && location.pathname.includes("/detalhes/")) {
      return { title: "Detalhes do Pedido" };
    }
    if (location.pathname.startsWith("/pedido")) {
      return { title: "Pedido" };
    }
    return { title: "" };
  };

  const pageInfo = getPageInfo();

  if (!pageInfo.title) return null;

  return (
    <div className="flex-1 px-4">
      <h1 className="text-lg md:text-2xl font-bold text-foreground">{pageInfo.title}</h1>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarProvider defaultOpen={true} style={{ "--sidebar-width": "12rem" } as React.CSSProperties}>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <header className="sticky top-0 z-40 h-12 md:h-14 border-b bg-card flex items-center px-2 md:px-4">
                        <SidebarTrigger />
                        <PageHeader />
                      </header>
                      <Routes>
                        <Route path="/" element={<Navigate to="/estoque" replace />} />
                        <Route path="/estoque" element={<Estoque />} />
                        <Route path="/importacao" element={<Importacao />} />
                        <Route path="/niv" element={<Niv />} />
                        <Route path="/sugestao" element={<Sugestao />} />
                        <Route path="/pedido/:tipo" element={<Pedido />} />
                        <Route path="/pedido/:tipo/detalhes/:pedidoId" element={<PedidoDetalhes />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
