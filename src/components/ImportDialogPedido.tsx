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

interface ImportDialogPedidoProps {
  empresaCodigo: string;
  fornecedorCodigo: string;
  onImportSuccess: (data: any[]) => void;
}

const ImportDialogPedido = ({ empresaCodigo, fornecedorCodigo, onImportSuccess }: ImportDialogPedidoProps) => {
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
    // Criar planilha modelo
    const template = [
      {
        "COD PRODUTO": "4602",
        "EAN": "7891038160308",
        "QTD PALLET": "",
        "QTD CAMADA": "",
      },
      {
        "COD PRODUTO": "114999",
        "EAN": "7891150070967",
        "QTD PALLET": 12,
        "QTD CAMADA": "",
      },
      {
        "COD PRODUTO": "114105",
        "EAN": "7891150065178",
        "QTD PALLET": 4,
        "QTD CAMADA": "",
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");

    // Definir larguras das colunas
    ws['!cols'] = [
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
    ];

    XLSX.writeFile(wb, "modelo_importacao_pedido.xlsx");
    toast.success("Planilha modelo baixada com sucesso!");
  };

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

      // Validar estrutura
      const firstRow = data[0] as any;
      const requiredFields = ["COD PRODUTO", "EAN"];
      const missingFields = requiredFields.filter(field => !(field in firstRow));

      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios faltando: ${missingFields.join(", ")}`);
      }

      setProgress(60);

      // Buscar empresa e fornecedor IDs
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("id")
        .eq("codigo", empresaCodigo)
        .single();

      const { data: fornecedorData } = await supabase
        .from("fornecedores")
        .select("id")
        .eq("codigo", fornecedorCodigo)
        .single();

      if (!empresaData || !fornecedorData) {
        throw new Error("Empresa ou fornecedor não encontrado");
      }

      setProgress(70);

      // Buscar todos os produtos de uma vez
      const codigos = data.map((row: any) => String(row["COD PRODUTO"]));
      const eans = data.map((row: any) => String(row["EAN"]));

      const { data: produtos } = await supabase
        .from("produtos")
        .select("id, codigo, ean, qt_cx_compra")
        .or(`codigo.in.(${codigos.join(",")}),ean.in.(${eans.join(",")})`);

      setProgress(85);

      // Criar mapa de produtos
      const produtosMap = new Map();
      produtos?.forEach((p) => {
        produtosMap.set(p.codigo, p);
        if (p.ean) produtosMap.set(p.ean, p);
      });

      // Processar dados
      const processedData = [];
      let errors = 0;
      let skipped = 0;

      for (const row of data) {
        const rowData = row as any;
        const codigo = String(rowData["COD PRODUTO"] || "").trim();
        const ean = String(rowData["EAN"] || "").trim();
        
        // Ignorar linhas sem código ou EAN
        if (!codigo && !ean) {
          skipped++;
          continue;
        }

        const qtdPallet = Number(rowData["QTD PALLET"]) || 0;
        const qtdCamada = Number(rowData["QTD CAMADA"]) || 0;

        // Ignorar linhas sem quantidade
        if (qtdPallet === 0 && qtdCamada === 0) {
          skipped++;
          continue;
        }
        
        let produto = produtosMap.get(codigo) || produtosMap.get(ean);

        if (!produto) {
          console.error(`Produto não encontrado: ${codigo} / ${ean}`);
          errors++;
          continue;
        }

        // Calcular pedido baseado em pallet e camada
        // Assumindo que precisa buscar caixas_por_pallet e caixas_por_camada das condições comerciais
        const pedido = 0; // Será calculado quando salvar o pedido

        processedData.push({
          produtoId: produto.id,
          codigo: produto.codigo,
          ean: produto.ean,
          qtdPallet,
          qtdCamada,
          pedido,
          qtCxCompra: produto.qt_cx_compra,
        });
      }

      console.log(`Processamento: ${processedData.length} itens válidos, ${skipped} ignorados, ${errors} erros`);

      setProgress(100);

      const successMessage = [];
      if (processedData.length > 0) successMessage.push(`${processedData.length} itens carregados`);
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

      // Chamar callback com dados processados
      onImportSuccess(processedData);

      if (errors === 0) {
        toast.success("Importação concluída com sucesso!");
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
          Importar Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Pedido do Excel</DialogTitle>
          <DialogDescription>
            Envie seu arquivo Excel (.xlsx ou .xls) com os itens do pedido
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
                    htmlFor="file-upload-pedido"
                    className="cursor-pointer text-primary hover:underline font-medium"
                  >
                    Clique para selecionar um arquivo
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou arraste e solte aqui
                  </p>
                </div>
                <input
                  id="file-upload-pedido"
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

export default ImportDialogPedido;
