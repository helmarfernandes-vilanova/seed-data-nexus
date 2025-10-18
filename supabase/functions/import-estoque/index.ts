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

// Processar importação em background
async function processImport(
  supabase: any,
  data: EstoqueRow[]
) {
  console.log('Starting background processing');
  let processedRows = 0;
  let errors = 0;
  const BATCH_SIZE = 50; // Processar em lotes de 50

  // Coletar dados únicos primeiro para batch inserts
  const empresasMap = new Map<string, any>();
  const fornecedoresMap = new Map<string, any>();
  const categoriasSet = new Set<string>();

  // Primeira passada: coletar dados únicos
  for (const row of data) {
    if (row.Empresa) empresasMap.set(String(row.Empresa), { codigo: String(row.Empresa), nome: `Empresa ${row.Empresa}` });
    if (row.FORNECEDOR) fornecedoresMap.set(String(row.FORNECEDOR), { codigo: String(row.FORNECEDOR), nome: `Fornecedor ${row.FORNECEDOR}` });
    if (row.CATEGORIA) categoriasSet.add(row.CATEGORIA);
  }

  console.log(`Inserting ${empresasMap.size} empresas`);
  // Inserir empresas em lote
  if (empresasMap.size > 0) {
    const { error } = await supabase
      .from('empresas')
      .upsert(Array.from(empresasMap.values()), { onConflict: 'codigo', ignoreDuplicates: false });
    if (error) console.error('Erro ao inserir empresas:', error);
  }

  console.log(`Inserting ${fornecedoresMap.size} fornecedores`);
  // Inserir fornecedores em lote
  if (fornecedoresMap.size > 0) {
    const { error } = await supabase
      .from('fornecedores')
      .upsert(Array.from(fornecedoresMap.values()), { onConflict: 'codigo', ignoreDuplicates: false });
    if (error) console.error('Erro ao inserir fornecedores:', error);
  }

  console.log(`Inserting ${categoriasSet.size} categorias`);
  // Inserir categorias em lote
  if (categoriasSet.size > 0) {
    const { error } = await supabase
      .from('categorias')
      .upsert(Array.from(categoriasSet).map(nome => ({ nome })), { onConflict: 'nome', ignoreDuplicates: false });
    if (error) console.error('Erro ao inserir categorias:', error);
  }

  // Buscar IDs de empresas, fornecedores e categorias
  const { data: empresas } = await supabase.from('empresas').select('id, codigo');
  const { data: fornecedores } = await supabase.from('fornecedores').select('id, codigo');
  const { data: categorias } = await supabase.from('categorias').select('id, nome');

  const empresasIdMap = new Map(empresas?.map((e: any) => [e.codigo, e.id]) || []);
  const fornecedoresIdMap = new Map(fornecedores?.map((f: any) => [f.codigo, f.id]) || []);
  const categoriasIdMap = new Map(categorias?.map((c: any) => [c.nome, c.id]) || []);

  console.log('Inserting produtos em lotes');
  // Processar produtos em lotes
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const produtos = batch.map(row => ({
      codigo: String(row.PRODUTO),
      ean: row.EAN ? String(row.EAN) : null,
      descricao: row.DESCRIÇÃO,
      categoria_id: categoriasIdMap.get(row.CATEGORIA),
      fornecedor_id: fornecedoresIdMap.get(String(row.FORNECEDOR)),
      qt_cx_compra: row.QT_CX_COMPRA || null,
    }));

    const { error } = await supabase
      .from('produtos')
      .upsert(produtos, { onConflict: 'codigo,fornecedor_id', ignoreDuplicates: false });

    if (error) {
      console.error(`Erro no lote ${i / BATCH_SIZE}:`, error);
      errors += batch.length;
    } else {
      processedRows += batch.length;
    }

    if (i % 200 === 0) {
      console.log(`Progresso: ${i}/${data.length} produtos processados`);
    }
  }

  console.log('Buscando IDs dos produtos');
  // Buscar todos os produtos para mapear IDs
  const { data: produtosData } = await supabase
    .from('produtos')
    .select('id, codigo, fornecedor_id');

  const produtosIdMap = new Map(
    produtosData?.map((p: any) => [`${p.codigo}_${p.fornecedor_id}`, p.id]) || []
  );

  console.log('Inserting estoque em lotes');
  // Processar estoque em lotes
  processedRows = 0;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const estoques = batch
      .map(row => {
        const empresaId = empresasIdMap.get(String(row.Empresa));
        const fornecedorId = fornecedoresIdMap.get(String(row.FORNECEDOR));
        const produtoId = produtosIdMap.get(`${row.PRODUTO}_${fornecedorId}`);

        if (!produtoId || !empresaId) return null;

        return {
          produto_id: produtoId,
          empresa_id: empresaId,
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
        };
      })
      .filter(e => e !== null);

    const { error } = await supabase
      .from('estoque')
      .upsert(estoques, { onConflict: 'produto_id,empresa_id', ignoreDuplicates: false });

    if (error) {
      console.error(`Erro no lote de estoque ${i / BATCH_SIZE}:`, error);
      errors += batch.length;
    } else {
      processedRows += batch.length;
    }

    if (i % 200 === 0) {
      console.log(`Progresso: ${i}/${data.length} itens de estoque processados`);
    }
  }

  console.log(`Import completed: ${processedRows} processed, ${errors} errors`);
  return { processedRows, errors };
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

    // Processar a importação
    const { processedRows, errors } = await processImport(supabase, data);

    // Retornar resposta com resultado
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
