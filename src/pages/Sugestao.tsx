import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import SugestaoTable from "@/components/SugestaoTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Sugestao = () => {
  const { tipo } = useParams<{ tipo: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const pedidoId = searchParams.get('pedido');
  const [isSaving, setIsSaving] = useState(false);
  const tableRef = useRef<{ getEditingData: () => any[] }>(null);

  const tipoConfig: Record<string, { nome: string; empresaCodigo: string }> = {
    "501-hc": { nome: "501 - HC", empresaCodigo: "501" },
  };

  const config = tipo ? tipoConfig[tipo] : null;

  const handleCreatePedido = () => {
    setSearchParams({});
    toast.success("Novo pedido iniciado");
  };

  const handleSavePedido = async () => {
    if (!config || !tableRef.current) return;
    
    setIsSaving(true);
    try {
      // Buscar empresa e fornecedor IDs
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("id")
        .eq("codigo", config.empresaCodigo)
        .single();

      const { data: fornecedorData } = await supabase
        .from("fornecedores")
        .select("id")
        .eq("codigo", "1941")
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
  
  if (!config) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Tipo de sugestão não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Lightbulb className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sugestão - {config.nome}</h1>
              <p className="text-muted-foreground">Sugestões de compra baseadas em análise de vendas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sugestão de Compra - {config.nome}</CardTitle>
                <CardDescription>
                  Análise de DDV e cálculo de pedidos baseado em histórico de vendas
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled={isSaving} onClick={handleCreatePedido}>
                  Criar Pedido
                </Button>
                <Button disabled={isSaving} onClick={handleSavePedido}>
                  {isSaving ? "Salvando..." : "Salvar Pedido"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SugestaoTable 
              ref={tableRef}
              empresaCodigo={config.empresaCodigo} 
              pedidoId={pedidoId || undefined}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Sugestao;
