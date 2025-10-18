import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import ClearDatabaseButton from "@/components/ClearDatabaseButton";

interface ImportStats {
  total: number;
  processados: number;
  erros: number;
  empresas: number;
}

interface EmpresaResult {
  empresaCodigo: string;
  processedRows: number;
  errors: number;
  total: number;
  error?: string;
}

const Importacao = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: ImportStats;
    details?: EmpresaResult[];
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

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(20);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      setProgress(30);
      
      toast.info("Processando arquivo com múltiplas abas... Isso pode levar alguns minutos.");

      // Simular progresso enquanto processa
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 85) return prev + 5;
          return prev;
        });
      }, 2000);

      const response = await supabase.functions.invoke("import-niv-completo", {
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      clearInterval(progressInterval);
      setProgress(95);

      if (response.error) {
        throw response.error;
      }

      setResult(response.data);
      setProgress(100);

      // Atualizar os dados de todas as empresas
      queryClient.invalidateQueries({ queryKey: ["condicoes"] });

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

  const resetImport = () => {
    setResult(null);
    setProgress(0);
  };

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Importação NIV</h1>
                <p className="text-muted-foreground">Importe condições comerciais de todas as empresas</p>
              </div>
            </div>
            <ClearDatabaseButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Importar Arquivo Excel Completo</CardTitle>
            <CardDescription>
              Envie um arquivo Excel com múltiplas abas. Cada aba representa uma empresa (501, 502, 1) e será processada automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Upload Area */}
              {!loading && !result && (
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 space-y-4">
                  <Upload className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center space-y-2">
                    <label
                      htmlFor="file-upload-completo"
                      className="cursor-pointer text-primary hover:underline font-medium text-lg"
                    >
                      Clique para selecionar um arquivo
                    </label>
                    <p className="text-sm text-muted-foreground">
                      ou arraste e solte aqui
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Formatos aceitos: .xlsx ou .xls
                    </p>
                  </div>
                  <input
                    id="file-upload-completo"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="space-y-6 py-8">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-lg font-medium">Processando arquivo...</p>
                  </div>
                  <Progress value={progress} className="w-full h-3" />
                  <div className="text-center text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Processando... {Math.round(progress)}%
                    </p>
                    <p className="text-sm mt-2">
                      Importando dados de todas as empresas
                    </p>
                  </div>
                </div>
              )}

              {/* Result State */}
              {result && (
                <div className="space-y-6">
                  <div
                    className={`flex items-start gap-4 p-6 rounded-lg ${
                      result.success
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="h-6 w-6 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-6 w-6 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-3">
                      <p className="font-medium text-lg">{result.message}</p>
                      {result.stats && (
                        <div className="text-sm space-y-1">
                          <p>Empresas processadas: {result.stats.empresas}</p>
                          <p>Total de linhas: {result.stats.total}</p>
                          <p>Processadas com sucesso: {result.stats.processados}</p>
                          {result.stats.erros > 0 && (
                            <p className="font-medium">Erros: {result.stats.erros}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalhes por Empresa */}
                  {result.details && result.details.length > 0 && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-lg">Detalhes por Empresa</h3>
                      <div className="space-y-2">
                        {result.details.map((detail, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-md ${
                              detail.errors > 0
                                ? "bg-destructive/10"
                                : "bg-success/10"
                            }`}
                          >
                            <div>
                              <p className="font-medium">Empresa {detail.empresaCodigo}</p>
                              {detail.error && (
                                <p className="text-sm text-destructive">{detail.error}</p>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <p>
                                {detail.processedRows} / {detail.total} processados
                              </p>
                              {detail.errors > 0 && (
                                <p className="text-destructive">{detail.errors} erros</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={resetImport}
                      className="flex-1"
                      size="lg"
                    >
                      Importar Outro Arquivo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Importacao;
