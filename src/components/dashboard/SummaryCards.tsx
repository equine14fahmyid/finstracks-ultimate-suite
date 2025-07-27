
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Wallet, BarChart3, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

interface SummaryData {
  total_penjualan: number;
  total_pengeluaran: number;
  laba_bersih: number;
  saldo_kas_bank: number;
}

interface SummaryCardsProps {
  data: SummaryData | null;
  loading?: boolean;
}

const SummaryCards = ({ data, loading }: SummaryCardsProps) => {
  // Use real data from dashboard metrics
  const summaryData = data || {
    total_penjualan: 0,
    total_pengeluaran: 0,
    laba_bersih: 0,
    saldo_kas_bank: 0
  };

  const cards = [
    {
      title: 'Total Penjualan',
      value: summaryData.total_penjualan,
      icon: TrendingUp,
      gradient: 'from-success to-success-light',
      textColor: 'text-success',
      bgColor: 'bg-success/10',
      description: summaryData.total_penjualan === 0 ? 'Belum ada penjualan' : 'Penjualan periode ini',
      trend: summaryData.total_penjualan > 0 ? '+' : ''
    },
    {
      title: 'Total Pengeluaran',
      value: summaryData.total_pengeluaran,
      icon: TrendingDown,
      gradient: 'from-warning to-warning-light',
      textColor: 'text-warning',
      bgColor: 'bg-warning/10',
      description: summaryData.total_pengeluaran === 0 ? 'Belum ada pengeluaran' : 'Pengeluaran periode ini',
      trend: summaryData.total_pengeluaran > 0 ? '-' : ''
    },
    {
      title: 'Laba Bersih',
      value: summaryData.laba_bersih,
      icon: BarChart3,
      gradient: summaryData.laba_bersih >= 0 ? 'from-primary to-primary-light' : 'from-error to-error-light',
      textColor: summaryData.laba_bersih >= 0 ? 'text-primary' : 'text-error',
      bgColor: summaryData.laba_bersih >= 0 ? 'bg-primary/10' : 'bg-error/10',
      description: summaryData.laba_bersih === 0 ? 'Belum ada keuntungan' : 
                  summaryData.laba_bersih >= 0 ? 'Keuntungan bersih' : 'Kerugian bersih',
      trend: summaryData.laba_bersih >= 0 ? '+' : '-'
    },
    {
      title: 'Saldo Kas & Bank',
      value: summaryData.saldo_kas_bank,
      icon: Wallet,
      gradient: summaryData.saldo_kas_bank >= 0 ? 'from-secondary to-secondary-light' : 'from-error to-error-light',
      textColor: summaryData.saldo_kas_bank >= 0 ? 'text-secondary' : 'text-error',
      bgColor: summaryData.saldo_kas_bank >= 0 ? 'bg-secondary/10' : 'bg-error/10',
      description: summaryData.saldo_kas_bank === 0 ? 'Belum ada saldo' : 
                  summaryData.saldo_kas_bank >= 0 ? 'Total saldo tersedia' : 'Saldo negatif',
      trend: ''
    }
  ];

  return (
    <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card 
          key={card.title} 
          className={cn(
            "glass-card border-0 hover-lift transition-all duration-300",
            "animate-fade-in",
            loading && "animate-pulse"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-2">
            <CardTitle className="text-sm md:text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn("p-1.5 md:p-2 rounded-lg", card.bgColor)}>
              <card.icon className={cn("h-4 w-4 md:h-4 md:w-4", card.textColor)} />
            </div>
          </CardHeader>
          <CardContent className="pb-3 md:pb-4">
            <div className="space-y-1">
              <div className={cn("text-xl md:text-2xl font-bold", card.textColor)}>
                {loading ? (
                  <div className="h-6 md:h-8 bg-muted animate-pulse rounded w-20 md:w-24"></div>
                ) : (
                  <div className="flex items-center gap-1">
                    {card.trend && (
                      <span className="text-sm opacity-60">{card.trend}</span>
                    )}
                    <span className="text-lg md:text-2xl">{formatCurrency(card.value)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>
            
            {/* Gradient Bar */}
            <div className="mt-2 md:mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-1000",
                  card.gradient,
                  loading ? "w-0" : Math.abs(card.value) > 0 ? "w-full" : "w-1"
                )}
                style={{ 
                  animationDelay: `${(index * 100) + 500}ms`,
                  animationDuration: '1000ms',
                  animationFillMode: 'forwards'
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;
