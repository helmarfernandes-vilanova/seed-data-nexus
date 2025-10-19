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
    navigate(`/sugestao/501-hc?pedido=${pedidoId}`);
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
          <TableRow>
            <TableHead>Data Criação</TableHead>
            <TableHead>Data Atualização</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total Itens</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
            <TableRow key={pedido.id}>
              <TableCell>{pedido.dataCriacao}</TableCell>
              <TableCell>{pedido.dataAtualizacao}</TableCell>
              <TableCell>
                <span className="capitalize">{pedido.status}</span>
              </TableCell>
              <TableCell className="text-right">{pedido.totalItens}</TableCell>
              <TableCell>{pedido.observacoes || "-"}</TableCell>
              <TableCell className="text-center">
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(pedido.id)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(pedido.id)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pedido.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
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
