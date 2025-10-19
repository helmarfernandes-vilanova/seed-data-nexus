import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Estoque from "./pages/Estoque";
import Niv from "./pages/Niv";
import Importacao from "./pages/Importacao";
import Sugestao from "./pages/Sugestao";
import Pedido from "./pages/Pedido";
import PedidoDetalhes from "./pages/PedidoDetalhes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-14 border-b bg-card flex items-center px-4">
                <SidebarTrigger />
              </header>
              <Routes>
                <Route path="/" element={<Navigate to="/estoque" replace />} />
                <Route path="/estoque" element={<Estoque />} />
                <Route path="/importacao" element={<Importacao />} />
                <Route path="/niv/:empresa" element={<Niv />} />
                <Route path="/sugestao/:tipo" element={<Sugestao />} />
                <Route path="/pedido/:tipo" element={<Pedido />} />
                <Route path="/pedido/:tipo/detalhes/:pedidoId" element={<PedidoDetalhes />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
