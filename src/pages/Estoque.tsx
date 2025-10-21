import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, Database, TrendingUp, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import EstoqueTable from "@/components/EstoqueTable";
import StatsCard from "@/components/StatsCard";
import ImportDialog from "@/components/ImportDialog";
import ClearDatabaseButton from "@/components/ClearDatabaseButton";

const Estoque = () => {
  const [empresaSelecionada, setEmpresaSelecionada] = useState("all");
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState("all");
  const [codigoOuEan, setCodigoOuEan] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  // Buscar empresas disponíveis
  const { data: empresas } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("codigo, nome")
        .order("codigo");
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar fornecedores disponíveis
  const { data: fornecedores } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("codigo, nome")
        .order("codigo");
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar categorias disponíveis
  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("nome")
        .order("nome");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [produtos, empresasCount, fornecedoresCount, estoqueTotal, valorTotal] = await Promise.all([
        supabase.from("produtos").select("id", { count: "exact", head: true }),
        supabase.from("empresas").select("id", { count: "exact", head: true }),
        supabase.from("fornecedores").select("id", { count: "exact", head: true }),
        supabase.from("estoque").select("id", { count: "exact", head: true }),
        supabase.rpc("total_valor_estoque"),
      ]);

      return {
        totalProdutosUnicos: produtos.count || 0,
        totalLinhasEstoque: estoqueTotal.count || 0,
        totalEmpresas: empresasCount.count || 0,
        totalFornecedores: fornecedoresCount.count || 0,
        valorTotalEstoque: Number(valorTotal.data) || 0,
      };
    },
  });

  return (
    <div className="flex-1">
      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Cards de Estatísticas */}
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 md:mb-8">
          <StatsCard
            title="Valor Total de Estoque"
            value={stats?.valorTotalEstoque || 0}
            icon={Package}
            description="Valor total em estoque"
            formatAsCurrency={true}
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
            <div className="space-y-4">
              <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
                <div>
                  <CardTitle className="text-lg md:text-xl">Itens em Estoque</CardTitle>
                  <CardDescription className="text-sm">
                    Visualize e gerencie todo o estoque de produtos por empresa
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <ClearDatabaseButton />
                  <ImportDialog />
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                  <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      {empresas?.map((empresa) => (
                        <SelectItem key={empresa.codigo} value={empresa.codigo}>
                          {empresa.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Fornecedor</label>
                  <Select value={fornecedorSelecionado} onValueChange={setFornecedorSelecionado}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os fornecedores" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">Todos os fornecedores</SelectItem>
                      {fornecedores?.map((fornecedor) => (
                        <SelectItem key={fornecedor.codigo} value={fornecedor.codigo}>
                          {fornecedor.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Código ou EAN</label>
                  <Input 
                    placeholder="Buscar por código ou EAN" 
                    value={codigoOuEan}
                    onChange={(e) => setCodigoOuEan(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      {categorias?.map((categoria) => (
                        <SelectItem key={categoria.nome} value={categoria.nome}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EstoqueTable 
              empresaCodigo={empresaSelecionada === "all" ? "" : empresaSelecionada}
              fornecedorCodigo={fornecedorSelecionado === "all" ? "" : fornecedorSelecionado}
              codigoOuEan={codigoOuEan}
              categoria={categoriaSelecionada}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Estoque;
