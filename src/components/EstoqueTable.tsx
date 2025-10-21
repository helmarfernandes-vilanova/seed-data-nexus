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

interface EstoqueTableProps {
  empresaCodigo?: string;
  fornecedorCodigo?: string;
  codigoOuEan?: string;
  categoria?: string;
}

const EstoqueTable = ({ 
  empresaCodigo = "", 
  fornecedorCodigo = "", 
  codigoOuEan = "", 
  categoria = "todas" 
}: EstoqueTableProps) => {
  const { data: estoque, isLoading } = useQuery({
    queryKey: ["estoque", empresaCodigo, fornecedorCodigo, codigoOuEan, categoria],
    queryFn: async () => {
      let query = supabase
        .from("estoque")
        .select(`
          *,
          produto:produtos!inner(
            codigo,
            descricao,
            ean,
            qt_cx_compra,
            categoria:categorias(nome),
            fornecedor:fornecedores!inner(codigo)
          ),
          empresa:empresas!inner(codigo, nome)
        `)
        .limit(1000);

      // Aplicar filtro de empresa
      if (empresaCodigo) {
        query = query.eq("empresa.codigo", empresaCodigo);
      }

      // Aplicar filtro de fornecedor
      if (fornecedorCodigo) {
        query = query.eq("produto.fornecedor.codigo", fornecedorCodigo);
      }

      // Aplicar filtro de código ou EAN
      if (codigoOuEan) {
        query = query.or(`produto.codigo.ilike.%${codigoOuEan}%,produto.ean.ilike.%${codigoOuEan}%`);
      }

      // Aplicar filtro de categoria
      if (categoria && categoria !== "todas") {
        query = query.eq("produto.categoria.nome", categoria);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Ordenar por descrição do produto no lado do cliente
      return data?.sort((a, b) => {
        const descA = a.produto?.descricao || "";
        const descB = b.produto?.descricao || "";
        return descA.localeCompare(descB, 'pt-BR');
      }) || [];
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
    <div className="rounded-md border overflow-x-auto [&>div]:max-h-[70vh] [&>div]:overflow-y-auto">
      <Table className="border-separate border-spacing-0">
        <TableHeader>
          <TableRow className="bg-slate-900 hover:bg-slate-900 h-14">
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-slate-50 font-semibold py-2 text-center">EMPRESA</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-slate-50 font-semibold py-2 text-center">FORNECEDOR</TableHead>
            <TableHead className="min-w-[100px] sticky top-0 left-0 z-40 bg-slate-900 text-slate-50 font-semibold py-2 text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">PRODUTO</TableHead>
            <TableHead className="min-w-[120px] sticky top-0 z-20 bg-slate-900 text-slate-50 font-semibold py-2 text-center">EAN</TableHead>
            <TableHead className="min-w-[300px] sticky top-0 z-20 bg-slate-900 text-slate-50 font-semibold py-2 text-center">DESCRIÇÃO</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-slate-50 font-semibold py-2 text-center">CATEGORIA</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">QT CX<br/>COMPRA</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">QTD<br/>DISPONÍVEL</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">PENDENTE</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">DIAS<br/>ESTOQUE</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">M-3</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">M-2</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">M-1</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">M-0</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">CUSTO<br/>UN</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">CUSTO<br/>CX</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">VALOR<br/>ESTOQUE</TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-900 text-center text-slate-50 font-semibold py-2">LIVRO</TableHead>
          </TableRow>
        </TableHeader>
          <TableBody>
            {estoque.map((item, index) => (
            <TableRow 
              key={item.id}
              className={`h-9 ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
            >
              <TableCell className="font-medium text-xs py-1 relative z-0">
                {item.empresa?.codigo || "-"}
              </TableCell>
              <TableCell className="text-xs py-1 relative z-0">
                {item.produto?.fornecedor?.codigo || "-"}
              </TableCell>
              <TableCell className={`font-medium font-mono text-xs py-1 sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}>
                {item.produto?.codigo || "-"}
              </TableCell>
              <TableCell className="font-mono text-xs py-1 relative z-0">
                {item.produto?.ean || "-"}
              </TableCell>
              <TableCell className="text-sm py-1 relative z-0">
                <div className="max-w-[300px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.produto?.descricao || "-"}
                </div>
              </TableCell>
              <TableCell className="py-1 relative z-0">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary whitespace-nowrap">
                  {item.produto?.categoria?.nome || "Sem categoria"}
                </span>
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.produto?.qt_cx_compra ?? "-"}
              </TableCell>
              <TableCell className="text-right font-medium py-1 relative z-0">
                {Number(item.qtd_disponivel || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {Number(item.pendente || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.dias_estoque !== null && item.dias_estoque !== undefined ? Number(item.dias_estoque).toFixed(2) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.m_3 !== null && item.m_3 !== undefined ? Number(item.m_3).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.m_2 !== null && item.m_2 !== undefined ? Number(item.m_2).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.m_1 !== null && item.m_1 !== undefined ? Number(item.m_1).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.m_0 !== null && item.m_0 !== undefined ? Number(item.m_0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.custo_un ? Number(item.custo_un).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "-"}
              </TableCell>
              <TableCell className="text-right font-medium py-1 relative z-0">
                {item.custo_cx ? Number(item.custo_cx).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "-"}
              </TableCell>
              <TableCell className="text-right font-medium py-1 relative z-0">
                {item.custo_cx && item.qtd_disponivel 
                  ? (Number(item.custo_cx) * Number(item.qtd_disponivel)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
                  : "-"}
              </TableCell>
              <TableCell className="text-right py-1 relative z-0">
                {item.livro !== null && item.livro !== undefined ? Number(item.livro).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "-"}
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>
  );
};

export default EstoqueTable;
