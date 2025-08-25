import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Check, CreditCard, RefreshCw } from 'lucide-react';

interface SubscriptionData {
  subscribed: boolean;
  plan_type?: string;
  expires_at?: string;
  price?: number;
  features?: string[];
}

export const SubscriptionManagement: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      features: ['5 kullanıcı', '50 fatura/ay', 'Temel raporlar', 'Email desteği'],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 49,
      features: ['15 kullanıcı', '200 fatura/ay', 'Gelişmiş raporlar', 'API erişimi', 'Öncelikli destek'],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      features: ['50 kullanıcı', '1000 fatura/ay', 'Özel entegrasyonlar', 'Özel destek', 'SLA garantisi'],
      popular: false
    }
  ];

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscription(data);
    } catch (error) {
      console.error('Subscription check error:', error);
      toast.error('Abonelik durumu kontrol edilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: string) => {
    try {
      setActionLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast.success('Ödeme sayfasına yönlendiriliyorsunuz...');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Ödeme işlemi başlatılamadı');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setActionLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      // Open Stripe customer portal in a new tab
      window.open(data.url, '_blank');
      
      toast.success('Abonelik yönetim sayfasına yönlendiriliyorsunuz...');
    } catch (error) {
      console.error('Customer portal error:', error);
      toast.error('Abonelik yönetimi açılamadı');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const getStatusBadge = (planType?: string, subscribed?: boolean) => {
    if (!subscribed || planType === 'trial') {
      return <Badge variant="secondary">Deneme</Badge>;
    }
    
    switch (planType) {
      case 'basic':
        return <Badge variant="default">Basic</Badge>;
      case 'professional':
        return <Badge variant="default" className="bg-primary">Professional</Badge>;
      case 'enterprise':
        return <Badge variant="default" className="bg-purple-600">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Abonelik durumu kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Mevcut Abonelik
              {getStatusBadge(subscription.plan_type, subscription.subscribed)}
            </CardTitle>
            <CardDescription>
              {subscription.subscribed ? 
                `Aboneliğiniz ${subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString('tr-TR') : ''} tarihine kadar geçerli` :
                'Şu anda deneme sürümünü kullanıyorsunuz'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription.subscribed && subscription.price && (
              <div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(subscription.price)}<span className="text-sm font-normal text-muted-foreground">/ay</span>
                </p>
              </div>
            )}
            
            {subscription.features && (
              <div>
                <h4 className="font-semibold mb-2">Özellikler:</h4>
                <ul className="space-y-1">
                  {subscription.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button onClick={checkSubscription} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Durumu Kontrol Et
              </Button>
              
              {subscription.subscribed && (
                <Button 
                  onClick={handleManageSubscription} 
                  variant="outline" 
                  size="sm"
                  disabled={actionLoading}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Aboneliği Yönet
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Abonelik Planları</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  En Popüler
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-primary">{formatCurrency(plan.price)}</span>
                  <span className="text-sm text-muted-foreground">/ay</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={actionLoading || (subscription?.subscribed && subscription?.plan_type === plan.id)}
                >
                  {subscription?.subscribed && subscription?.plan_type === plan.id ? 
                    'Mevcut Plan' : 
                    'Bu Planı Seç'
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};