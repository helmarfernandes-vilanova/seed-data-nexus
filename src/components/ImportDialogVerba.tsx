import { useState } from "react";
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
import { Upload, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import * as XLSX from "xlsx";

interface ImportStats {
  total: number;
  processados: number;
  erros: number;
}

interface ImportDialogVerbaProps {
  empresaCodigo: string;
  fornecedorCodigo: string;
  onImportSuccess: (data: any[]) => void;
}

const ImportDialogVerba = ({ empresaCodigo, fornecedorCodigo, onImportSuccess }: ImportDialogVerbaProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: ImportStats;
  } | null>(null);

  const downloadTemplate = () => {
    const template = [
      {
        "COD PRODUTO": "4602",
        "EAN": "7891038160308",
        "Verba unid": "",
      },
      {
        "COD PRODUTO": "4653",
        "EAN": "7891038161602",
        "Verba unid": 0,
      },
      {
        "COD PRODUTO": "115351",
        "EAN": "7891150079274",
        "Verba unid": "1,8",
      },
      {
        "COD PRODUTO": "114998",
        "EAN": "7891150070981",
        "Verba unid": "1,8",
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");

    ws['!cols'] = [
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
    ];

    XLSX.writeFile(wb, "modelo_importacao_verba.xlsx");
    toast.success("Planilha modelo baixada com sucesso!");
  };

  const parseDecimal = (value: any): number => {
    if (value === null || value === undefined || value === "") return 0;
    const str = String(value).trim().replace(",", ".");
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error("Por favor, envie um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setLoading(true);
    setProgress(10);
    setResult(null);
    setImportStats(null);

    try {
      setProgress(20);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      setProgress(40);

      if (data.length === 0) {
        throw new Error("Planilha vazia");
      }

      const firstRow = data[0] as any;
      const detectedColumns = Object.keys(firstRow);
      console.log("Colunas detectadas na planilha:", detectedColumns);
      
      const requiredFields = ["COD PRODUTO", "EAN", "Verba unid"];
      const missingFields = requiredFields.filter(field => !(field in firstRow));

      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios faltando: ${missingFields.join(", ")}. Colunas encontradas: ${detectedColumns.join(", ")}`);
      }

      setProgress(60);

      // Buscar todos os produtos
      const codigos = data.map((row: any) => String(row["COD PRODUTO"])).filter(Boolean);
      const eans = data.map((row: any) => String(row["EAN"])).filter(Boolean);

      const { data: produtos, error: produtosError } = await supabase
        .from("produtos")
        .select("id, codigo, ean")
        .or(`codigo.in.(${codigos.join(",")}),ean.in.(${eans.join(",")})`);

      if (produtosError) {
        throw new Error(`Erro ao buscar produtos: ${produtosError.message}`);
      }

      setProgress(85);

      const produtosMap = new Map();
      produtos?.forEach((p) => {
        produtosMap.set(p.codigo, p);
        if (p.ean) produtosMap.set(p.ean, p);
      });

      const processedData = [];
      let errors = 0;
      let skipped = 0;

      for (const row of data) {
        const rowData = row as any;
        const codigo = String(rowData["COD PRODUTO"] || "").trim();
        const ean = String(rowData["EAN"] || "").trim();
        
        if (!codigo && !ean) {
          skipped++;
          continue;
        }

        const verbaUnid = parseDecimal(rowData["Verba unid"]);
        
        let produto = produtosMap.get(codigo) || produtosMap.get(ean);

        if (!produto) {
          console.error(`Produto não encontrado: ${codigo} / ${ean}`);
          errors++;
          continue;
        }

        processedData.push({
          produtoId: produto.id,
          codigo: produto.codigo,
          ean: produto.ean,
          verbaUnid,
        });
      }

      console.log(`Processamento: ${processedData.length} itens válidos, ${skipped} ignorados, ${errors} erros`);

      setProgress(100);

      const successMessage = [];
      if (processedData.length > 0) successMessage.push(`${processedData.length} verbas carregadas`);
      if (skipped > 0) successMessage.push(`${skipped} linhas ignoradas`);
      if (errors > 0) successMessage.push(`${errors} erros`);

      setResult({
        success: errors < data.length,
        message: successMessage.join(', '),
        stats: {
          total: data.length,
          processados: processedData.length,
          erros: errors,
        },
      });

      setImportStats({
        total: data.length,
        processados: processedData.length,
        erros: errors,
      });

      onImportSuccess(processedData);

      if (errors === 0) {
        toast.success("Importação de verbas concluída com sucesso!");
      } else {
        toast.warning(`Importação concluída com ${errors} erros`);
      }
    } catch (error: any) {
      console.error("Erro ao importar:", error);
      setResult({
        success: false,
        message: error.message || "Erro ao importar arquivo",
      });
      toast.error(error.message || "Erro ao importar arquivo");
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
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Verba
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Verba do Excel</DialogTitle>
          <DialogDescription>
            Envie seu arquivo Excel (.xlsx ou .xls) com as verbas por produto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!loading && !result && (
            <>
              <div className="flex justify-center mb-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Planilha Modelo
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <label
                    htmlFor="file-upload-verba"
                    className="cursor-pointer text-primary hover:underline font-medium"
                  >
                    Clique para selecionar um arquivo
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou arraste e solte aqui
                  </p>
                </div>
                <input
                  id="file-upload-verba"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </>
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

export default ImportDialogVerba;
