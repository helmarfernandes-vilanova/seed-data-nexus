import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, Database, TrendingUp, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EstoqueTable from "@/components/EstoqueTable";
import StatsCard from "@/components/StatsCard";
import ImportDialog from "@/components/ImportDialog";
import ClearDatabaseButton from "@/components/ClearDatabaseButton";

const Estoque = () => {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [produtos, empresas, fornecedores, estoque, estoqueTotal] = await Promise.all([
        supabase.from("produtos").select("id", { count: "exact", head: true }),
        supabase.from("empresas").select("id", { count: "exact", head: true }),
        supabase.from("fornecedores").select("id", { count: "exact", head: true }),
        supabase.from("estoque").select("qtd_disponivel"),
        supabase.from("estoque").select("id", { count: "exact", head: true }),
      ]);

      const totalItens = estoque.data?.reduce((sum, item) => sum + (Number(item.qtd_disponivel) || 0), 0) || 0;

      return {
        totalProdutosUnicos: produtos.count || 0,
        totalLinhasEstoque: estoqueTotal.count || 0,
        totalEmpresas: empresas.count || 0,
        totalFornecedores: fornecedores.count || 0,
        totalItensEstoque: totalItens,
      };
    },
  });

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <Database className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Estoque</h1>
                <p className="text-muted-foreground">Vila Nova - Controle Completo</p>
              </div>
            </div>
            <div className="flex gap-2">
              <ClearDatabaseButton />
              <ImportDialog />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Linhas de Estoque"
            value={stats?.totalLinhasEstoque || 0}
            icon={Package}
            description="Total de itens cadastrados"
          />
          <StatsCard
            title="Produtos Únicos"
            value={stats?.totalProdutosUnicos || 0}
            icon={TrendingUp}
            description="Produtos cadastrados"
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

        {/* Tabela de Estoque */}
        <Card>
          <CardHeader>
            <CardTitle>Itens em Estoque</CardTitle>
            <CardDescription>
              Visualize e gerencie todo o estoque de produtos por empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EstoqueTable />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Estoque;
