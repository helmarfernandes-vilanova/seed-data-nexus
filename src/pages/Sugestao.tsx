import { useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import SugestaoTable from "@/components/SugestaoTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const Sugestao = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const pedidoId = searchParams.get('pedido');
  const [isSaving, setIsSaving] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState("501");
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState("1941");
  const [codigoOuEan, setCodigoOuEan] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const tableRef = useRef<{ getEditingData: () => any[] }>(null);

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

  const handleCreatePedido = () => {
    setSearchParams({});
    toast.success("Novo pedido iniciado");
  };

  const handleSavePedido = async () => {
    if (!tableRef.current) return;
    
    setIsSaving(true);
    try {
      // Buscar empresa e fornecedor IDs
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("id")
        .eq("codigo", empresaSelecionada)
        .single();

      const { data: fornecedorData } = await supabase
        .from("fornecedores")
        .select("id")
        .eq("codigo", fornecedorSelecionado)
        .single();

      if (!empresaData || !fornecedorData) {
        throw new Error("Empresa ou fornecedor não encontrado");
      }

      // Obter dados editados da tabela
      const editingData = tableRef.current.getEditingData();
      const itensComQuantidade = editingData.filter(
        (item) => item.qtdPallet > 0 || item.qtdCamada > 0
      );

      if (itensComQuantidade.length === 0) {
        toast.error("Adicione pelo menos um item ao pedido");
        return;
      }

      // Buscar condições comerciais para obter preços
      const produtosIds = itensComQuantidade.map(item => item.produtoId);
      const { data: produtos } = await supabase
        .from("produtos")
        .select("id, ean")
        .in("id", produtosIds);

      const { data: condicoes } = await supabase
        .from("condicoes_comerciais")
        .select("codigo_ean, preco_apos_descontos")
        .eq("empresa_id", empresaData.id);

      // Buscar dados de estoque para a empresa 501
      const { data: estoqueData } = await supabase
        .from("estoque")
        .select("produto_id, qtd_disponivel, custo_un, livro")
        .eq("empresa_id", empresaData.id)
        .in("produto_id", produtosIds);

      // Criar mapa de preços por EAN
      const precosPorEan = new Map(
        condicoes?.map(c => [c.codigo_ean, c.preco_apos_descontos]) || []
      );

      // Criar mapa de EAN por produto ID
      const eanPorProduto = new Map(
        produtos?.map(p => [p.id, p.ean]) || []
      );

      // Criar mapa de estoque por produto ID
      const estoquePorProduto = new Map(
        estoqueData?.map(e => [e.produto_id, {
          qtd_disponivel: e.qtd_disponivel,
          custo_un: e.custo_un,
          livro: e.livro
        }]) || []
      );

      let currentPedidoId = pedidoId;

      // Se não estiver editando, criar novo pedido
      if (!currentPedidoId) {
        const { data: novoPedido, error: pedidoError } = await supabase
          .from("pedidos")
          .insert({
            empresa_id: empresaData.id,
            fornecedor_id: fornecedorData.id,
            status: "rascunho",
          })
          .select()
          .single();

        if (pedidoError) throw pedidoError;
        currentPedidoId = novoPedido.id;
      } else {
        // Se estiver editando, remover itens antigos
        await supabase
          .from("pedidos_itens")
          .delete()
          .eq("pedido_id", currentPedidoId);

        // Atualizar data de atualização do pedido
        await supabase
          .from("pedidos")
          .update({ data_atualizacao: new Date().toISOString() })
          .eq("id", currentPedidoId);
      }

      // Inserir itens do pedido
      const itensParaInserir = itensComQuantidade.map((item) => {
        const ean = eanPorProduto.get(item.produtoId);
        const precoNiv = ean ? precosPorEan.get(ean) : null;
        const estoque = estoquePorProduto.get(item.produtoId);

        return {
          pedido_id: currentPedidoId,
          produto_id: item.produtoId,
          qtd_pallet: item.qtdPallet,
          qtd_camada: item.qtdCamada,
          qtd_pedido: item.pedido,
          preco_cx_niv: precoNiv,
          estoque_atual: estoque?.qtd_disponivel || null,
          custo_atual: estoque?.custo_un || null,
          preco_atual: estoque?.livro || null,
        };
      });

      const { error: itensError } = await supabase
        .from("pedidos_itens")
        .insert(itensParaInserir);

      if (itensError) throw itensError;

      toast.success("Pedido salvo com sucesso!");
      navigate(`/pedido/501-hc`);
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      toast.error("Erro ao salvar pedido");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-foreground">Sugestão</h1>
            <p className="text-sm text-muted-foreground">Sugestões de compra baseadas em análise de vendas</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">Sugestão de Compra</CardTitle>
                  <CardDescription className="text-sm">
                    Análise de DDV e cálculo de pedidos baseado em histórico de vendas
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" disabled={isSaving} onClick={handleCreatePedido} className="flex-1 md:flex-none text-sm">
                    Criar Pedido
                  </Button>
                  <Button disabled={isSaving} onClick={handleSavePedido} className="flex-1 md:flex-none text-sm">
                    {isSaving ? "Salvando..." : "Salvar Pedido"}
                  </Button>
                </div>
              </div>
              
              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                  <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione empresa" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
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
                      <SelectValue placeholder="Selecione fornecedor" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
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
            <SugestaoTable 
              ref={tableRef}
              empresaCodigo={empresaSelecionada}
              fornecedorCodigo={fornecedorSelecionado}
              pedidoId={pedidoId || undefined}
              codigoOuEan={codigoOuEan}
              categoria={categoriaSelecionada}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Sugestao;
