import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const PedidoDetalhes = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editedVerbas, setEditedVerbas] = useState<Record<string, number>>({});

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

      // Buscar ID da empresa 501
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("id")
        .eq("codigo", "501")
        .single();

      if (!empresaData) {
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
          precoNf: null,
          verbaUnid: item.verba_unid || 0,
          estoqueAtual: item.estoque_atual,
          custoAtual: item.custo_atual,
          precoAtual: item.preco_atual,
        })) || [];
      }

      // Buscar preços unitários da empresa 501
      const eans = data?.map(item => item.produto?.ean).filter(Boolean) || [];
      
      if (eans.length === 0) {
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
          precoNf: null,
          verbaUnid: item.verba_unid || 0,
          estoqueAtual: item.estoque_atual,
          custoAtual: item.custo_atual,
          precoAtual: item.preco_atual,
        })) || [];
      }

      const { data: condicoesData } = await supabase
        .from("condicoes_comerciais")
        .select("codigo_ean, preco_unitario")
        .in("codigo_ean", eans)
        .eq("empresa_id", empresaData.id);

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
        verbaUnid: item.verba_unid || 0,
        estoqueAtual: item.estoque_atual,
        custoAtual: item.custo_atual,
        precoAtual: item.preco_atual,
      })) || [];
    },
    enabled: !!pedidoId,
  });

  const updateVerbasMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; verba_unid: number }>) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("pedidos_itens")
          .update({ verba_unid: update.verba_unid })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedido-itens", pedidoId] });
      setEditedVerbas({});
      toast.success("Verbas atualizadas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar verbas");
    },
  });

  const handleSaveVerbas = () => {
    const updates = Object.entries(editedVerbas).map(([id, verba_unid]) => ({
      id,
      verba_unid,
    }));

    if (updates.length > 0) {
      updateVerbasMutation.mutate(updates);
    }
  };

  const handleVerbaChange = (itemId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedVerbas((prev) => ({
      ...prev,
      [itemId]: numValue,
    }));
  };

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
      <main className="container mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-6">
        {/* Card de Resumo */}
        <Card className="bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="text-lg md:text-2xl">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
              {(() => {
                // Calcular totais
                let totalNfSum = 0;
                let totalNivSum = 0;
                let totalVerbaSum = 0;
                let totalCargasSum = 0;

                itens?.forEach((item) => {
                  const currentVerbaUnid = editedVerbas[item.id] ?? item.verbaUnid ?? 0;
                  const verbaCx = currentVerbaUnid && item.embCompra && (currentVerbaUnid * item.embCompra) !== 0
                    ? currentVerbaUnid * item.embCompra
                    : null;

                  const totalNf = item.qtdPedido && item.precoNf
                    ? item.qtdPedido * Number(item.precoNf)
                    : 0;
                  const totalNiv = item.precoNiv && item.qtdPedido
                    ? (Number(item.precoNiv) * item.qtdPedido) || 0
                    : 0;
                  const totalVerba = verbaCx && item.qtdPedido
                    ? (verbaCx * item.qtdPedido) || 0
                    : 0;
                  const cargas = item.qtdPallet ? item.qtdPallet / 28 : 0;

                  totalNfSum += totalNf;
                  totalNivSum += totalNiv;
                  totalVerbaSum += totalVerba;
                  totalCargasSum += cargas;
                });

                const percentInvestimento = totalNivSum > 0 ? (totalVerbaSum / totalNivSum) * 100 : 0;

                return (
                  <>
                    <div className="space-y-1 md:space-y-2">
                      <div className="text-xs md:text-sm font-medium text-muted-foreground">NF</div>
                      <div className="text-lg md:text-2xl font-bold">
                        R$ {totalNfSum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <div className="text-xs md:text-sm font-medium text-muted-foreground">NIV</div>
                      <div className="text-lg md:text-2xl font-bold">
                        R$ {totalNivSum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <div className="text-xs md:text-sm font-medium text-muted-foreground">INVESTIMENTO</div>
                      <div className="text-lg md:text-2xl font-bold">
                        R$ {totalVerbaSum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <div className="text-xs md:text-sm font-medium text-muted-foreground">% INVESTIMENTO</div>
                      <div className="text-lg md:text-2xl font-bold">
                        {percentInvestimento.toFixed(2)}%
                      </div>
                    </div>
                    <div className="space-y-1 md:space-y-2 col-span-2 md:col-span-1">
                      <div className="text-xs md:text-sm font-medium text-muted-foreground">TOTAL CARGAS</div>
                      <div className="text-lg md:text-2xl font-bold">
                        {totalCargasSum.toFixed(2)}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Card de Itens */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl">Itens do Pedido</CardTitle>
                <CardDescription className="text-sm">
                  Status: <span className="capitalize font-medium">{pedido.status}</span>
                  {pedido.observacoes && ` • ${pedido.observacoes}`}
                </CardDescription>
              </div>
              {Object.keys(editedVerbas).length > 0 && (
                <Button onClick={handleSaveVerbas} disabled={updateVerbasMutation.isPending} className="text-sm">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              )}
            </div>
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
                    <TableRow className="bg-slate-900 hover:bg-slate-900 h-14">
                      <TableHead className="min-w-[100px] text-slate-50 font-semibold py-2 text-center">CÓD<br/>PRODUTO</TableHead>
                      <TableHead className="min-w-[120px] text-slate-50 font-semibold py-2 text-center">EAN</TableHead>
                      <TableHead className="min-w-[200px] text-slate-50 font-semibold py-2 text-center">DESCRIÇÃO</TableHead>
                      <TableHead className="text-slate-50 font-semibold py-2 text-center">CATEGORIA</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">EMB<br/>COMPRA</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">PÇCX<br/>NIV</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">PÇUN<br/>NIV</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">PÇCX<br/>NF</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">PÇUN<br/>NF</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">DESC<br/>NF</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">VERBA<br/>UNID</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">VERBA<br/>CX</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">PREÇO<br/>FINAL</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">TOTAL<br/>PEDIDO</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">ESTOQUE</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">NOVO<br/>ESTOQUE</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">CUSTO<br/>ATUAL</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">NOVO<br/>CUSTO</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">PREÇO<br/>ATUAL</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">QTD<br/>PALLET</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">QTD<br/>CAMADA</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">TOTAL<br/>PALLET</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">CARGAS</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">TOTAL<br/>NF</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">TOTAL<br/>NIV</TableHead>
                      <TableHead className="text-center text-slate-50 font-semibold py-2">TOTAL<br/>VERBA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => {
                      // Use edited value if available, otherwise use stored value
                      const currentVerbaUnid = editedVerbas[item.id] ?? item.verbaUnid ?? 0;
                      
                      const precoUnidNiv = item.embCompra && item.precoNiv
                        ? Number(item.precoNiv) / item.embCompra
                        : null;
                      
                      const precoUnidNf = item.embCompra && item.precoNf
                        ? Number(item.precoNf) / item.embCompra
                        : null;

                      // Verba cx: SE(R9*H9=0; ""; R9*H9)
                      const verbaCx = currentVerbaUnid && item.embCompra && (currentVerbaUnid * item.embCompra) !== 0
                        ? currentVerbaUnid * item.embCompra
                        : null;
                      
                      // Desc off NF: SE(I9=0; ""; SE(R9=0; ""; SE(S9/I9=0; ""; S9/I9)))
                      const descOffNf = item.precoNiv && Number(item.precoNiv) !== 0 && 
                                       currentVerbaUnid && currentVerbaUnid !== 0 && 
                                       verbaCx && verbaCx !== 0
                        ? verbaCx / Number(item.precoNiv)
                        : null;

                      // Preço final: SE(L9=""; ""; M9-R9)
                      const precoFinal = item.precoNf && precoUnidNf && currentVerbaUnid
                        ? precoUnidNf - currentVerbaUnid
                        : null;

                      // Novo Estoque: SE(ÉERROS(SOMA(V9;U9)); ""; SOMA(V9;U9))
                      const novoEstoque = item.estoqueAtual != null && item.qtdPedido
                        ? Number(item.estoqueAtual) + item.qtdPedido
                        : null;

                      // Novo Custo: SE(ÉERROS(((V9*X9)+(T9*U9))/(W9)); ""; ((V9*X9)+(T9*U9))/(W9))
                      const novoCusto = item.estoqueAtual != null && 
                                       item.custoAtual != null && 
                                       precoFinal != null && 
                                       novoEstoque && 
                                       novoEstoque > 0
                        ? ((Number(item.estoqueAtual) * Number(item.custoAtual)) + 
                           (precoFinal * item.qtdPedido)) / novoEstoque
                        : null;

                      // Cargas: SE(ÉERROS(AA9/28);"";AA9/28)
                      const cargas = item.qtdPallet ? item.qtdPallet / 28 : null;

                      // Total NF: SE(A9; SE(U9; U9*L9; ""); "")
                      const totalNf = item.qtdPedido && item.precoNf
                        ? item.qtdPedido * Number(item.precoNf)
                        : null;

                      // Total NIV: SE(ÉERROS(I9*U9); ""; SE(I9*U9=0; ""; I9*U9))
                      const totalNiv = item.precoNiv && item.qtdPedido
                        ? (Number(item.precoNiv) * item.qtdPedido) || null
                        : null;

                      // Total VERBA: SE(ÉERROS(S9*U9); ""; SE(S9*U9=0; ""; S9*U9))
                      const totalVerba = verbaCx && item.qtdPedido
                        ? (verbaCx * item.qtdPedido) || null
                        : null;

                      return (
                        <TableRow 
                          key={item.id}
                          className={`h-9 ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                        >
                          <TableCell className="font-mono text-xs py-1">{item.codigoProduto}</TableCell>
                          <TableCell className="font-mono text-xs py-1">{item.ean}</TableCell>
                          <TableCell className="text-sm py-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{item.descricao}</TableCell>
                          <TableCell className="text-xs text-muted-foreground py-1">{item.categoria}</TableCell>
                          <TableCell className="text-right font-medium py-1">{item.embCompra}</TableCell>
                          <TableCell className="text-right py-1">
                            {item.precoNiv ? Number(item.precoNiv).toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {precoUnidNiv && precoUnidNiv > 0
                              ? precoUnidNiv.toFixed(2)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {item.precoNf ? Number(item.precoNf).toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {precoUnidNf && precoUnidNf > 0
                              ? precoUnidNf.toFixed(2)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {descOffNf ? `${(descOffNf * 100).toFixed(2)}%` : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentVerbaUnid || ""}
                              onChange={(e) => handleVerbaChange(item.id, e.target.value)}
                              className="w-20 h-7 text-right text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {verbaCx ? verbaCx.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {precoFinal ? precoFinal.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium py-1">
                            {item.qtdPedido}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {item.estoqueAtual != null ? item.estoqueAtual : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {novoEstoque != null ? novoEstoque : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {item.custoAtual != null ? Number(item.custoAtual).toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {novoCusto ? novoCusto.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {item.precoAtual != null ? Number(item.precoAtual).toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-center py-1">{item.qtdPallet}</TableCell>
                          <TableCell className="text-center py-1">{item.qtdCamada}</TableCell>
                          <TableCell className="text-right py-1">{item.qtdPallet}</TableCell>
                          <TableCell className="text-right py-1">
                            {cargas ? cargas.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {totalNf ? totalNf.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {totalNiv ? totalNiv.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {totalVerba ? totalVerba.toFixed(2) : "-"}
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
