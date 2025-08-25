import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building2, User, FileText, Building, Languages, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Registration form data
  const [registrationData, setRegistrationData] = useState({
    accountType: 'business', // business or individual
    // Company Info
    companyName: '',
    industry: '',
    companySize: '',
    // Personal Info
    firstName: '',
    lastName: '',
    position: '',
    // Contact Info
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'CH',
    // Business Info
    taxNumber: '',
    website: '',
    // Terms
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false,
    // Language Preference
    preferredLanguage: 'de'
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: t('common.error'),
        description: t('auth.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: t('auth.signInError'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('auth.signInSuccess'),
        description: t('auth.welcomeBack'),
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      toast({
        title: t('common.error'),
        description: t('auth.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordMinLength'),
        variant: 'destructive',
      });
      return;
    }

    // Company info validation for business accounts
    if (registrationData.accountType === 'business' && !registrationData.companyName) {
      toast({
        title: t('common.error'),
        description: t('auth.companyNameRequired'),
        variant: 'destructive',
      });
      return;
    }

    // Personal info validation
    if (!registrationData.firstName || !registrationData.lastName) {
      toast({
        title: t('common.error'),
        description: t('auth.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    // Terms validation
    if (!registrationData.acceptTerms || !registrationData.acceptPrivacy) {
      toast({
        title: t('common.error'),
        description: t('auth.consentRequired'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    // Prepare metadata for Supabase
    const metadata = {
      first_name: registrationData.firstName,
      last_name: registrationData.lastName,
      company_name: registrationData.companyName,
      account_type: registrationData.accountType,
      industry: registrationData.industry,
      company_size: registrationData.companySize,
      position: registrationData.position,
      phone: registrationData.phone,
      address: registrationData.address,
      city: registrationData.city,
      postal_code: registrationData.postalCode,
      country: registrationData.country,
      tax_number: registrationData.taxNumber,
      website: registrationData.website,
      accept_marketing: registrationData.acceptMarketing,
      preferred_language: registrationData.preferredLanguage
    };

    const { error } = await signUp(email, password, metadata);
    
    if (error) {
      toast({
        title: t('auth.signUpError'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Set the user's preferred language immediately
      import('@/i18n').then((i18nModule) => {
        i18nModule.default.changeLanguage(registrationData.preferredLanguage);
      });
      
      toast({
        title: t('auth.signUpSuccess'),
        description: t('auth.accountCreated'),
      });
    }
    setLoading(false);
  };

  const updateRegistrationData = (field: string, value: any) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If language preference is changed, immediately update the interface language
    if (field === 'preferredLanguage') {
      import('@/i18n').then((i18nModule) => {
        i18nModule.default.changeLanguage(value);
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="absolute left-4 top-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana Sayfa
          </Button>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">CoreDesk</CardTitle>
          <CardDescription>
            Business Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signin')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('auth.email')}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="ihre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('auth.password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? t('auth.signingIn') : t('auth.signinButton')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-6">
              <form onSubmit={handleSignUp} className="space-y-6">
                {/* Account Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">{t('auth.accountType')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        registrationData.accountType === 'business' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateRegistrationData('accountType', 'business')}
                    >
                      <Building className="h-8 w-8 mb-2 text-primary" />
                      <h3 className="font-medium">{t('auth.businessCustomer')}</h3>
                      <p className="text-sm text-muted-foreground">{t('auth.businessCustomerDesc')}</p>
                    </div>
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        registrationData.accountType === 'individual' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateRegistrationData('accountType', 'individual')}
                    >
                      <User className="h-8 w-8 mb-2 text-primary" />
                      <h3 className="font-medium">{t('auth.privateCustomer')}</h3>
                      <p className="text-sm text-muted-foreground">{t('auth.privateCustomerDesc')}</p>
                    </div>
                  </div>
                </div>

                {/* Language Preference */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">{t('auth.languageSettings')}</Label>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>{t('auth.preferredLanguage')}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div 
                        className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-colors ${
                          registrationData.preferredLanguage === 'de' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => updateRegistrationData('preferredLanguage', 'de')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl flex-shrink-0">🇩🇪</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm sm:text-base">{t('auth.germanLanguage')}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{t('auth.germanLanguageDesc')}</p>
                          </div>
                        </div>
                      </div>
                      <div 
                        className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-colors ${
                          registrationData.preferredLanguage === 'en' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => updateRegistrationData('preferredLanguage', 'en')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl flex-shrink-0">🇺🇸</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm sm:text-base">{t('auth.englishLanguage')}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{t('auth.englishLanguageDesc')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Information - Only for business accounts */}
                {registrationData.accountType === 'business' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">{t('auth.companyInfo')}</Label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">{t('auth.companyName')} *</Label>
                        <Input
                          id="companyName"
                          placeholder="Ihre Firma AG"
                          value={registrationData.companyName}
                          onChange={(e) => updateRegistrationData('companyName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">{t('auth.industry')}</Label>
                        <Select 
                          value={registrationData.industry} 
                          onValueChange={(value) => updateRegistrationData('industry', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('auth.selectIndustry')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">{t('auth.industries.technology')}</SelectItem>
                            <SelectItem value="consulting">{t('auth.industries.consulting')}</SelectItem>
                            <SelectItem value="retail">{t('auth.industries.retail')}</SelectItem>
                            <SelectItem value="manufacturing">{t('auth.industries.manufacturing')}</SelectItem>
                            <SelectItem value="services">{t('auth.industries.services')}</SelectItem>
                            <SelectItem value="finance">{t('auth.industries.finance')}</SelectItem>
                            <SelectItem value="healthcare">{t('auth.industries.healthcare')}</SelectItem>
                            <SelectItem value="construction">{t('auth.industries.construction')}</SelectItem>
                            <SelectItem value="education">{t('auth.industries.education')}</SelectItem>
                            <SelectItem value="other">{t('auth.industries.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companySize">{t('auth.companySize')}</Label>
                        <Select 
                          value={registrationData.companySize} 
                          onValueChange={(value) => updateRegistrationData('companySize', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('auth.selectSize')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">{t('auth.companySizes.1')}</SelectItem>
                            <SelectItem value="2-10">{t('auth.companySizes.2-10')}</SelectItem>
                            <SelectItem value="11-50">{t('auth.companySizes.11-50')}</SelectItem>
                            <SelectItem value="51-200">{t('auth.companySizes.51-200')}</SelectItem>
                            <SelectItem value="200+">{t('auth.companySizes.200+')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxNumber">{t('auth.taxNumber')}</Label>
                        <Input
                          id="taxNumber"
                          placeholder="CHE-123.456.789"
                          value={registrationData.taxNumber}
                          onChange={(e) => updateRegistrationData('taxNumber', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">{t('auth.website')}</Label>
                      <Input
                        id="website"
                        placeholder="https://www.ihrefirma.ch"
                        value={registrationData.website}
                        onChange={(e) => updateRegistrationData('website', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Personal Information */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">{t('auth.personalInfo')}</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('auth.firstName')} *</Label>
                      <Input
                        id="firstName"
                        placeholder="Max"
                        value={registrationData.firstName}
                        onChange={(e) => updateRegistrationData('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('auth.lastName')} *</Label>
                      <Input
                        id="lastName"
                        placeholder="Muster"
                        value={registrationData.lastName}
                        onChange={(e) => updateRegistrationData('lastName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">{t('auth.position')}</Label>
                      <Input
                        id="position"
                        placeholder="Geschäftsführer, Manager, etc."
                        value={registrationData.position}
                        onChange={(e) => updateRegistrationData('position', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('auth.phone')}</Label>
                      <Input
                        id="phone"
                        placeholder="+41 79 123 45 67"
                        value={registrationData.phone}
                        onChange={(e) => updateRegistrationData('phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Account Credentials */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">{t('auth.credentials')}</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('auth.email')} *</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="ihre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('auth.password')} *</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('auth.passwordMinLength')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <Label className="text-base font-semibold">{t('auth.address')}</Label>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('auth.street')}</Label>
                      <Input
                        id="address"
                        placeholder="Musterstrasse 123"
                        value={registrationData.address}
                        onChange={(e) => updateRegistrationData('address', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">{t('auth.postalCode')}</Label>
                        <Input
                          id="postalCode"
                          placeholder="8001"
                          value={registrationData.postalCode}
                          onChange={(e) => updateRegistrationData('postalCode', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">{t('auth.city')}</Label>
                        <Input
                          id="city"
                          placeholder="Zürich"
                          value={registrationData.city}
                          onChange={(e) => updateRegistrationData('city', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">{t('auth.country')}</Label>
                      <Select 
                        value={registrationData.country} 
                        onValueChange={(value) => updateRegistrationData('country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CH">{t('auth.countries.CH')}</SelectItem>
                          <SelectItem value="DE">{t('auth.countries.DE')}</SelectItem>
                          <SelectItem value="AT">{t('auth.countries.AT')}</SelectItem>
                          <SelectItem value="FR">{t('auth.countries.FR')}</SelectItem>
                          <SelectItem value="IT">{t('auth.countries.IT')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <Label className="text-base font-semibold">{t('auth.consent')}</Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="acceptTerms" 
                        checked={registrationData.acceptTerms}
                        onCheckedChange={(checked) => updateRegistrationData('acceptTerms', checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor="acceptTerms"
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t('auth.acceptTerms')} *
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="acceptPrivacy" 
                        checked={registrationData.acceptPrivacy}
                        onCheckedChange={(checked) => updateRegistrationData('acceptPrivacy', checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor="acceptPrivacy"
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t('auth.acceptPrivacy')} *
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="acceptMarketing" 
                        checked={registrationData.acceptMarketing}
                        onCheckedChange={(checked) => updateRegistrationData('acceptMarketing', checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor="acceptMarketing"
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t('auth.acceptMarketing')}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}