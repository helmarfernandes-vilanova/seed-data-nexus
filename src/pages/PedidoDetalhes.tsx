import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, ArrowLeft } from "lucide-react";

const PedidoDetalhes = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();

  const { data: pedido, isLoading: pedidoLoading } = useQuery({
    queryKey: ["pedido", pedidoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!pedidoId,
  });

  const { data: itens, isLoading: itensLoading } = useQuery({
    queryKey: ["pedido-itens", pedidoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos_itens")
        .select(`
          *,
          produto:produtos(
            codigo,
            ean,
            descricao,
            qt_cx_compra,
            categoria:categorias(nome)
          )
        `)
        .eq("pedido_id", pedidoId);

      if (error) throw error;

      // Buscar preços unitários da empresa 501
      const eans = data?.map(item => item.produto?.ean).filter(Boolean) || [];
      const { data: condicoesData } = await supabase
        .from("condicoes_comerciais")
        .select("codigo_ean, preco_unitario")
        .in("codigo_ean", eans)
        .eq("empresa_id", (await supabase
          .from("empresas")
          .select("id")
          .eq("codigo", "501")
          .single()
        ).data?.id || "");

      const condicoesMap = new Map(
        condicoesData?.map(c => [c.codigo_ean, c.preco_unitario]) || []
      );

      return data?.map((item) => ({
        id: item.id,
        codigoProduto: item.produto?.codigo || "",
        ean: item.produto?.ean || "",
        descricao: item.produto?.descricao || "",
        categoria: item.produto?.categoria?.nome || "",
        embCompra: item.produto?.qt_cx_compra || 0,
        qtdPallet: item.qtd_pallet,
        qtdCamada: item.qtd_camada,
        qtdPedido: item.qtd_pedido,
        precoNiv: item.preco_cx_niv,
        precoNf: item.produto?.ean ? condicoesMap.get(item.produto.ean) : null,
      })) || [];
    },
    enabled: !!pedidoId,
  });

  if (pedidoLoading || itensLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Pedido não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pedido/501-hc")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Detalhes do Pedido</h1>
              <p className="text-muted-foreground">
                Criado em {new Date(pedido.data_criacao).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
            <CardDescription>
              Status: <span className="capitalize font-medium">{pedido.status}</span>
              {pedido.observacoes && ` • ${pedido.observacoes}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!itens || itens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum item encontrado neste pedido
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Cód Produto</TableHead>
                      <TableHead className="min-w-[120px]">EAN</TableHead>
                      <TableHead className="min-w-[200px]">Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Emb Compra</TableHead>
                      <TableHead className="text-right">Preço cx NIV</TableHead>
                      <TableHead className="text-right">Preço unid NIV</TableHead>
                      <TableHead className="text-right">Preço cx NF</TableHead>
                      <TableHead className="text-center">Qtd Pallet</TableHead>
                      <TableHead className="text-center">Qtd Camada</TableHead>
                      <TableHead className="text-right">Total Pedido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => {
                      const precoUnidNiv = item.embCompra && item.precoNiv
                        ? Number(item.precoNiv) / item.embCompra
                        : null;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.codigoProduto}</TableCell>
                          <TableCell>{item.ean}</TableCell>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell>{item.categoria}</TableCell>
                          <TableCell className="text-right">{item.embCompra}</TableCell>
                          <TableCell className="text-right">
                            {item.precoNiv ? `R$ ${item.precoNiv.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {precoUnidNiv && precoUnidNiv > 0
                              ? `R$ ${precoUnidNiv.toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.precoNf ? `R$ ${Number(item.precoNf).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-center">{item.qtdPallet}</TableCell>
                          <TableCell className="text-center">{item.qtdCamada}</TableCell>
                          <TableCell className="text-right font-medium">
                            {item.qtdPedido}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PedidoDetalhes;
