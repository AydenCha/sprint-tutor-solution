import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';
import { ArrowLeft, UserCog, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

export default function PMRegistrationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasRestored, setHasRestored] = useState(false);

  // 변경사항 추적
  const hasChanges = !!(
    formData.name || 
    formData.email || 
    formData.password || 
    formData.confirmPassword
  );

  // 페이지 이탈 방지
  const { createSafeNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasChanges && !isLoading,
    message: '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?',
  });

  const safeNavigate = createSafeNavigate(navigate);

  // 자동 저장 설정 (비밀번호는 제외)
  const { restore, clear, getLastSavedTime } = useAutoSave(
    {
      name: formData.name,
      email: formData.email,
      // password와 confirmPassword는 보안상 저장하지 않음
    },
    'pm-registration',
    {
      debounceMs: 2000,
      validate: (data) => {
        // 최소한 이름이나 이메일이 입력되어 있을 때만 저장
        return !!(data?.name || data?.email);
      },
    }
  );

  // 페이지 로드 시 복원
  useEffect(() => {
    if (hasRestored) return;

    const saved = restore();
    if (saved) {
      const lastSaved = getLastSavedTime();
      const timeAgo = lastSaved 
        ? Math.floor((Date.now() - lastSaved.getTime()) / 1000 / 60) 
        : null;

      if (timeAgo !== null && timeAgo < 60) {
        const message = timeAgo < 1 
          ? '방금 전에 작성하던 내용이 있습니다. 복원하시겠습니까?'
          : `${timeAgo}분 전에 작성하던 내용이 있습니다. 복원하시겠습니까?`;
        
        if (window.confirm(message)) {
          // 비밀번호는 복원하지 않음 (보안상)
          setFormData(prev => ({
            ...prev,
            name: saved.name || prev.name,
            email: saved.email || prev.email,
            password: '', // 비밀번호는 복원하지 않음
            confirmPassword: '', // 비밀번호 확인도 복원하지 않음
          }));
          toast({
            title: '작성 내용 복원됨',
            description: '이전에 작성하던 내용을 불러왔습니다. (비밀번호는 보안상 복원되지 않습니다)',
          });
        } else {
          // 복원하지 않으면 삭제
          clear();
        }
      }
      setHasRestored(true);
    } else {
      setHasRestored(true);
    }
  }, [hasRestored, restore, clear, getLastSavedTime]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    // Email validation - must match backend pattern
    const allowedEmailDomain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '@codeit.com';
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else {
      const escapedDomain = allowedEmailDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const emailPattern = new RegExp(`^[a-zA-Z0-9._%+-]+${escapedDomain}$`);
      if (!emailPattern.test(formData.email.trim())) {
        newErrors.email = `${allowedEmailDomain} 도메인의 이메일만 사용 가능합니다. (예: pm${allowedEmailDomain})`;
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = '비밀번호는 최소 1개의 특수문자를 포함해야 합니다.';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: '입력 오류',
        description: '모든 필드를 올바르게 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.registerPm({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // 저장 성공 후 임시 저장 삭제
      clear();
      
      // 이메일 인증이 필요한 경우
      if (!response.emailVerified || !response.token) {
        toast({
          title: '회원가입 완료',
          description: '이메일 인증 링크를 발송했습니다. 이메일을 확인해주세요.',
        });
        
        // 이메일 인증 안내 페이지로 이동 (또는 모달 표시)
        navigate('/auth/verify-email-info', { 
          state: { email: response.email } 
        });
      } else {
        // 이메일 인증이 이미 완료된 경우 (일반적으로는 발생하지 않음)
        login(response.token, response.userId, response.role, response.name);
        toast({
          title: '회원가입 성공',
          description: `${response.name}님, 환영합니다!`,
        });
        navigate('/pm/dashboard');
      }
    } catch (error) {
      let errorMessage = '회원가입에 실패했습니다.';
      const backendErrors: Record<string, string> = {};
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Try to parse validation errors from error message
        // Format: "name: Name is required, email: Only @codeit.com..., password: Password must..."
        const errorParts = error.message.split(', ');
        errorParts.forEach(part => {
          // Check if it's a field-specific error (format: "field: message")
          const colonIndex = part.indexOf(':');
          if (colonIndex > 0) {
            const fieldName = part.substring(0, colonIndex).trim().toLowerCase();
            const message = part.substring(colonIndex + 1).trim();
            
            // Map backend field names to frontend field names
            if (fieldName === 'name') {
              backendErrors.name = message;
            } else if (fieldName === 'email') {
              backendErrors.email = message;
            } else if (fieldName === 'password') {
              backendErrors.password = message;
            }
          }
        });
      }
      
      // Update form errors with backend validation errors
      if (Object.keys(backendErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...backendErrors }));
      }
      
      toast({
        title: '회원가입 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 실시간 유효성 검사
    const newErrors: Record<string, string> = { ...errors };
    
    if (field === 'name') {
      if (!value.trim()) {
        newErrors.name = '이름을 입력해주세요.';
      } else {
        delete newErrors.name;
      }
    } else if (field === 'email') {
      const emailValue = value.trim().toLowerCase();
      if (!emailValue) {
        newErrors.email = '이메일을 입력해주세요.';
      } else {
        const allowedEmailDomain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '@codeit.com';
        const escapedDomain = allowedEmailDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const emailPattern = new RegExp(`^[a-zA-Z0-9._%+-]+${escapedDomain}$`);
        if (!emailPattern.test(emailValue)) {
          newErrors.email = `${allowedEmailDomain} 도메인의 이메일만 사용 가능합니다.`;
        } else {
          delete newErrors.email;
        }
      }
    } else if (field === 'password') {
      if (!value) {
        newErrors.password = '비밀번호를 입력해주세요.';
      } else if (value.length < 8) {
        newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        newErrors.password = '비밀번호는 최소 1개의 특수문자를 포함해야 합니다.';
      } else {
        delete newErrors.password;
      }
      
      // 비밀번호가 변경되면 확인 비밀번호도 다시 검증
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      } else if (formData.confirmPassword && value === formData.confirmPassword) {
        delete newErrors.confirmPassword;
      }
    } else if (field === 'confirmPassword') {
      if (!value) {
        newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
      } else if (formData.password !== value) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      } else {
        delete newErrors.confirmPassword;
      }
    }
    
    setErrors(newErrors);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">로그인 페이지로 돌아가기</span>
        </Link>

        <Card className="shadow-figma-02 border-2">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <UserCog className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>PM 회원가입</CardTitle>
            <CardDescription>코드잇 PM 계정을 생성하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={cn(errors.name && 'border-destructive')}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={`pm${import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '@codeit.com'}`}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={cn(errors.email && 'border-destructive')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {`${import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '@codeit.com'} 도메인의 이메일만 사용 가능합니다.`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={cn(errors.password && 'border-destructive', 'pr-10')}
                  />
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  최소 8자 이상, 특수문자 1개 이상 포함
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={cn(errors.confirmPassword && 'border-destructive', 'pr-10')}
                  />
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={isLoading}
              >
                {isLoading ? '가입 중...' : '회원가입'} 
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                이미 계정이 있으신가요?{' '}
                <Link to="/" className="text-primary hover:underline font-medium">
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 Codeit Sprint. All rights reserved.
        </p>
      </div>
    </div>
  );
}

