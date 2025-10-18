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

const EstoqueTable = () => {
  const { data: estoque, isLoading } = useQuery({
    queryKey: ["estoque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque")
        .select(`
          *,
          produto:produtos(
            codigo,
            descricao,
            ean,
            categoria:categorias(nome),
            fornecedor:fornecedores(nome)
          ),
          empresa:empresas(codigo, nome)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!estoque || estoque.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg mb-2">Nenhum item em estoque cadastrado</p>
        <p className="text-sm">Importe seus dados para começar</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>EAN</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Qtd Disponível</TableHead>
            <TableHead className="text-right">Dias Estoque</TableHead>
            <TableHead className="text-right">Custo Unit.</TableHead>
            <TableHead className="text-right">Custo Cx</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estoque.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.empresa?.codigo || "-"}
              </TableCell>
              <TableCell>
                <div className="max-w-[300px]">
                  <p className="font-medium truncate">{item.produto?.descricao || "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.produto?.fornecedor?.nome || "Sem fornecedor"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.produto?.ean || "-"}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {item.produto?.categoria?.nome || "Sem categoria"}
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">
                {Number(item.qtd_disponivel || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                {item.dias_estoque ? Number(item.dias_estoque).toFixed(0) : "-"}
              </TableCell>
              <TableCell className="text-right">
                {item.custo_un ? `R$ ${Number(item.custo_un).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "-"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.custo_cx ? `R$ ${Number(item.custo_cx).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EstoqueTable;
