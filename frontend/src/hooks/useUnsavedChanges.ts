import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface UseUnsavedChangesOptions {
  /** 변경사항이 있는지 여부 */
  hasUnsavedChanges: boolean;
  /** 확인 메시지 (기본값 제공) */
  message?: string;
  /** 페이지 이탈 시 콜백 */
  onBeforeUnload?: () => void;
}

/**
 * 페이지 이탈 방지 훅
 * 
 * 저장되지 않은 변경사항이 있을 때 페이지 이탈을 방지합니다.
 * 
 * @param options 옵션
 * @returns { isBlocked } - 현재 차단 상태
 * 
 * @example
 * ```tsx
 * const [formData, setFormData] = useState({ ... });
 * const [isDirty, setIsDirty] = useState(false);
 * 
 * useUnsavedChanges({
 *   hasUnsavedChanges: isDirty,
 *   message: '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?',
 * });
 * 
 * const handleChange = (value: string) => {
 *   setFormData(value);
 *   setIsDirty(true);
 * };
 * 
 * const handleSave = async () => {
 *   await saveForm();
 *   setIsDirty(false); // 저장 후 변경사항 없음으로 표시
 * };
 * ```
 */
export function useUnsavedChanges(options: UseUnsavedChangesOptions) {
  const { hasUnsavedChanges, message, onBeforeUnload } = options;
  const location = useLocation();
  const messageRef = useRef<string>(
    message || '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?'
  );
  const isNavigatingRef = useRef(false);

  // 브라우저 이벤트 (새로고침, 탭 닫기 등) 차단
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isNavigatingRef.current) {
        return; // 프로그래밍 방식 네비게이션은 허용
      }

      e.preventDefault();
      e.returnValue = messageRef.current;
      
      if (onBeforeUnload) {
        onBeforeUnload();
      }
      
      return messageRef.current;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, onBeforeUnload]);

  // React Router의 popstate 이벤트 감지 (뒤로가기/앞으로가기)
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    // 현재 위치를 히스토리에 추가하여 popstate 이벤트 감지 가능하게 함
    window.history.pushState(null, '', location.pathname);

    const handlePopState = (e: PopStateEvent) => {
      const shouldProceed = window.confirm(messageRef.current);
      
      if (!shouldProceed) {
        // 뒤로가기 방지 - 다시 현재 위치로 이동
        window.history.pushState(null, '', location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, location.pathname]);

  // navigate 함수를 래핑하는 헬퍼 함수 제공
  const createSafeNavigate = (navigate: (path: string) => void) => {
    return (path: string) => {
      if (!hasUnsavedChanges) {
        isNavigatingRef.current = true;
        navigate(path);
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 100);
        return;
      }

      const shouldProceed = window.confirm(messageRef.current);
      
      if (shouldProceed) {
        isNavigatingRef.current = true;
        navigate(path);
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 100);
      }
    };
  };

  return {
    isBlocked: hasUnsavedChanges,
    createSafeNavigate,
  };
}

