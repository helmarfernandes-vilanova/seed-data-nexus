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

const ProdutosTable = () => {
  const { data: produtos, isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          *,
          categoria:categorias(nome),
          fornecedor:fornecedores(codigo, nome)
        `)
        .order("descricao", { ascending: true })
        .limit(100);

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

  if (!produtos || produtos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg mb-2">Nenhum produto cadastrado</p>
        <p className="text-sm">Importe seus dados para começar</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>EAN</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead className="text-right">Qt Cx Compra</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto) => (
            <TableRow key={produto.id}>
              <TableCell className="font-medium">{produto.codigo}</TableCell>
              <TableCell>
                <div className="max-w-[350px]">
                  <p className="font-medium truncate">{produto.descricao}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {produto.ean || "-"}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary">
                  {produto.categoria?.nome || "Sem categoria"}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">
                    {produto.fornecedor?.nome || "Sem fornecedor"}
                  </p>
                  {produto.fornecedor?.codigo && (
                    <p className="text-xs text-muted-foreground">
                      Cód: {produto.fornecedor.codigo}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {produto.qt_cx_compra || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProdutosTable;
