import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const Sugestao = () => {
  const { tipo } = useParams<{ tipo: string }>();

  const tipoNomes: Record<string, string> = {
    "501-hc": "501 - HC",
  };

  const tipoNome = tipo ? tipoNomes[tipo] || tipo : "";

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Lightbulb className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sugestão - {tipoNome}</h1>
              <p className="text-muted-foreground">Sugestões de compra baseadas em análise</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sugestão de Compra - {tipoNome}</CardTitle>
            <CardDescription>
              Análise e recomendações de produtos para compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Conteúdo em desenvolvimento...</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Sugestao;
