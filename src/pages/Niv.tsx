import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import CondicoesTable from "@/components/CondicoesTable";
import ImportNivDialog from "@/components/ImportNivDialog";

const Niv = () => {
  const { empresa } = useParams<{ empresa: string }>();

  const empresaNomes: Record<string, string> = {
    "501": "Empresa 501",
    "502": "Empresa 502",
    "1": "Empresa 1",
  };

  const empresaNome = empresa ? empresaNomes[empresa] || `Empresa ${empresa}` : "";

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">NIV - {empresaNome}</h1>
                <p className="text-muted-foreground">Condições Comerciais do Fornecedor</p>
              </div>
            </div>
            {empresa && <ImportNivDialog empresaCodigo={empresa} />}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Condições Comerciais - {empresaNome}</CardTitle>
            <CardDescription>
              Visualize preços, quantidades e informações comerciais dos produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {empresa && <CondicoesTable empresaCodigo={empresa} />}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Niv;
