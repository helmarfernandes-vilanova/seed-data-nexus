import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { read, utils } from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EstoqueRow {
  Empresa: string;
  FORNECEDOR: string;
  PRODUTO: string;
  EAN: string;
  DESCRIÇÃO: string;
  CATEGORIA: string;
  QT_CX_COMPRA: number;
  'QTD DISPONIVEL': number;
  PENDENTE: number;
  'DIAS ESTOQUE': number;
  'M-3': number;
  'M-2': number;
  'M-1': number;
  'M-0': number;
  'CUSTO UN': number;
  'CUSTO CX': number;
  LIVRO: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting import process');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${file.name}`);

    // Read the file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(worksheet) as EstoqueRow[];

    console.log(`Found ${data.length} rows to process`);

    let processedRows = 0;
    let errors = 0;

    // Process in batches to avoid timeouts
    for (const row of data) {
      try {
        // 1. Inserir ou buscar empresa
        const { data: empresa, error: empresaError } = await supabase
          .from('empresas')
          .upsert({ codigo: String(row.Empresa), nome: `Empresa ${row.Empresa}` }, { onConflict: 'codigo' })
          .select()
          .single();

        if (empresaError) throw empresaError;

        // 2. Inserir ou buscar fornecedor
        const { data: fornecedor, error: fornecedorError } = await supabase
          .from('fornecedores')
          .upsert({ codigo: String(row.FORNECEDOR), nome: `Fornecedor ${row.FORNECEDOR}` }, { onConflict: 'codigo' })
          .select()
          .single();

        if (fornecedorError) throw fornecedorError;

        // 3. Inserir ou buscar categoria
        const { data: categoria, error: categoriaError } = await supabase
          .from('categorias')
          .upsert({ nome: row.CATEGORIA }, { onConflict: 'nome' })
          .select()
          .single();

        if (categoriaError) throw categoriaError;

        // 4. Inserir ou buscar produto
        const { data: produto, error: produtoError } = await supabase
          .from('produtos')
          .upsert(
            {
              codigo: String(row.PRODUTO),
              ean: row.EAN ? String(row.EAN) : null,
              descricao: row.DESCRIÇÃO,
              categoria_id: categoria.id,
              fornecedor_id: fornecedor.id,
              qt_cx_compra: row.QT_CX_COMPRA || null,
            },
            { onConflict: 'codigo,fornecedor_id' }
          )
          .select()
          .single();

        if (produtoError) throw produtoError;

        // 5. Inserir ou atualizar estoque
        const { error: estoqueError } = await supabase
          .from('estoque')
          .upsert(
            {
              produto_id: produto.id,
              empresa_id: empresa.id,
              qtd_disponivel: row['QTD DISPONIVEL'] || 0,
              pendente: row.PENDENTE || 0,
              dias_estoque: row['DIAS ESTOQUE'] || null,
              m_3: row['M-3'] || null,
              m_2: row['M-2'] || null,
              m_1: row['M-1'] || null,
              m_0: row['M-0'] || null,
              custo_un: row['CUSTO UN'] || null,
              custo_cx: row['CUSTO CX'] || null,
              livro: row.LIVRO || null,
            },
            { onConflict: 'produto_id,empresa_id' }
          );

        if (estoqueError) throw estoqueError;

        processedRows++;
      } catch (error) {
        console.error(`Error processing row:`, error);
        errors++;
      }
    }

    console.log(`Import completed: ${processedRows} processed, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Importação concluída com sucesso!`,
        stats: {
          total: data.length,
          processados: processedRows,
          erros: errors,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar arquivo';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
