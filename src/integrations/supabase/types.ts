export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          akumulasi_penyusutan: number | null
          created_at: string | null
          harga_perolehan: number
          id: string
          is_active: boolean | null
          kode_asset: string
          nama_asset: string
          nilai_buku: number | null
          penyusutan_per_bulan: number | null
          tanggal_perolehan: string
          umur_ekonomis_bulan: number
          updated_at: string | null
        }
        Insert: {
          akumulasi_penyusutan?: number | null
          created_at?: string | null
          harga_perolehan: number
          id?: string
          is_active?: boolean | null
          kode_asset?: string
          nama_asset?: string
          nilai_buku?: number | null
          penyusutan_per_bulan?: number | null
          tanggal_perolehan: string
          umur_ekonomis_bulan: number
          updated_at?: string | null
        }
        Update: {
          akumulasi_penyusutan?: number | null
          created_at?: string | null
          harga_perolehan?: number
          id?: string
          is_active?: boolean | null
          kode_asset?: string
          nama_asset?: string
          nilai_buku?: number | null
          penyusutan_per_bulan?: number | null
          tanggal_perolehan?: string
          umur_ekonomis_bulan?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      assets_backup: {
        Row: {
          akumulasi_penyusutan: number | null
          created_at: string | null
          harga_perolehan: number | null
          id: string | null
          is_active: boolean | null
          kode_asset: string | null
          nama_asset: string | null
          nilai_buku: number | null
          penyusutan_per_bulan: number | null
          tanggal_perolehan: string | null
          umur_ekonomis_bulan: number | null
          updated_at: string | null
        }
        Insert: {
          akumulasi_penyusutan?: number | null
          created_at?: string | null
          harga_perolehan?: number | null
          id?: string | null
          is_active?: boolean | null
          kode_asset?: string | null
          nama_asset?: string | null
          nilai_buku?: number | null
          penyusutan_per_bulan?: number | null
          tanggal_perolehan?: string | null
          umur_ekonomis_bulan?: number | null
          updated_at?: string | null
        }
        Update: {
          akumulasi_penyusutan?: number | null
          created_at?: string | null
          harga_perolehan?: number | null
          id?: string | null
          is_active?: boolean | null
          kode_asset?: string | null
          nama_asset?: string | null
          nilai_buku?: number | null
          penyusutan_per_bulan?: number | null
          tanggal_perolehan?: string | null
          umur_ekonomis_bulan?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      banks: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          nama_bank: string
          nama_pemilik: string
          no_rekening: string
          saldo_akhir: number | null
          saldo_awal: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nama_bank: string
          nama_pemilik: string
          no_rekening: string
          saldo_akhir?: number | null
          saldo_awal?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nama_bank?: string
          nama_pemilik?: string
          no_rekening?: string
          saldo_akhir?: number | null
          saldo_awal?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          nama_kategori: string
          tipe_kategori: Database["public"]["Enums"]["category_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nama_kategori?: string
          tipe_kategori?: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nama_kategori?: string
          tipe_kategori?: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      expeditions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          kode_ekspedisi: string | null
          nama_ekspedisi: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kode_ekspedisi?: string | null
          nama_ekspedisi: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kode_ekspedisi?: string | null
          nama_ekspedisi?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          bank_id: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          jumlah: number
          keterangan: string | null
          tanggal: string
          updated_at: string | null
        }
        Insert: {
          bank_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jumlah: number
          keterangan?: string | null
          tanggal: string
          updated_at?: string | null
        }
        Update: {
          bank_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jumlah?: number
          keterangan?: string | null
          tanggal?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          bank_id: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          jumlah: number
          keterangan: string | null
          tanggal: string
          updated_at: string | null
        }
        Insert: {
          bank_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jumlah: number
          keterangan?: string | null
          tanggal: string
          updated_at?: string | null
        }
        Update: {
          bank_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jumlah?: number
          keterangan?: string | null
          tanggal?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incomes_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platforms: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          komisi_default_persen: number | null
          metode_pencairan: string | null
          nama_platform: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          komisi_default_persen?: number | null
          metode_pencairan?: string | null
          nama_platform: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          komisi_default_persen?: number | null
          metode_pencairan?: string | null
          nama_platform?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          product_id: string | null
          size: string
          sku: string | null
          stok: number | null
          updated_at: string | null
          warna: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          size: string
          sku?: string | null
          stok?: number | null
          updated_at?: string | null
          warna: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          size?: string
          sku?: string | null
          stok?: number | null
          updated_at?: string | null
          warna?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          deskripsi: string | null
          harga_beli: number
          harga_jual_default: number
          id: string
          is_active: boolean | null
          nama_produk: string
          satuan: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deskripsi?: string | null
          harga_beli: number
          harga_jual_default: number
          id?: string
          is_active?: boolean | null
          nama_produk: string
          satuan?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deskripsi?: string | null
          harga_beli?: number
          harga_jual_default?: number
          id?: string
          is_active?: boolean | null
          nama_produk?: string
          satuan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string | null
          harga_beli_satuan: number
          id: string
          product_variant_id: string | null
          purchase_id: string | null
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          harga_beli_satuan: number
          id?: string
          product_variant_id?: string | null
          purchase_id?: string | null
          quantity: number
          subtotal: number
        }
        Update: {
          created_at?: string | null
          harga_beli_satuan?: number
          id?: string
          product_variant_id?: string | null
          purchase_id?: string | null
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          bank_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          no_invoice_supplier: string | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: string | null
          subtotal: number
          supplier_id: string | null
          tanggal: string
          total: number
          updated_at: string | null
        }
        Insert: {
          bank_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          no_invoice_supplier?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: string | null
          subtotal: number
          supplier_id?: string | null
          tanggal: string
          total: number
          updated_at?: string | null
        }
        Update: {
          bank_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          no_invoice_supplier?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: string | null
          subtotal?: number
          supplier_id?: string | null
          tanggal?: string
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string | null
          harga_satuan: number
          id: string
          product_variant_id: string | null
          quantity: number
          sale_id: string | null
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          harga_satuan: number
          id?: string
          product_variant_id?: string | null
          quantity: number
          sale_id?: string | null
          subtotal: number
        }
        Update: {
          created_at?: string | null
          harga_satuan?: number
          id?: string
          product_variant_id?: string | null
          quantity?: number
          sale_id?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          adjustment_notes: string | null
          created_at: string | null
          created_by: string | null
          customer_address: string | null
          customer_name: string
          customer_phone: string | null
          diskon: number | null
          expedition_id: string | null
          id: string
          needs_adjustment: boolean | null
          no_pesanan_platform: string
          no_resi: string | null
          notes: string | null
          ongkir: number | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          store_id: string | null
          subtotal: number
          tanggal: string
          total: number
          updated_at: string | null
          validated_at: string | null
        }
        Insert: {
          adjustment_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: string | null
          customer_name: string
          customer_phone?: string | null
          diskon?: number | null
          expedition_id?: string | null
          id?: string
          needs_adjustment?: boolean | null
          no_pesanan_platform: string
          no_resi?: string | null
          notes?: string | null
          ongkir?: number | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          store_id?: string | null
          subtotal: number
          tanggal: string
          total: number
          updated_at?: string | null
          validated_at?: string | null
        }
        Update: {
          adjustment_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string | null
          diskon?: number | null
          expedition_id?: string | null
          id?: string
          needs_adjustment?: boolean | null
          no_pesanan_platform?: string
          no_resi?: string | null
          notes?: string | null
          ongkir?: number | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          store_id?: string | null
          subtotal?: number
          tanggal?: string
          total?: number
          updated_at?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_expedition_id_fkey"
            columns: ["expedition_id"]
            isOneToOne: false
            referencedRelation: "expeditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_adjustments: {
        Row: {
          adjustment_type: Database["public"]["Enums"]["adjustment_type"]
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          sale_id: string
          updated_at: string | null
        }
        Insert: {
          adjustment_type: Database["public"]["Enums"]["adjustment_type"]
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          sale_id: string
          updated_at?: string | null
        }
        Update: {
          adjustment_type?: Database["public"]["Enums"]["adjustment_type"]
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          sale_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_adjustments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          bank_id: string | null
          biaya_admin: number | null
          created_at: string | null
          created_by: string | null
          id: string
          jumlah_dicairkan: number
          keterangan: string | null
          store_id: string | null
          tanggal: string
          updated_at: string | null
        }
        Insert: {
          bank_id?: string | null
          biaya_admin?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jumlah_dicairkan: number
          keterangan?: string | null
          store_id?: string | null
          tanggal: string
          updated_at?: string | null
        }
        Update: {
          bank_id?: string | null
          biaya_admin?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jumlah_dicairkan?: number
          keterangan?: string | null
          store_id?: string | null
          tanggal?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlements_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          alert_enabled: boolean | null
          created_at: string | null
          id: string
          last_alert_sent: string | null
          min_stock_threshold: number
          product_variant_id: string | null
          updated_at: string | null
        }
        Insert: {
          alert_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_alert_sent?: string | null
          min_stock_threshold?: number
          product_variant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_alert_sent?: string | null
          min_stock_threshold?: number
          product_variant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          movement_type: string
          notes: string | null
          product_variant_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_variant_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_variant_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          link_toko: string | null
          nama_marketing: string
          nama_toko: string
          no_hp: string | null
          platform_id: string | null
          saldo_dashboard: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          link_toko?: string | null
          nama_marketing: string
          nama_toko: string
          no_hp?: string | null
          platform_id?: string | null
          saldo_dashboard?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          link_toko?: string | null
          nama_marketing?: string
          nama_toko?: string
          no_hp?: string | null
          platform_id?: string | null
          saldo_dashboard?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          alamat: string | null
          created_at: string | null
          deskripsi: string | null
          email: string | null
          id: string
          is_active: boolean | null
          nama_supplier: string
          no_hp: string | null
          updated_at: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string | null
          deskripsi?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          nama_supplier: string
          no_hp?: string | null
          updated_at?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string | null
          deskripsi?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          nama_supplier?: string
          no_hp?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          company_website: string | null
          created_at: string | null
          currency: string | null
          daily_reports: boolean | null
          date_format: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          login_attempts: number | null
          logo_url: string | null
          low_stock_alerts: boolean | null
          modal_awal: number | null
          monthly_reports: boolean | null
          password_expiry: number | null
          payment_reminders: boolean | null
          push_notifications: boolean | null
          session_timeout: number | null
          sms_notifications: boolean | null
          tax_number: string | null
          theme: string | null
          timezone: string | null
          two_factor_auth: boolean | null
          updated_at: string | null
          user_id: string | null
          weekly_reports: boolean | null
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_website?: string | null
          created_at?: string | null
          currency?: string | null
          daily_reports?: boolean | null
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          login_attempts?: number | null
          logo_url?: string | null
          low_stock_alerts?: boolean | null
          modal_awal?: number | null
          monthly_reports?: boolean | null
          password_expiry?: number | null
          payment_reminders?: boolean | null
          push_notifications?: boolean | null
          session_timeout?: number | null
          sms_notifications?: boolean | null
          tax_number?: string | null
          theme?: string | null
          timezone?: string | null
          two_factor_auth?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          weekly_reports?: boolean | null
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_website?: string | null
          created_at?: string | null
          currency?: string | null
          daily_reports?: boolean | null
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          login_attempts?: number | null
          logo_url?: string | null
          low_stock_alerts?: boolean | null
          modal_awal?: number | null
          monthly_reports?: boolean | null
          password_expiry?: number | null
          payment_reminders?: boolean | null
          push_notifications?: boolean | null
          session_timeout?: number | null
          sms_notifications?: boolean | null
          tax_number?: string | null
          theme?: string | null
          timezone?: string | null
          two_factor_auth?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          weekly_reports?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_low_stock: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_store_saldo: {
        Args: { store_id_param: string }
        Returns: {
          store_name: string
          current_saldo: number
        }[]
      }
      create_sale_with_stock_check: {
        Args: { sale_data: Json; sale_items: Json[] }
        Returns: string
      }
      debug_settlement: {
        Args: { p_store_id: string; p_bank_id: string; p_amount: number }
        Returns: Json
      }
      get_inventory_value_on_date: {
        Args: { p_report_date: string }
        Returns: number
      }
      manual_saldo_update: {
        Args: { store_id_param: string; amount_param: number }
        Returns: boolean
      }
      process_settlement: {
        Args: {
          p_store_id: string
          p_bank_id: string
          p_amount: number
          p_admin_fee: number
          p_notes: string
          p_income_category_id: string
          p_settlement_date: string
          p_user_id: string
        }
        Returns: undefined
      }
      process_settlement_debug: {
        Args: {
          p_store_id: string
          p_bank_id: string
          p_amount: number
          p_admin_fee?: number
          p_notes?: string
          p_income_category_id?: string
          p_settlement_date?: string
          p_user_id?: string
        }
        Returns: Json
      }
      process_settlement_test: {
        Args: {
          p_store_id: string
          p_bank_id: string
          p_amount: number
          p_admin_fee?: number
          p_notes?: string
          p_income_category_id?: string
          p_settlement_date?: string
          p_user_id?: string
        }
        Returns: Json
      }
      process_settlement_v2: {
        Args: {
          p_store_id: string
          p_bank_id: string
          p_amount: number
          p_admin_fee?: number
          p_notes?: string
          p_income_category_id?: string
          p_settlement_date?: string
          p_user_id?: string
        }
        Returns: Json
      }
      update_sale_status_only: {
        Args: { sale_id: string; new_status: string }
        Returns: undefined
      }
      update_sale_with_stock_check: {
        Args: {
          sale_id: string
          sale_data: Json
          sale_items: Json[]
          existing_items: Json[]
        }
        Returns: undefined
      }
      update_store_saldo: {
        Args: { store_id: string; amount: number }
        Returns: undefined
      }
      validate_sale_with_adjustments: {
        Args: { sale_id_param: string; adjustments?: Json }
        Returns: undefined
      }
    }
    Enums: {
      adjustment_type: "denda" | "selisih_ongkir" | "pinalti"
      category_type: "income" | "expense"
      payment_method: "cash" | "transfer" | "credit"
      transaction_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
      user_role: "superadmin" | "admin" | "staff" | "viewers"
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
    Enums: {
      adjustment_type: ["denda", "selisih_ongkir", "pinalti"],
      category_type: ["income", "expense"],
      payment_method: ["cash", "transfer", "credit"],
      transaction_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      user_role: ["superadmin", "admin", "staff", "viewers"],
    },
  },
} as const
