import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { read, utils } from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NivRow {
  'Código EAN': string;
  'Código SKU': string;
  'Descrição do Produto': string;
  'Categoria': string;
  'Itens Por Caixas': number;
  'Preço após Descontos': number;
  'Preço com impostos': number;
  'Preço unitário': number;
  'TON por EAN': number;
  'NIV por EAN': number;
  'Caixas por Camada': number;
  'Caixas por Pallet': number;
}

async function processSheet(
  supabase: any,
  data: NivRow[],
  empresaCodigo: string
) {
  console.log(`Processing sheet for empresa ${empresaCodigo} with ${data.length} rows`);
  
  // Buscar ou criar empresa
  let { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('id')
    .eq('codigo', empresaCodigo)
    .maybeSingle();

  if (empresaError) {
    console.error(`Error fetching empresa ${empresaCodigo}:`, empresaError);
    throw empresaError;
  }

  if (!empresa) {
    const { data: newEmpresa, error: insertError } = await supabase
      .from('empresas')
      .insert({
        codigo: empresaCodigo,
        nome: `Empresa ${empresaCodigo}`
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erro ao criar empresa: ${insertError.message}`);
    }
    empresa = newEmpresa;
  }

  const empresaId = empresa.id;

  // Deletar registros existentes
  console.log(`Deleting existing records for empresa ${empresaCodigo}`);
  await supabase
    .from('condicoes_comerciais')
    .delete()
    .eq('empresa_id', empresaId);

  // Processar em lotes
  const BATCH_SIZE = 100;
  let processedRows = 0;
  let errors = 0;
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const condicoes = batch.map(row => ({
      empresa_id: empresaId,
      codigo_ean: row['Código EAN'] ? String(row['Código EAN']) : null,
      codigo_sku: String(row['Código SKU']),
      descricao: row['Descrição do Produto'],
      categoria: row['Categoria'] || null,
      itens_por_caixa: row['Itens Por Caixas'] || null,
      preco_apos_descontos: row['Preço após Descontos'] || null,
      preco_com_impostos: row['Preço com impostos'] || null,
      preco_unitario: row['Preço unitário'] || null,
      ton_por_ean: row['TON por EAN'] || null,
      niv_por_ean: row['NIV por EAN'] || null,
      caixas_por_camada: row['Caixas por Camada'] || null,
      caixas_por_pallet: row['Caixas por Pallet'] || null,
    }));

    const { error } = await supabase
      .from('condicoes_comerciais')
      .insert(condicoes);

    if (error) {
      console.error(`Error in batch for empresa ${empresaCodigo}:`, error);
      errors += condicoes.length;
    } else {
      processedRows += condicoes.length;
    }
  }

  return { empresaCodigo, processedRows, errors, total: data.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting complete NIV import process');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user and check admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Admin check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem importar dados.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Import authorized for admin:', user.email);

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${file.name}`);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer);
    
    console.log(`Found ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);

    const results = [];
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalRows = 0;

    // Processar cada aba
    for (const sheetName of workbook.SheetNames) {
      // Verificar se o nome da aba é um código de empresa válido (501, 502, 1, etc)
      const empresaCodigo = sheetName.trim();
      
      console.log(`Processing sheet: ${sheetName} as empresa ${empresaCodigo}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(worksheet) as NivRow[];
      
      if (data.length === 0) {
        console.log(`Sheet ${sheetName} is empty, skipping`);
        continue;
      }

      try {
        const result = await processSheet(supabase, data, empresaCodigo);
        results.push(result);
        totalProcessed += result.processedRows;
        totalErrors += result.errors;
        totalRows += result.total;
      } catch (error) {
        console.error(`Error processing sheet ${sheetName}:`, error);
        results.push({
          empresaCodigo,
          processedRows: 0,
          errors: data.length,
          total: data.length,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        totalErrors += data.length;
        totalRows += data.length;
      }
    }

    const hasErrors = totalErrors > 0;
    const message = hasErrors
      ? `Importação concluída com ${totalErrors} erros. ${totalProcessed} itens importados com sucesso.`
      : `Importação concluída com sucesso! ${totalProcessed} itens importados de ${workbook.SheetNames.length} empresas.`;

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        message,
        stats: {
          total: totalRows,
          processados: totalProcessed,
          erros: totalErrors,
          empresas: workbook.SheetNames.length,
        },
        details: results,
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
