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

async function processImport(
  supabase: any,
  data: EstoqueRow[]
) {
  console.log('Starting background processing');
  let processedRows = 0;
  let errors = 0;

  // Coletar dados únicos para batch inserts
  const empresasMap = new Map<string, any>();
  const fornecedoresMap = new Map<string, any>();
  const categoriasSet = new Set<string>();
  const produtosMap = new Map<string, any>(); // key: codigo_fornecedor

  // Primeira passada: coletar dados únicos
  for (const row of data) {
    if (row.Empresa) {
      empresasMap.set(String(row.Empresa), {
        codigo: String(row.Empresa),
        nome: `Empresa ${row.Empresa}`
      });
    }
    
    if (row.FORNECEDOR) {
      fornecedoresMap.set(String(row.FORNECEDOR), {
        codigo: String(row.FORNECEDOR),
        nome: `Fornecedor ${row.FORNECEDOR}`
      });
    }
    
    if (row.CATEGORIA) {
      categoriasSet.add(row.CATEGORIA);
    }
    
    // Deduplicar produtos por codigo + fornecedor
    if (row.PRODUTO && row.FORNECEDOR) {
      const key = `${row.PRODUTO}_${row.FORNECEDOR}`;
      if (!produtosMap.has(key)) {
        produtosMap.set(key, {
          codigo: String(row.PRODUTO),
          fornecedor_codigo: String(row.FORNECEDOR),
          ean: row.EAN ? String(row.EAN) : null,
          descricao: row.DESCRIÇÃO,
          categoria_nome: row.CATEGORIA,
          qt_cx_compra: row.QT_CX_COMPRA || null,
        });
      }
    }
  }

  console.log(`Inserting ${empresasMap.size} empresas`);
  if (empresasMap.size > 0) {
    const { error } = await supabase
      .from('empresas')
      .upsert(Array.from(empresasMap.values()), { onConflict: 'codigo', ignoreDuplicates: false });
    if (error) console.error('Erro ao inserir empresas:', error);
  }

  console.log(`Inserting ${fornecedoresMap.size} fornecedores`);
  if (fornecedoresMap.size > 0) {
    const { error } = await supabase
      .from('fornecedores')
      .upsert(Array.from(fornecedoresMap.values()), { onConflict: 'codigo', ignoreDuplicates: false });
    if (error) console.error('Erro ao inserir fornecedores:', error);
  }

  console.log(`Inserting ${categoriasSet.size} categorias`);
  if (categoriasSet.size > 0) {
    const { error } = await supabase
      .from('categorias')
      .upsert(Array.from(categoriasSet).map(nome => ({ nome })), { onConflict: 'nome', ignoreDuplicates: false });
    if (error) console.error('Erro ao inserir categorias:', error);
  }

  // Buscar IDs
  const { data: empresas } = await supabase.from('empresas').select('id, codigo');
  const { data: fornecedores } = await supabase.from('fornecedores').select('id, codigo');
  const { data: categorias } = await supabase.from('categorias').select('id, nome');

  const empresasIdMap = new Map(empresas?.map((e: any) => [e.codigo, e.id]) || []);
  const fornecedoresIdMap = new Map(fornecedores?.map((f: any) => [f.codigo, f.id]) || []);
  const categoriasIdMap = new Map(categorias?.map((c: any) => [c.nome, c.id]) || []);

  console.log(`Inserting ${produtosMap.size} produtos únicos`);
  // Inserir produtos únicos em lotes
  const produtosArray = Array.from(produtosMap.values());
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < produtosArray.length; i += BATCH_SIZE) {
    const batch = produtosArray.slice(i, i + BATCH_SIZE);
    const produtos = batch.map(p => ({
      codigo: p.codigo,
      ean: p.ean,
      descricao: p.descricao,
      categoria_id: categoriasIdMap.get(p.categoria_nome),
      fornecedor_id: fornecedoresIdMap.get(p.fornecedor_codigo),
      qt_cx_compra: p.qt_cx_compra,
    }));

    const { error } = await supabase
      .from('produtos')
      .upsert(produtos, { onConflict: 'codigo,fornecedor_id', ignoreDuplicates: false });

    if (error) {
      console.error(`Erro no lote de produtos ${i / BATCH_SIZE}:`, error);
      errors += batch.length;
    } else {
      processedRows += batch.length;
    }

    if (i % 200 === 0) {
      console.log(`Progresso: ${i}/${produtosArray.length} produtos processados`);
    }
  }

  console.log('Buscando IDs dos produtos');
  const { data: produtosData } = await supabase
    .from('produtos')
    .select('id, codigo, fornecedor_id');

  const produtosIdMap = new Map(
    produtosData?.map((p: any) => [`${p.codigo}_${p.fornecedor_id}`, p.id]) || []
  );

  console.log('Inserting estoque (uma linha por produto-empresa)');
  processedRows = 0;
  
  // Processar estoque - agora cada linha do Excel é única por produto+empresa
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const estoques = batch
      .map(row => {
        const empresaId = empresasIdMap.get(String(row.Empresa));
        const fornecedorId = fornecedoresIdMap.get(String(row.FORNECEDOR));
        const produtoId = produtosIdMap.get(`${row.PRODUTO}_${fornecedorId}`);

        if (!produtoId || !empresaId) {
          return null;
        }

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

    if (estoques.length > 0) {
      const { error } = await supabase
        .from('estoque')
        .upsert(estoques, { onConflict: 'produto_id,empresa_id', ignoreDuplicates: false });

      if (error) {
        console.error(`Erro no lote de estoque ${i / BATCH_SIZE}:`, error);
        errors += estoques.length;
      } else {
        processedRows += estoques.length;
      }
    }

    if (i % 200 === 0) {
      console.log(`Progresso: ${i}/${data.length} itens de estoque processados`);
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

    console.log('Starting import process');

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
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(worksheet) as EstoqueRow[];

    console.log(`Found ${data.length} rows to process`);

    const { processedRows, errors } = await processImport(supabase, data);

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
