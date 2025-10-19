import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface SugestaoTableProps {
  empresaCodigo: string;
  fornecedorCodigo: string;
  pedidoId?: string;
}

export interface SugestaoTableRef {
  getEditingData: () => any[];
}

const SugestaoTable = forwardRef<SugestaoTableRef, SugestaoTableProps>(
  ({ empresaCodigo, fornecedorCodigo, pedidoId }, ref) => {
    const [editingRow, setEditingRow] = useState<{ [key: string]: { qtdPallet: number; qtdCamada: number } }>({});

    const { data: sugestoes, isLoading } = useQuery({
      queryKey: ["sugestao", empresaCodigo, fornecedorCodigo],
      queryFn: async () => {
        // Buscar empresa ID
        const { data: empresaData } = await supabase
          .from("empresas")
          .select("id")
          .eq("codigo", empresaCodigo)
          .single();

        if (!empresaData) throw new Error("Empresa não encontrada");

        // Buscar fornecedor selecionado
        const { data: fornecedorData } = await supabase
          .from("fornecedores")
          .select("id")
          .eq("codigo", fornecedorCodigo)
          .single();

        if (!fornecedorData) throw new Error("Fornecedor não encontrado");

        // Buscar estoque com produtos filtrado por fornecedor selecionado e empresa
        const { data: estoqueData, error: estoqueError } = await supabase
          .from("estoque")
          .select(`
            *,
            produto:produtos!inner(
              codigo,
              ean,
              descricao,
              qt_cx_compra,
              fornecedor_id,
              categoria:categorias(nome)
            )
          `)
          .eq("empresa_id", empresaData.id)
          .eq("produto.fornecedor_id", fornecedorData.id);

        if (estoqueError) throw estoqueError;

        // Buscar condições comerciais para empresa 501
        const { data: condicoesData } = await supabase
          .from("condicoes_comerciais")
          .select("*")
          .eq("empresa_id", empresaData.id);

        // Combinar dados e calcular métricas
        return estoqueData?.map((item) => {
          // Buscar condição comercial pelo código do produto
          const condicao = condicoesData?.find(
            (c) => c.codigo_sku === item.produto?.codigo || c.codigo_ean === item.produto?.ean
          );
          
          console.log('Produto:', item.produto?.codigo, 'Condição encontrada:', condicao);

          // DDV Média último Mês: SOMA(estoque + pendente + ?) / (mes_1 / 30)
          const somaEstoquePendente = (item.qtd_disponivel || 0) + (item.pendente || 0);
          const ddvUltimoMes = item.m_1 && item.m_1 > 0
            ? somaEstoquePendente / (item.m_1 / 30)
            : null;

          // DDV Média 3 Meses: SOMA(estoque + pendente) / ((SOMA(m_1 + m_2 + m_3) / 3) / 30)
          const somaM123 = (item.m_1 || 0) + (item.m_2 || 0) + (item.m_3 || 0);
          const mediaM123 = somaM123 / 3;
          const ddv3Meses = mediaM123 > 0
            ? somaEstoquePendente / (mediaM123 / 30)
            : null;

          return {
            id: item.id,
            produtoId: item.produto_id,
            codigoProduto: item.produto?.codigo || "",
            ean: item.produto?.ean || "",
            descricao: item.produto?.descricao || "",
            categoria: item.produto?.categoria?.nome || "",
            embCompra: item.produto?.qt_cx_compra || 0,
            estoque: item.qtd_disponivel || 0,
            pendente: item.pendente || 0,
            ddvUltimoMes: ddvUltimoMes ? Number(ddvUltimoMes.toFixed(2)) : null,
            ddv3Meses: ddv3Meses ? Number(ddv3Meses.toFixed(2)) : null,
            diasEstoque: item.dias_estoque || 0,
            mes3: item.m_3 || 0,
            mes2: item.m_2 || 0,
            mes1: item.m_1 || 0,
            mesAtual: item.m_0 || 0,
            caixasPorPallet: condicao?.caixas_por_pallet || 0,
            caixasPorCamada: condicao?.caixas_por_camada || 0,
            qtdPallet: 0,
            qtdCamada: 0,
          };
        }) || [];
      },
    });

    // Carregar dados do pedido se estiver editando
    useEffect(() => {
      if (pedidoId && sugestoes) {
        const loadPedidoData = async () => {
          const { data: itens } = await supabase
            .from("pedidos_itens")
            .select("produto_id, qtd_pallet, qtd_camada")
            .eq("pedido_id", pedidoId);

          if (itens) {
            const editData: { [key: string]: { qtdPallet: number; qtdCamada: number } } = {};
            // Mapear produto_id para estoque.id
            itens.forEach((item) => {
              if (item.produto_id) {
                // Encontrar o item de sugestão correspondente
                const sugestaoItem = sugestoes.find(
                  (sug) => sug.produtoId === item.produto_id
                );
                if (sugestaoItem) {
                  editData[sugestaoItem.id] = {
                    qtdPallet: item.qtd_pallet,
                    qtdCamada: item.qtd_camada,
                  };
                }
              }
            });
            setEditingRow(editData);
          }
        };
        loadPedidoData();
      }
    }, [pedidoId, sugestoes]);

    const calcularPedido = (item: any) => {
      const editing = editingRow[item.id] || { qtdPallet: 0, qtdCamada: 0 };
      const pedidoPallet = editing.qtdPallet > 0 ? editing.qtdPallet * item.caixasPorPallet : 0;
      const pedidoCamada = editing.qtdCamada > 0 ? editing.qtdCamada * item.caixasPorCamada : 0;
      return pedidoPallet + pedidoCamada;
    };

    // Expor função para obter dados editados
    useImperativeHandle(ref, () => ({
      getEditingData: () => {
        if (!sugestoes) return [];
        return sugestoes.map((item) => ({
          id: item.id,
          produtoId: item.produtoId,
          qtdPallet: editingRow[item.id]?.qtdPallet || 0,
          qtdCamada: editingRow[item.id]?.qtdCamada || 0,
          pedido: calcularPedido(item),
        }));
      },
    }));

    const handleQtdChange = (id: string, field: "qtdPallet" | "qtdCamada", value: string) => {
      const numValue = parseInt(value) || 0;
      setEditingRow((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: numValue,
        },
      }));
    };

    // Função para determinar cor de fundo baseada em Dias de Estoque
    const getDiasEstoqueColorClass = (diasEstoque: number) => {
      if (diasEstoque < 10) return "bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100 font-medium";
      if (diasEstoque <= 30) return "bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 font-medium";
      return "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100 font-medium";
    };

    if (isLoading) {
      return <div className="text-center py-8">Carregando...</div>;
    }

    return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-900 hover:bg-slate-900 h-14">
            <TableHead className="min-w-[100px] text-slate-50 font-semibold py-2">Cód<br/>Produto</TableHead>
            <TableHead className="min-w-[120px] text-slate-50 font-semibold py-2">EAN</TableHead>
            <TableHead className="min-w-[300px] text-slate-50 font-semibold py-2">Descrição</TableHead>
            <TableHead className="text-slate-50 font-semibold py-2">Categoria</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Emb<br/>Compra</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Estoque</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Pendente</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">DDV Média<br/>Último Mês</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">DDV Média<br/>3 Meses</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Dias<br/>Estoque</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Mês<br/>-3</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Mês<br/>-2</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Mês<br/>-1</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Mês<br/>Atual</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Pedido</TableHead>
            <TableHead className="text-center min-w-[100px] text-slate-50 font-semibold py-2">Qtd<br/>Pallet</TableHead>
            <TableHead className="text-center min-w-[100px] text-slate-50 font-semibold py-2">Qtd<br/>Camada</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Qtd no<br/>Pallet</TableHead>
            <TableHead className="text-right text-slate-50 font-semibold py-2">Qtd na<br/>Camada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sugestoes?.map((item, index) => {
            const pedido = calcularPedido(item);
            return (
              <TableRow 
                key={item.id}
                className={`h-9 ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
              >
                <TableCell className="font-mono text-xs py-1">{item.codigoProduto}</TableCell>
                <TableCell className="font-mono text-xs py-1">{item.ean}</TableCell>
                <TableCell className="text-sm py-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{item.descricao}</TableCell>
                <TableCell className="text-xs text-muted-foreground py-1">{item.categoria}</TableCell>
                <TableCell className="text-right font-medium py-1">{item.embCompra}</TableCell>
                <TableCell className="text-right font-medium bg-orange-50 dark:bg-orange-950/30 py-1">
                  {item.estoque.toFixed(0)}
                </TableCell>
                <TableCell className="text-right font-medium bg-orange-50 dark:bg-orange-950/30 py-1">
                  {item.pendente.toFixed(0)}
                </TableCell>
                <TableCell className={`text-right py-1 ${getDiasEstoqueColorClass(item.diasEstoque)}`}>
                  {item.ddvUltimoMes !== null ? item.ddvUltimoMes : "-"}
                </TableCell>
                <TableCell className={`text-right py-1 ${getDiasEstoqueColorClass(item.diasEstoque)}`}>
                  {item.ddv3Meses !== null ? item.ddv3Meses : "-"}
                </TableCell>
                <TableCell className={`text-right font-bold py-1 ${getDiasEstoqueColorClass(item.diasEstoque)}`}>
                  {item.diasEstoque !== null ? item.diasEstoque.toFixed(0) : "-"}
                </TableCell>
                <TableCell className="text-right py-1">{item.mes3.toFixed(0)}</TableCell>
                <TableCell className="text-right py-1">{item.mes2.toFixed(0)}</TableCell>
                <TableCell className="text-right py-1">{item.mes1.toFixed(0)}</TableCell>
                <TableCell className="text-right py-1">{item.mesAtual.toFixed(0)}</TableCell>
                <TableCell className="text-right font-bold bg-orange-50 dark:bg-orange-950/30 py-1">
                  {pedido}
                </TableCell>
                <TableCell className="text-center py-1">
                  <Input
                    type="number"
                    min="0"
                    className="w-20 h-7 text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={editingRow[item.id]?.qtdPallet || ""}
                    onChange={(e) => handleQtdChange(item.id, "qtdPallet", e.target.value)}
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-center py-1">
                  <Input
                    type="number"
                    min="0"
                    className="w-20 h-7 text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={editingRow[item.id]?.qtdCamada || ""}
                    onChange={(e) => handleQtdChange(item.id, "qtdCamada", e.target.value)}
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-right text-muted-foreground py-1">{item.caixasPorPallet}</TableCell>
                <TableCell className="text-right text-muted-foreground py-1">{item.caixasPorCamada}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

SugestaoTable.displayName = "SugestaoTable";

export default SugestaoTable;
