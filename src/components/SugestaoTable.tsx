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
  codigoOuEan?: string;
  categoria?: string;
}

export interface SugestaoTableRef {
  getEditingData: () => any[];
  applyImportedData: (data: any[]) => void;
  applyImportedVerba: (data: any[]) => void;
}

const SugestaoTable = forwardRef<SugestaoTableRef, SugestaoTableProps>(
  ({ empresaCodigo, fornecedorCodigo, pedidoId, codigoOuEan = "", categoria = "" }, ref) => {
    const [editingRow, setEditingRow] = useState<{ [key: string]: { qtdPallet: number; qtdCamada: number; verbaUnid?: number } }>({});

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
          verbaUnid: editingRow[item.id]?.verbaUnid || 0,
        }));
      },
      applyImportedData: (data: any[]) => {
        // Aplicar dados importados ao editingRow
        const newEditingRow: { [key: string]: { qtdPallet: number; qtdCamada: number; verbaUnid?: number } } = {};
        
        data.forEach((importedItem) => {
          // Encontrar o item correspondente nas sugestões
          const sugestaoItem = sugestoes?.find(
            (s) => s.produtoId === importedItem.produtoId
          );
          
          if (sugestaoItem) {
            newEditingRow[sugestaoItem.id] = {
              qtdPallet: importedItem.qtdPallet || 0,
              qtdCamada: importedItem.qtdCamada || 0,
              verbaUnid: editingRow[sugestaoItem.id]?.verbaUnid || 0,
            };
          }
        });
        
        setEditingRow(newEditingRow);
      },
      applyImportedVerba: (data: any[]) => {
        // Aplicar verbas importadas ao editingRow
        setEditingRow((prev) => {
          const newEditingRow = { ...prev };
          
          data.forEach((importedItem) => {
            // Encontrar o item correspondente nas sugestões
            const sugestaoItem = sugestoes?.find(
              (s) => s.produtoId === importedItem.produtoId
            );
            
            if (sugestaoItem) {
              newEditingRow[sugestaoItem.id] = {
                ...prev[sugestaoItem.id],
                qtdPallet: prev[sugestaoItem.id]?.qtdPallet || 0,
                qtdCamada: prev[sugestaoItem.id]?.qtdCamada || 0,
                verbaUnid: importedItem.verbaUnid || 0,
              };
            }
          });
          
          return newEditingRow;
        });
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

    // Aplicar filtros
    const sugestoesFiltradas = sugestoes?.filter((item) => {
      // Filtro de código ou EAN
      if (codigoOuEan) {
        const searchLower = codigoOuEan.toLowerCase();
        const matchCodigo = item.codigoProduto.toLowerCase().includes(searchLower);
        const matchEan = item.ean.toLowerCase().includes(searchLower);
        if (!matchCodigo && !matchEan) return false;
      }
      
      // Filtro de categoria
      if (categoria && categoria !== "todas" && item.categoria !== categoria) {
        return false;
      }
      
      return true;
    });

    return (
    <div className="rounded-md border [&>div]:max-h-[70vh] [&>div]:overflow-auto">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow className="bg-slate-900 hover:bg-slate-900">
            <TableHead className="sticky top-0 left-0 z-50 bg-slate-900 min-w-[120px] text-slate-50 font-semibold text-center">COD<br/>PRODUTO</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 min-w-[140px] text-slate-50 font-semibold text-center">EAN</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 min-w-[320px] text-slate-50 font-semibold text-center">DESCRIÇÃO</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 min-w-[180px] text-slate-50 font-semibold text-center">CATEGORIA</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold min-w-[110px]">EMB<br/>COMPRA</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold min-w-[110px]">ESTOQUE</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold min-w-[110px]">PENDENTE</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 min-w-[140px] text-center text-slate-50 font-semibold">DDV Média<br/>último Mês</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 min-w-[140px] text-center text-slate-50 font-semibold">DDV Média<br/>3 Meses</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold min-w-[120px]">DIAS DE<br/>ESTOQUE</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold min-w-[100px]">MÊS<br/>-3</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold min-w-[100px]">MÊS<br/>-2</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold min-w-[100px]">MÊS<br/>-1</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold min-w-[100px]">Mês<br/>Atual</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold min-w-[100px]">PEDIDO</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center min-w-[120px] text-slate-50 font-semibold">QTD<br/>PALLET</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center min-w-[120px] text-slate-50 font-semibold">QTD<br/>CAMADA</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 min-w-[120px] text-center text-slate-50 font-semibold">QTD no<br/>Pallet</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 min-w-[120px] text-center text-slate-50 font-semibold">QTD na<br/>Camada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sugestoesFiltradas?.map((item, index) => {
            const pedido = calcularPedido(item);
            return (
              <TableRow 
                key={item.id}
                className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
              >
                <TableCell className="sticky left-0 z-40 bg-inherit font-mono text-xs border-r border-muted/40 min-w-[120px]">{item.codigoProduto}</TableCell>
                <TableCell className="font-mono text-xs min-w-[140px]">{item.ean}</TableCell>
                <TableCell className="text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[320px] min-w-[320px]">{item.descricao}</TableCell>
                <TableCell className="text-xs text-muted-foreground min-w-[180px]">{item.categoria}</TableCell>
                <TableCell className="text-right font-medium min-w-[110px]">{item.embCompra}</TableCell>
                <TableCell className="text-right font-medium bg-orange-50 dark:bg-orange-950/30 min-w-[110px]">
                  {item.estoque.toFixed(0)}
                </TableCell>
                <TableCell className="text-right font-medium bg-orange-50 dark:bg-orange-950/30 min-w-[110px]">
                  {item.pendente.toFixed(0)}
                </TableCell>
                <TableCell className={`text-right min-w-[140px] ${getDiasEstoqueColorClass(item.diasEstoque)}`}>
                  {item.ddvUltimoMes !== null ? item.ddvUltimoMes : "-"}
                </TableCell>
                <TableCell className={`text-right min-w-[140px] ${getDiasEstoqueColorClass(item.diasEstoque)}`}>
                  {item.ddv3Meses !== null ? item.ddv3Meses : "-"}
                </TableCell>
                <TableCell className={`text-right font-bold min-w-[120px] ${getDiasEstoqueColorClass(item.diasEstoque)}`}>
                  {item.diasEstoque !== null ? item.diasEstoque.toFixed(0) : "-"}
                </TableCell>
                <TableCell className="text-right min-w-[100px]">{item.mes3.toFixed(0)}</TableCell>
                <TableCell className="text-right min-w-[100px]">{item.mes2.toFixed(0)}</TableCell>
                <TableCell className="text-right min-w-[100px]">{item.mes1.toFixed(0)}</TableCell>
                <TableCell className="text-right min-w-[100px]">{item.mesAtual.toFixed(0)}</TableCell>
                <TableCell className="text-right font-bold bg-orange-50 dark:bg-orange-950/30 min-w-[100px]">
                  {pedido}
                </TableCell>
                <TableCell className="text-center min-w-[120px]">
                  <Input
                    type="number"
                    min="0"
                    className="w-20 h-7 text-center font-bold text-base bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-300 dark:border-blue-700 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={editingRow[item.id]?.qtdPallet || ""}
                    onChange={(e) => handleQtdChange(item.id, "qtdPallet", e.target.value)}
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-center min-w-[120px]">
                  <Input
                    type="number"
                    min="0"
                    className="w-20 h-7 text-center font-bold text-base bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-300 dark:border-blue-700 focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={editingRow[item.id]?.qtdCamada || ""}
                    onChange={(e) => handleQtdChange(item.id, "qtdCamada", e.target.value)}
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-right text-muted-foreground min-w-[120px]">{item.caixasPorPallet}</TableCell>
                <TableCell className="text-right text-muted-foreground min-w-[120px]">{item.caixasPorCamada}</TableCell>
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
