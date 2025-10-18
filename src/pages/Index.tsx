import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, Database, TrendingUp, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EstoqueTable from "@/components/EstoqueTable";
import ProdutosTable from "@/components/ProdutosTable";
import StatsCard from "@/components/StatsCard";
import ImportDialog from "@/components/ImportDialog";

const Index = () => {
  const [activeTab, setActiveTab] = useState("estoque");

  // Buscar estatísticas gerais
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [produtos, empresas, fornecedores, estoque] = await Promise.all([
        supabase.from("produtos").select("id", { count: "exact", head: true }),
        supabase.from("empresas").select("id", { count: "exact", head: true }),
        supabase.from("fornecedores").select("id", { count: "exact", head: true }),
        supabase.from("estoque").select("qtd_disponivel"),
      ]);

      const totalItens = estoque.data?.reduce((sum, item) => sum + (Number(item.qtd_disponivel) || 0), 0) || 0;

      return {
        totalProdutos: produtos.count || 0,
        totalEmpresas: empresas.count || 0,
        totalFornecedores: fornecedores.count || 0,
        totalItensEstoque: totalItens,
      };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <Database className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Sistema de Estoque</h1>
                <p className="text-muted-foreground">Vila Nova - Gestão Completa</p>
              </div>
            </div>
            <ImportDialog />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total de Produtos"
            value={stats?.totalProdutos || 0}
            icon={Package}
            description="Produtos cadastrados"
          />
          <StatsCard
            title="Itens em Estoque"
            value={Math.round(stats?.totalItensEstoque || 0)}
            icon={TrendingUp}
            description="Unidades disponíveis"
          />
          <StatsCard
            title="Empresas"
            value={stats?.totalEmpresas || 0}
            icon={Building2}
            description="Empresas cadastradas"
          />
          <StatsCard
            title="Fornecedores"
            value={stats?.totalFornecedores || 0}
            icon={Database}
            description="Fornecedores ativos"
          />
        </div>

        {/* Tabelas com Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Gestão de Dados</CardTitle>
            <CardDescription>
              Visualize e gerencie produtos, estoque, empresas e fornecedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="estoque">Estoque</TabsTrigger>
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
              </TabsList>
              <TabsContent value="estoque" className="mt-6">
                <EstoqueTable />
              </TabsContent>
              <TabsContent value="produtos" className="mt-6">
                <ProdutosTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
