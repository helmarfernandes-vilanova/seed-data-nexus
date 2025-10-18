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
import { Skeleton } from "@/components/ui/skeleton";

interface CondicoesTableProps {
  empresaCodigo: string;
}

const CondicoesTable = ({ empresaCodigo }: CondicoesTableProps) => {
  const { data: condicoes, isLoading } = useQuery({
    queryKey: ["condicoes", empresaCodigo],
    queryFn: async () => {
      // Buscar o ID da empresa pelo código
      const { data: empresa } = await supabase
        .from("empresas")
        .select("id")
        .eq("codigo", empresaCodigo)
        .single();

      if (!empresa) return [];

      const { data, error } = await supabase
        .from("condicoes_comerciais")
        .select("*")
        .eq("empresa_id", empresa.id)
        .order("descricao");

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!condicoes || condicoes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma condição comercial cadastrada para esta empresa. Use o botão de importação para adicionar dados.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código EAN</TableHead>
            <TableHead>Código SKU</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Itens/Cx</TableHead>
            <TableHead className="text-right">Preço após Desc.</TableHead>
            <TableHead className="text-right">Preço c/ Impostos</TableHead>
            <TableHead className="text-right">Preço Unitário</TableHead>
            <TableHead className="text-right">TON/EAN</TableHead>
            <TableHead className="text-right">NIV/EAN</TableHead>
            <TableHead className="text-right">Cx/Camada</TableHead>
            <TableHead className="text-right">Cx/Pallet</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {condicoes.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.codigo_ean || "-"}</TableCell>
              <TableCell className="font-mono text-sm">{item.codigo_sku}</TableCell>
              <TableCell className="max-w-xs truncate">{item.descricao}</TableCell>
              <TableCell>{item.categoria || "-"}</TableCell>
              <TableCell className="text-right">{item.itens_por_caixa || "-"}</TableCell>
              <TableCell className="text-right">
                {item.preco_apos_descontos ? `R$ ${Number(item.preco_apos_descontos).toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-right">
                {item.preco_com_impostos ? `R$ ${Number(item.preco_com_impostos).toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-right">
                {item.preco_unitario ? `R$ ${Number(item.preco_unitario).toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-right">
                {item.ton_por_ean ? Number(item.ton_por_ean).toFixed(2) : "-"}
              </TableCell>
              <TableCell className="text-right">
                {item.niv_por_ean ? Number(item.niv_por_ean).toFixed(2) : "-"}
              </TableCell>
              <TableCell className="text-right">{item.caixas_por_camada || "-"}</TableCell>
              <TableCell className="text-right">{item.caixas_por_pallet || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CondicoesTable;
