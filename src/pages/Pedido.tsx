import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import PedidoTable from "@/components/PedidoTable";

const Pedido = () => {
  const { tipo } = useParams<{ tipo: string }>();

  const tipoConfig: Record<string, { nome: string; empresaCodigo: string }> = {
    "501-hc": { nome: "501 - HC", empresaCodigo: "501" },
  };

  const config = tipo ? tipoConfig[tipo] : null;
  
  if (!config) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Tipo de pedido não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pedido - {config.nome}</h1>
              <p className="text-muted-foreground">Pedidos salvos a partir das sugestões de compra</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos - {config.nome}</CardTitle>
            <CardDescription>
              Lista de pedidos salvos a partir das sugestões de compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PedidoTable empresaCodigo={config.empresaCodigo} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Pedido;
