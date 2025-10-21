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
    <div className="rounded-md border overflow-x-auto [&>div]:max-h-[70vh] [&>div]:overflow-y-auto">
      <Table className="border-separate border-spacing-0 table-fixed">
        <TableHeader>
          <TableRow className="bg-slate-900 hover:bg-slate-900 h-14">
            <TableHead className="min-w-[120px] w-[120px] sticky top-0 z-20 bg-slate-900 text-slate-50 font-semibold py-2 text-center">CÓDIGO<br/>EAN</TableHead>
            <TableHead className="min-w-[100px] w-[100px] sticky top-0 left-0 z-40 bg-slate-900 text-slate-50 font-semibold py-2 text-center">CÓDIGO<br/>SKU</TableHead>
            <TableHead className="min-w-[300px] sticky top-0 z-20 bg-slate-900 text-slate-50 font-semibold py-2 text-center">DESCRIÇÃO</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-slate-50 font-semibold py-2 text-center min-w-[200px]">CATEGORIA</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2 min-w-[130px] whitespace-nowrap">ITENS POR<br/>CAIXA</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2 min-w-[140px]">PREÇO APÓS<br/>DESCONTOS</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2 min-w-[130px]">PREÇO C/<br/>IMPOSTOS</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2 min-w-[110px]">PREÇO<br/>UNITÁRIO</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">TON/<br/>EAN</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">NIV/<br/>EAN</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">CX/<br/>CAMADA</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">CX/<br/>PALLET</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {condicoes.map((item, index) => (
            <TableRow 
              key={item.id}
              className={`h-9 ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
            >
              <TableCell className="font-mono text-xs py-1 relative z-0 w-[120px] min-w-[120px]">{item.codigo_ean || "-"}</TableCell>
              <TableCell className="font-mono text-xs py-1 sticky left-0 z-40 bg-background w-[100px] min-w-[100px] border-r border-muted/40">{item.codigo_sku}</TableCell>
              <TableCell className="text-sm py-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px] relative z-0">{item.descricao}</TableCell>
              <TableCell className="text-xs text-muted-foreground py-1 whitespace-nowrap relative z-0">{item.categoria || "-"}</TableCell>
              <TableCell className="text-right font-medium py-1 relative z-0">{item.itens_por_caixa || "-"}</TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.preco_apos_descontos ? Number(item.preco_apos_descontos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.preco_com_impostos ? Number(item.preco_com_impostos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.preco_unitario ? Number(item.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.ton_por_ean ? Number(item.ton_por_ean).toFixed(2) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.niv_por_ean ? Number(item.niv_por_ean).toFixed(2) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">{item.caixas_por_camada || "-"}</TableCell>
              <TableCell className="text-right py-1 relative z-0">{item.caixas_por_pallet || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CondicoesTable;
