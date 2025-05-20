
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: t('validation.validationError'),
        description: t('validation.enterEmailAndPassword'),
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login({ email, password });
      // Redirect handled by auth context based on user role
    } catch (error) {
      toast({
        title: t('validation.loginFailed'),
        description: t('validation.invalidCredentials'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 p-4">
      <div className="w-full flex flex-col md:flex-row max-w-5xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Left side - Brand info */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 dark:from-blue-800 dark:to-blue-950 p-8 md:p-12 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <h1 className="text-3xl md:text-4xl font-bold">{t('brandInfo.appName')}</h1>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('brandInfo.appDescription')}</h2>
            <p className="text-blue-100 mb-8">
              {t('brandInfo.marketplaceVisibility')}
            </p>
          </div>
          
          <div className="space-y-4 mt-8">
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <h3 className="font-bold text-xl mb-2">{t('brandInfo.adminDashboardTitle')}</h3>
              <p className="text-sm text-blue-100">{t('brandInfo.adminDashboardDesc')}</p>
            </div>
            
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <h3 className="font-bold text-xl mb-2">{t('brandInfo.advertiserPortalTitle')}</h3>
              <p className="text-sm text-blue-100">{t('brandInfo.advertiserPortalDesc')}</p>
            </div>
            
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <h3 className="font-bold text-xl mb-2">{t('brandInfo.agencyManagerTitle')}</h3>
              <p className="text-sm text-blue-100">{t('brandInfo.agencyManagerDesc')}</p>
            </div>
          </div>
        </div>
        
        {/* Right side - Login form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
              <CardDescription>
                {t('login.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none dark:text-white">
                    {t('login.email')}
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('login.emailPlaceholder')}
                      className="bg-gray-50 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium leading-none dark:text-white">
                    {t('login.password')}
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.passwordPlaceholder')}
                      className="bg-gray-50 dark:bg-gray-700 dark:text-white pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={toggleShowPassword}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('login.signingIn')}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <LogIn className="mr-2 h-4 w-4" />
                      {t('login.signIn')}
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-gray-500 dark:text-gray-400">
                {t('login.needAccount')}
              </div>
              <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                {t('login.termsAndPrivacy')}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
