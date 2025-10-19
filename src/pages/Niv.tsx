import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <main className="container mx-auto px-4 py-4 md:py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl">Condições Comerciais - {empresaAtual?.nome}</CardTitle>
                <CardDescription className="text-sm">
                  Visualize preços, quantidades e informações comerciais dos produtos
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
                  <SelectTrigger className="w-full md:w-[180px]">
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
                <ClearDatabaseButton />
                <ImportDialogNiv />
              </div>
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
