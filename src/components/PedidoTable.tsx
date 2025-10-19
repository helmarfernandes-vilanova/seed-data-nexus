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
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { Pencil, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface PedidoTableProps {
  empresaCodigo: string;
}

const PedidoTable = ({ empresaCodigo }: PedidoTableProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pedidoToDelete, setPedidoToDelete] = useState<string | null>(null);

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ["pedidos", empresaCodigo],
    queryFn: async () => {
      // Buscar empresa ID
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("id")
        .eq("codigo", empresaCodigo)
        .single();

      if (!empresaData) throw new Error("Empresa não encontrada");

      // Buscar pedidos da empresa
      const { data: pedidosData, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          pedidos_itens(count)
        `)
        .eq("empresa_id", empresaData.id)
        .order("data_criacao", { ascending: false });

      if (error) throw error;

      return pedidosData?.map((pedido) => ({
        id: pedido.id,
        dataCriacao: new Date(pedido.data_criacao).toLocaleString("pt-BR"),
        dataAtualizacao: new Date(pedido.data_atualizacao).toLocaleString("pt-BR"),
        status: pedido.status,
        totalItens: pedido.pedidos_itens?.[0]?.count || 0,
        observacoes: pedido.observacoes,
      })) || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (pedidoId: string) => {
      // Primeiro deletar os itens do pedido
      const { error: itensError } = await supabase
        .from("pedidos_itens")
        .delete()
        .eq("pedido_id", pedidoId);

      if (itensError) throw itensError;

      // Depois deletar o pedido
      const { error: pedidoError } = await supabase
        .from("pedidos")
        .delete()
        .eq("id", pedidoId);

      if (pedidoError) throw pedidoError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos", empresaCodigo] });
      toast.success("Pedido excluído com sucesso!");
      setPedidoToDelete(null);
    },
    onError: (error) => {
      console.error("Erro ao excluir pedido:", error);
      toast.error("Erro ao excluir pedido");
    },
  });

  const handleEdit = (pedidoId: string) => {
    navigate(`/sugestao?pedido=${pedidoId}`);
  };

  const handleView = (pedidoId: string) => {
    navigate(`/pedido/501-hc/detalhes/${pedidoId}`);
  };

  const handleDelete = (pedidoId: string) => {
    setPedidoToDelete(pedidoId);
  };

  const confirmDelete = () => {
    if (pedidoToDelete) {
      deleteMutation.mutate(pedidoToDelete);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!pedidos || pedidos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum pedido encontrado. Crie um pedido a partir da página de Sugestão.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-900 hover:bg-slate-900 h-14">
            <TableHead className="min-w-[140px] text-slate-50 font-semibold py-2 text-center">DATA<br/>CRIAÇÃO</TableHead>
            <TableHead className="min-w-[140px] text-slate-50 font-semibold py-2 text-center">DATA<br/>ATUALIZAÇÃO</TableHead>
            <TableHead className="text-slate-50 font-semibold py-2 text-center">STATUS</TableHead>
            <TableHead className="text-center text-slate-50 font-semibold py-2">TOTAL<br/>ITENS</TableHead>
            <TableHead className="min-w-[200px] text-slate-50 font-semibold py-2 text-center">OBSERVAÇÕES</TableHead>
            <TableHead className="text-center text-slate-50 font-semibold py-2">AÇÕES</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido, index) => (
            <TableRow 
              key={pedido.id}
              className={`h-9 ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
            >
              <TableCell className="text-xs py-1">{pedido.dataCriacao}</TableCell>
              <TableCell className="text-xs py-1">{pedido.dataAtualizacao}</TableCell>
              <TableCell className="py-1">
                <span className="capitalize text-xs">{pedido.status}</span>
              </TableCell>
              <TableCell className="text-right font-medium py-1">{pedido.totalItens}</TableCell>
              <TableCell className="text-sm py-1">
                <div className="max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {pedido.observacoes || "-"}
                </div>
              </TableCell>
              <TableCell className="text-center py-1">
                <div className="flex gap-1 justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(pedido.id)}
                    title="Visualizar"
                    className="h-7 w-7 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(pedido.id)}
                    title="Editar"
                    className="h-7 w-7 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pedido.id)}
                    title="Excluir"
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!pedidoToDelete} onOpenChange={() => setPedidoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PedidoTable;
