export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      condicoes_comerciais: {
        Row: {
          caixas_por_camada: number | null
          caixas_por_pallet: number | null
          categoria: string | null
          codigo_ean: string | null
          codigo_sku: string
          created_at: string
          descricao: string
          empresa_id: string | null
          id: string
          itens_por_caixa: number | null
          niv_por_ean: number | null
          preco_apos_descontos: number | null
          preco_com_impostos: number | null
          preco_unitario: number | null
          ton_por_ean: number | null
          updated_at: string
        }
        Insert: {
          caixas_por_camada?: number | null
          caixas_por_pallet?: number | null
          categoria?: string | null
          codigo_ean?: string | null
          codigo_sku: string
          created_at?: string
          descricao: string
          empresa_id?: string | null
          id?: string
          itens_por_caixa?: number | null
          niv_por_ean?: number | null
          preco_apos_descontos?: number | null
          preco_com_impostos?: number | null
          preco_unitario?: number | null
          ton_por_ean?: number | null
          updated_at?: string
        }
        Update: {
          caixas_por_camada?: number | null
          caixas_por_pallet?: number | null
          categoria?: string | null
          codigo_ean?: string | null
          codigo_sku?: string
          created_at?: string
          descricao?: string
          empresa_id?: string | null
          id?: string
          itens_por_caixa?: number | null
          niv_por_ean?: number | null
          preco_apos_descontos?: number | null
          preco_com_impostos?: number | null
          preco_unitario?: number | null
          ton_por_ean?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "condicoes_comerciais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          codigo: string
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      estoque: {
        Row: {
          created_at: string | null
          custo_cx: number | null
          custo_un: number | null
          dias_estoque: number | null
          empresa_id: string | null
          id: string
          livro: number | null
          m_0: number | null
          m_1: number | null
          m_2: number | null
          m_3: number | null
          pendente: number | null
          produto_id: string | null
          qtd_disponivel: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custo_cx?: number | null
          custo_un?: number | null
          dias_estoque?: number | null
          empresa_id?: string | null
          id?: string
          livro?: number | null
          m_0?: number | null
          m_1?: number | null
          m_2?: number | null
          m_3?: number | null
          pendente?: number | null
          produto_id?: string | null
          qtd_disponivel?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custo_cx?: number | null
          custo_un?: number | null
          dias_estoque?: number | null
          empresa_id?: string | null
          id?: string
          livro?: number | null
          m_0?: number | null
          m_1?: number | null
          m_2?: number | null
          m_3?: number | null
          pendente?: number | null
          produto_id?: string | null
          qtd_disponivel?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          codigo: string
          created_at: string | null
          id: string
          nome: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: string
          nome?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          data_atualizacao: string
          data_criacao: string
          empresa_id: string | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          status: string
        }
        Insert: {
          data_atualizacao?: string
          data_criacao?: string
          empresa_id?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
        }
        Update: {
          data_atualizacao?: string
          data_criacao?: string
          empresa_id?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_itens: {
        Row: {
          created_at: string
          id: string
          pedido_id: string
          preco_cx_niv: number | null
          produto_id: string | null
          qtd_camada: number
          qtd_pallet: number
          qtd_pedido: number
        }
        Insert: {
          created_at?: string
          id?: string
          pedido_id: string
          preco_cx_niv?: number | null
          produto_id?: string | null
          qtd_camada?: number
          qtd_pallet?: number
          qtd_pedido?: number
        }
        Update: {
          created_at?: string
          id?: string
          pedido_id?: string
          preco_cx_niv?: number | null
          produto_id?: string | null
          qtd_camada?: number
          qtd_pallet?: number
          qtd_pedido?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria_id: string | null
          codigo: string
          created_at: string | null
          descricao: string
          ean: string | null
          fornecedor_id: string | null
          id: string
          qt_cx_compra: number | null
        }
        Insert: {
          categoria_id?: string | null
          codigo: string
          created_at?: string | null
          descricao: string
          ean?: string | null
          fornecedor_id?: string | null
          id?: string
          qt_cx_compra?: number | null
        }
        Update: {
          categoria_id?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string
          ean?: string | null
          fornecedor_id?: string | null
          id?: string
          qt_cx_compra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
