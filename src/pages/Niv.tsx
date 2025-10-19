import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CondicoesTable from "@/components/CondicoesTable";
import ImportDialogNiv from "@/components/ImportDialogNiv";
import ClearDatabaseButton from "@/components/ClearDatabaseButton";

const Niv = () => {
  const [empresaSelecionada, setEmpresaSelecionada] = useState("501");

  const empresas = [
    { codigo: "501", nome: "501 - NIV" },
    { codigo: "502", nome: "502 - NIV" },
    { codigo: "1", nome: "1 - NIV" },
  ];

  const empresaAtual = empresas.find(e => e.codigo === empresaSelecionada);

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
                <h1 className="text-3xl font-bold text-foreground">NIV - Condições Comerciais</h1>
                <p className="text-muted-foreground">Condições Comerciais do Fornecedor</p>
              </div>
            </div>
            <div className="flex gap-2">
              <ClearDatabaseButton />
              <ImportDialogNiv />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Condições Comerciais - {empresaAtual?.nome}</CardTitle>
                <CardDescription>
                  Visualize preços, quantidades e informações comerciais dos produtos
                </CardDescription>
              </div>
              <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.codigo} value={empresa.codigo}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <CondicoesTable empresaCodigo={empresaSelecionada} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Niv;
