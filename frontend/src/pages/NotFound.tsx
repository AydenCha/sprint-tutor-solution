import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

/**
 * 404 Not Found Page
 *
 * Displays when a user navigates to a non-existent route.
 * Provides options to go back or return to the home page.
 *
 * @component
 * @example
 * // Automatically rendered by React Router for unmatched routes
 * <Route path="*" element={<NotFound />} />
 */

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Navigates to the previous page in browser history
   */
  const handleGoBack = (): void => {
    navigate(-1);
  };

  /**
   * Navigates to the home page
   */
  const handleGoHome = (): void => {
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div>
          <h1 className="mb-4 text-6xl font-bold text-foreground" role="heading" aria-level={1}>
            404
          </h1>
          <p className="mb-2 text-xl text-muted-foreground">페이지를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground">
            요청하신 경로: <code className="px-2 py-1 bg-muted rounded">{location.pathname}</code>
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleGoBack} variant="outline" aria-label="이전 페이지로 돌아가기">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            이전 페이지
          </Button>
          <Button onClick={handleGoHome} aria-label="홈페이지로 이동">
            <Home className="h-4 w-4 mr-2" aria-hidden="true" />
            홈으로 가기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
