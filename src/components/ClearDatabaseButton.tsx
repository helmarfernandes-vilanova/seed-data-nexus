import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ClearDatabaseButton = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleClearDatabase = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await supabase.functions.invoke("clear-database", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.error) {
        throw response.error;
      }

      // Atualizar todas as queries
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      toast.success("Banco de dados limpo com sucesso!");
      setOpen(false);
    } catch (error: any) {
      console.error("Erro ao limpar banco:", error);
      toast.error(error.message || "Erro ao limpar banco de dados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Limpar Banco
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá deletar permanentemente todos os dados do banco:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Todos os produtos</li>
              <li>Todo o estoque</li>
              <li>Todos os pedidos e itens de pedidos</li>
              <li>Todas as empresas</li>
              <li>Todos os fornecedores</li>
              <li>Todas as categorias</li>
            </ul>
            <div className="mt-3 font-semibold text-destructive">
              Esta ação não pode ser desfeita!
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleClearDatabase();
            }}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Limpando...
              </>
            ) : (
              "Sim, limpar tudo"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ClearDatabaseButton;
