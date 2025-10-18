import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface ImportStats {
  total: number;
  processados: number;
  erros: number;
  currentBatch?: number;
  totalBatches?: number;
}

const ImportDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: ImportStats;
  } | null>(null);
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error("Por favor, envie um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setLoading(true);
    setProgress(10);
    setResult(null);
    setImportStats(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(20);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      setProgress(30);
      
      toast.info("Processando arquivo... Isso pode levar alguns minutos.");

      // Simular progresso enquanto processa
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 85) return prev + 5;
          return prev;
        });
      }, 2000);

      const response = await supabase.functions.invoke("import-estoque", {
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      clearInterval(progressInterval);
      setProgress(95);

      if (response.error) {
        throw response.error;
      }

      setResult(response.data);
      setImportStats(response.data.stats);
      setProgress(100);

      // Atualizar os dados
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      if (response.data.stats.erros === 0) {
        toast.success("Importação concluída com sucesso!");
      } else {
        toast.warning(`Importação concluída com ${response.data.stats.erros} erros`);
      }
    } catch (error: any) {
      console.error("Erro ao importar:", error);
      setResult({
        success: false,
        message: error.message || "Erro ao importar arquivo",
      });
      toast.error("Erro ao importar arquivo");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleClose = () => {
    setOpen(false);
    setProgress(0);
    setResult(null);
    setImportStats(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Dados do Excel</DialogTitle>
          <DialogDescription>
            Envie seu arquivo Excel (.xlsx ou .xls) para importar os dados de estoque
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-primary hover:underline font-medium"
                >
                  Clique para selecionar um arquivo
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  ou arraste e solte aqui
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium">Processando arquivo...</p>
              </div>
              <Progress value={progress} className="w-full" />
              {importStats && (
                <div className="text-sm text-muted-foreground text-center space-y-1">
                  <p>Total de linhas: {importStats.total}</p>
                  <p className="font-medium text-foreground">
                    Processando... {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  result.success
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 space-y-2">
                  <p className="font-medium">{result.message}</p>
                  {result.stats && (
                    <div className="text-sm space-y-1">
                      <p>Total de linhas: {result.stats.total}</p>
                      <p>Processadas: {result.stats.processados}</p>
                      {result.stats.erros > 0 && (
                        <p>Erros: {result.stats.erros}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setResult(null);
                    setProgress(0);
                    setImportStats(null);
                  }}
                  className="flex-1"
                >
                  Importar Outro Arquivo
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
