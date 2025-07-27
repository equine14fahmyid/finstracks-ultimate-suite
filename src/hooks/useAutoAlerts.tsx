
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSystemNotifications } from './useSystemNotifications';
import { useDashboardMetrics } from './useDashboardMetrics';
import { useLowStockAlerts } from './useLowStockAlerts';

export const useAutoAlerts = () => {
  const { user } = useAuth();
  const { createNotification } = useSystemNotifications();
  const { totalCashBank } = useDashboardMetrics(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  );
  const { lowStockProducts } = useLowStockAlerts();

  // Monitor low cash balance
  useEffect(() => {
    if (!user || totalCashBank === 0) return;

    const LOW_CASH_THRESHOLD = 1000000; // 1 million IDR

    if (totalCashBank < LOW_CASH_THRESHOLD) {
      createNotification({
        title: 'Peringatan: Saldo Kas Rendah',
        message: `Saldo kas & bank hanya tersisa ${new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR'
        }).format(totalCashBank)}`,
        type: 'warning'
      });
    }
  }, [totalCashBank, user, createNotification]);

  // Monitor low stock products
  useEffect(() => {
    if (!user || lowStockProducts.length === 0) return;

    const criticalProducts = lowStockProducts.filter(p => p.status === 'critical');
    
    if (criticalProducts.length > 0) {
      createNotification({
        title: 'Peringatan: Stok Kritis',
        message: `${criticalProducts.length} produk memiliki stok kritis. Segera lakukan restocking!`,
        type: 'error',
        action_url: '/inventory'
      });
    }
  }, [lowStockProducts, user, createNotification]);

  // Monitor new sales
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sales-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          const newSale = payload.new;
          createNotification({
            title: 'Penjualan Baru',
            message: `Pesanan baru dari ${newSale.customer_name} senilai ${new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR'
            }).format(newSale.total)}`,
            type: 'success',
            action_url: '/sales'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          const updatedSale = payload.new;
          const oldSale = payload.old;
          
          if (updatedSale.status === 'delivered' && oldSale.status !== 'delivered') {
            createNotification({
              title: 'Pesanan Selesai',
              message: `Pesanan ${updatedSale.no_pesanan_platform} telah selesai dan dana masuk ke saldo toko`,
              type: 'info',
              action_url: '/sales'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, createNotification]);

  return null; // This is a side-effect only hook
};
