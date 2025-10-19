import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <main className="container mx-auto px-4 py-4 md:py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Pedidos</CardTitle>
            <CardDescription className="text-sm">
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
