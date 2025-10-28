import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImportDialogVerbaDetalhesProps {
  onImport: (verbas: Record<string, number>) => void;
}

const ImportDialogVerbaDetalhes = ({ onImport }: ImportDialogVerbaDetalhesProps) => {
  const [open, setOpen] = useState(false);

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["COD PRODUTO", "EAN", "Verba unid"],
      ["4602", "7891038160308", ""],
      ["4653", "7891038161602", "0"],
      ["124012", "7891150073944", "0"],
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Verbas");
    XLSX.writeFile(wb, "template_verbas.xlsx");
    toast.success("Template baixado com sucesso!");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      console.log("Validando planilha - Primeira linha:", jsonData[0]);

      // Validar cabeçalhos
      const headers = jsonData[0];
      const requiredHeaders = ["COD PRODUTO", "EAN", "Verba unid"];
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0) {
        toast.error(`Colunas obrigatórias faltando: ${missingHeaders.join(", ")}`);
        return;
      }

      // Processar dados (pular cabeçalho)
      const rows = jsonData.slice(1).filter((row) => row.length > 0 && (row[0] || row[1]));

      if (rows.length === 0) {
        toast.error("Nenhum dado encontrado na planilha");
        return;
      }

      // Buscar produtos pelos códigos e EANs
      const codigos = rows.map((row) => row[0]?.toString().trim()).filter(Boolean);
      const eans = rows.map((row) => row[1]?.toString().trim()).filter(Boolean);

      const { data: produtos, error } = await supabase
        .from("produtos")
        .select("id, codigo, ean")
        .or(`codigo.in.(${codigos.join(",")}),ean.in.(${eans.join(",")})`);

      if (error) {
        console.error("Erro ao buscar produtos:", error);
        toast.error("Erro ao buscar produtos no banco de dados");
        return;
      }

      // Criar mapa de produtos por código e EAN
      const produtosPorCodigo = new Map(produtos?.map((p) => [p.codigo, p.id]) || []);
      const produtosPorEan = new Map(produtos?.map((p) => [p.ean, p.id]) || []);

      // Processar verbas importadas
      const verbasImportadas: Record<string, number> = {};
      let importadosCount = 0;

      rows.forEach((row) => {
        const codigo = row[0]?.toString().trim();
        const ean = row[1]?.toString().trim();
        const verbaValue = row[2];

        // Encontrar produto ID
        let produtoId = null;
        if (codigo && produtosPorCodigo.has(codigo)) {
          produtoId = produtosPorCodigo.get(codigo);
        } else if (ean && produtosPorEan.has(ean)) {
          produtoId = produtosPorEan.get(ean);
        }

        if (!produtoId) {
          console.log(`Produto não encontrado: código=${codigo}, ean=${ean}`);
          return;
        }

        // Processar valor da verba
        let verba = 0;
        if (verbaValue !== undefined && verbaValue !== null && verbaValue !== "") {
          const verbaStr = verbaValue.toString().replace(",", ".");
          verba = parseFloat(verbaStr) || 0;
        }

        verbasImportadas[produtoId] = verba;
        importadosCount++;
      });

      if (importadosCount === 0) {
        toast.error("Nenhum produto encontrado na planilha");
        return;
      }

      onImport(verbasImportadas);
      toast.success(`${importadosCount} verbas importadas com sucesso!`);
      setOpen(false);

      // Limpar input
      event.target.value = "";
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error(`Erro ao importar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar Verbas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Verbas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Faça o upload de uma planilha Excel com as colunas: COD PRODUTO, EAN e Verba unid
          </p>
          
          <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Baixar Template
          </Button>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-verba"
            />
            <label htmlFor="file-upload-verba" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Clique para selecionar arquivo</p>
              <p className="text-xs text-muted-foreground mt-1">Formatos: .xlsx, .xls</p>
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialogVerbaDetalhes;
