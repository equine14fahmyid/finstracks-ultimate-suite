
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, ShoppingCart } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface SummaryCardsProps {
  startDate: string;
  endDate: string;
}

export const SummaryCards = ({ startDate, endDate }: SummaryCardsProps) => {
  const { 
    totalSales, 
    totalExpenses, 
    netProfit, 
    totalCashBank, 
    salesCount,
    loading, 
    error,
    refreshMetrics 
  } = useDashboardMetrics(startDate, endDate);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <LoadingSpinner size="md" text="Memuat..." />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Gagal Memuat Data"
        message={error}
        onRetry={refreshMetrics}
      />
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const cards = [
    {
      title: 'Total Penjualan',
      value: formatCurrency(totalSales),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `${salesCount} transaksi`
    },
    {
      title: 'Total Pengeluaran',
      value: formatCurrency(totalExpenses),
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      subtitle: 'Periode ini'
    },
    {
      title: 'Laba Bersih',
      value: formatCurrency(netProfit),
      icon: netProfit >= 0 ? TrendingUp : TrendingDown,
      color: getProfitColor(netProfit),
      bgColor: netProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
      subtitle: netProfit >= 0 ? 'Untung' : 'Rugi'
    },
    {
      title: 'Saldo Kas & Bank',
      value: formatCurrency(totalCashBank),
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: 'Total saldo'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
