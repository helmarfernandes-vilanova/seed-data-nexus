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
      <div className="overflow-auto max-h-[70vh]">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-900 hover:bg-slate-900">
              <TableHead className="sticky top-0 left-0 z-50 bg-slate-900 text-slate-50 font-semibold text-center min-w-[100px]">CÓDIGO<br/>SKU</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-slate-50 font-semibold text-center min-w-[120px]">CÓDIGO<br/>EAN</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-slate-50 font-semibold text-center min-w-[300px]">DESCRIÇÃO</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-slate-50 font-semibold text-center min-w-[200px]">CATEGORIA</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-center text-slate-50 font-semibold min-w-[130px] whitespace-nowrap">ITENS POR<br/>CAIXA</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-center text-slate-50 font-semibold min-w-[140px]">PREÇO APÓS<br/>DESCONTOS</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-center text-slate-50 font-semibold min-w-[130px]">PREÇO C/<br/>IMPOSTOS</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-center text-slate-50 font-semibold min-w-[110px]">PREÇO<br/>UNITÁRIO</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-center text-slate-50 font-semibold">TON/<br/>EAN</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-center text-slate-50 font-semibold">NIV/<br/>EAN</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-center text-slate-50 font-semibold">CX/<br/>CAMADA</TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-900 text-center text-slate-50 font-semibold">CX/<br/>PALLET</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {condicoes.map((item, index) => (
              <TableRow 
                key={item.id}
                className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
              >
                <TableCell className="sticky left-0 z-40 bg-inherit font-mono text-xs border-r border-muted/40">{item.codigo_sku}</TableCell>
                <TableCell className="font-mono text-xs">{item.codigo_ean || "-"}</TableCell>
                <TableCell className="text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">{item.descricao}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{item.categoria || "-"}</TableCell>
                <TableCell className="text-right font-medium">{item.itens_por_caixa || "-"}</TableCell>
                <TableCell className="text-right">
                  {item.preco_apos_descontos ? Number(item.preco_apos_descontos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {item.preco_com_impostos ? Number(item.preco_com_impostos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {item.preco_unitario ? Number(item.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
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
    </div>
  );
};

export default CondicoesTable;
