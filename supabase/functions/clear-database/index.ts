import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem limpar o banco de dados.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting database clear by admin:', user.email);

    // Deletar na ordem correta para respeitar foreign keys
    console.log('Deleting condicoes_comerciais...');
    const { error: condicoesError } = await supabase
      .from('condicoes_comerciais')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (condicoesError) {
      console.error('Error deleting condicoes_comerciais:', condicoesError);
      throw condicoesError;
    }

    console.log('Deleting estoque...');
    const { error: estoqueError } = await supabase
      .from('estoque')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (estoqueError) {
      console.error('Error deleting estoque:', estoqueError);
      throw estoqueError;
    }

    console.log('Deleting produtos...');
    const { error: produtosError } = await supabase
      .from('produtos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (produtosError) {
      console.error('Error deleting produtos:', produtosError);
      throw produtosError;
    }

    console.log('Deleting categorias...');
    const { error: categoriasError } = await supabase
      .from('categorias')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (categoriasError) {
      console.error('Error deleting categorias:', categoriasError);
      throw categoriasError;
    }

    console.log('Deleting fornecedores...');
    const { error: fornecedoresError } = await supabase
      .from('fornecedores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (fornecedoresError) {
      console.error('Error deleting fornecedores:', fornecedoresError);
      throw fornecedoresError;
    }

    console.log('Deleting empresas...');
    const { error: empresasError } = await supabase
      .from('empresas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (empresasError) {
      console.error('Error deleting empresas:', empresasError);
      throw empresasError;
    }

    console.log('Database cleared successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Banco de dados limpo com sucesso!',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Clear database error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao limpar banco de dados';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
