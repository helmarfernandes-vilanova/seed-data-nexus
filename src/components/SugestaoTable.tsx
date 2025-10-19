import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";

interface SugestaoTableProps {
  empresaCodigo: string;
}

const SugestaoTable = ({ empresaCodigo }: SugestaoTableProps) => {
  const queryClient = useQueryClient();
  const [editingRow, setEditingRow] = useState<{ [key: string]: { qtdPallet: number; qtdCamada: number } }>({});

  const { data: sugestoes, isLoading } = useQuery({
    queryKey: ["sugestao", empresaCodigo],
    queryFn: async () => {
      // Buscar empresa ID
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("id")
        .eq("codigo", empresaCodigo)
        .single();

      if (!empresaData) throw new Error("Empresa não encontrada");

      // Buscar fornecedor 1941
      const { data: fornecedorData } = await supabase
        .from("fornecedores")
        .select("id")
        .eq("codigo", "1941")
        .single();

      if (!fornecedorData) throw new Error("Fornecedor 1941 não encontrado");

      // Buscar estoque com produtos filtrado por fornecedor 1941 e empresa 501
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
        const condicao = condicoesData?.find(
          (c) => c.codigo_sku === item.produto?.codigo
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

  const calcularPedido = (item: any) => {
    const editing = editingRow[item.id] || { qtdPallet: 0, qtdCamada: 0 };
    const pedidoPallet = editing.qtdPallet > 0 ? editing.qtdPallet * item.caixasPorPallet : 0;
    const pedidoCamada = editing.qtdCamada > 0 ? editing.qtdCamada * item.caixasPorCamada : 0;
    return pedidoPallet + pedidoCamada;
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px]">Cód Produto</TableHead>
            <TableHead className="min-w-[120px]">EAN</TableHead>
            <TableHead className="min-w-[200px]">Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Emb Compra</TableHead>
            <TableHead className="text-right">Estoque</TableHead>
            <TableHead className="text-right">Pendente</TableHead>
            <TableHead className="text-right">DDV Média Último Mês</TableHead>
            <TableHead className="text-right">DDV Média 3 Meses</TableHead>
            <TableHead className="text-right">Dias Estoque</TableHead>
            <TableHead className="text-right">Mês -3</TableHead>
            <TableHead className="text-right">Mês -2</TableHead>
            <TableHead className="text-right">Mês -1</TableHead>
            <TableHead className="text-right">Mês Atual</TableHead>
            <TableHead className="text-right">Pedido</TableHead>
            <TableHead className="text-center min-w-[100px]">Qtd Pallet</TableHead>
            <TableHead className="text-center min-w-[100px]">Qtd Camada</TableHead>
            <TableHead className="text-right">Qtd no Pallet</TableHead>
            <TableHead className="text-right">Qtd na Camada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sugestoes?.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.codigoProduto}</TableCell>
              <TableCell>{item.ean}</TableCell>
              <TableCell>{item.descricao}</TableCell>
              <TableCell>{item.categoria}</TableCell>
              <TableCell className="text-right">{item.embCompra}</TableCell>
              <TableCell className="text-right">{item.estoque.toFixed(0)}</TableCell>
              <TableCell className="text-right">{item.pendente.toFixed(0)}</TableCell>
              <TableCell className="text-right">
                {item.ddvUltimoMes !== null ? item.ddvUltimoMes : "-"}
              </TableCell>
              <TableCell className="text-right">
                {item.ddv3Meses !== null ? item.ddv3Meses : "-"}
              </TableCell>
              <TableCell className="text-right">
                {item.diasEstoque !== null ? item.diasEstoque.toFixed(0) : "-"}
              </TableCell>
              <TableCell className="text-right">{item.mes3.toFixed(0)}</TableCell>
              <TableCell className="text-right">{item.mes2.toFixed(0)}</TableCell>
              <TableCell className="text-right">{item.mes1.toFixed(0)}</TableCell>
              <TableCell className="text-right">{item.mesAtual.toFixed(0)}</TableCell>
              <TableCell className="text-right font-medium">
                {calcularPedido(item)}
              </TableCell>
              <TableCell className="text-center">
                <Input
                  type="number"
                  min="0"
                  className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={editingRow[item.id]?.qtdPallet || ""}
                  onChange={(e) => handleQtdChange(item.id, "qtdPallet", e.target.value)}
                  placeholder="0"
                />
              </TableCell>
              <TableCell className="text-center">
                <Input
                  type="number"
                  min="0"
                  className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={editingRow[item.id]?.qtdCamada || ""}
                  onChange={(e) => handleQtdChange(item.id, "qtdCamada", e.target.value)}
                  placeholder="0"
                />
              </TableCell>
              <TableCell className="text-right">{item.caixasPorPallet}</TableCell>
              <TableCell className="text-right">{item.caixasPorCamada}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SugestaoTable;
