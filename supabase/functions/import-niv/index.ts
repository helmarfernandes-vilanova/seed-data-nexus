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

async function processImport(
  supabase: any,
  data: NivRow[],
  empresaCodigo: string
) {
  console.log(`Starting NIV import for empresa ${empresaCodigo}`);
  let processedRows = 0;
  let errors = 0;

  // Buscar ou criar empresa
  let { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('id')
    .eq('codigo', empresaCodigo)
    .single();

  if (empresaError || !empresa) {
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
  console.log(`Using empresa ID: ${empresaId}`);

  // Deletar registros existentes da empresa antes de importar novos
  console.log('Deletando registros existentes...');
  await supabase
    .from('condicoes_comerciais')
    .delete()
    .eq('empresa_id', empresaId);

  // Processar condições comerciais em lotes
  const BATCH_SIZE = 50;
  
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
      console.error(`Erro no lote ${i / BATCH_SIZE}:`, error);
      errors += condicoes.length;
    } else {
      processedRows += condicoes.length;
    }

    if (i % 200 === 0) {
      console.log(`Progresso: ${i}/${data.length} condições processadas`);
    }
  }

  console.log(`Import completed: ${processedRows} processed, ${errors} errors`);
  return { processedRows, errors };
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

    console.log('Starting NIV import process');

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
    const empresaCodigo = formData.get('empresaCodigo') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!empresaCodigo) {
      return new Response(
        JSON.stringify({ error: 'Código da empresa não informado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${file.name} for empresa ${empresaCodigo}`);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(worksheet) as NivRow[];

    console.log(`Found ${data.length} rows to process`);

    const { processedRows, errors } = await processImport(supabase, data, empresaCodigo);

    return new Response(
      JSON.stringify({
        success: true,
        message: errors > 0 
          ? `Importação concluída com ${errors} erros. ${processedRows - errors} itens importados com sucesso.`
          : 'Importação concluída com sucesso!',
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
