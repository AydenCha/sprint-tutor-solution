import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  /** 자동 저장 지연 시간 (밀리초) */
  debounceMs?: number;
  /** 저장 전 데이터 검증 함수 */
  validate?: (data: T) => boolean;
  /** 저장 성공 콜백 */
  onSave?: () => void;
  /** 저장 실패 콜백 */
  onError?: (error: Error) => void;
}

/**
 * 자동 저장 훅
 * 
 * @param data 저장할 데이터
 * @param key localStorage 키 (고유해야 함)
 * @param options 옵션
 * @returns { restore, clear, isSaving } - 복원 함수, 삭제 함수, 저장 중 상태
 * 
 * @example
 * ```tsx
 * const { restore, clear } = useAutoSave(formData, 'instructor-registration');
 * 
 * // 페이지 로드 시 복원
 * useEffect(() => {
 *   const saved = restore();
 *   if (saved) {
 *     setFormData(saved);
 *   }
 * }, []);
 * 
 * // 저장 성공 후 임시 저장 삭제
 * const handleSubmit = async () => {
 *   await submitForm();
 *   clear();
 * };
 * ```
 */
export function useAutoSave<T>(
  data: T,
  key: string,
  options: UseAutoSaveOptions<T> = {}
) {
  const {
    debounceMs = 2000,
    validate,
    onSave,
    onError,
  } = options;

  const timerRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef<T | null>(null);

  // 데이터가 변경될 때마다 자동 저장
  useEffect(() => {
    // 데이터가 없거나 이전과 동일하면 저장하지 않음
    if (!data || JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
      return;
    }

    // 검증 함수가 있고 검증 실패하면 저장하지 않음
    if (validate && !validate(data)) {
      return;
    }

    // 이전 타이머 취소
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    isSavingRef.current = true;

    // debounce 후 저장
    timerRef.current = setTimeout(() => {
      try {
        const storageKey = `autosave_${key}`;
        const dataToSave = {
          data,
          timestamp: new Date().toISOString(),
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        lastSavedRef.current = data;
        isSavingRef.current = false;

        if (onSave) {
          onSave();
        }
      } catch (error) {
        isSavingRef.current = false;
        const err = error instanceof Error ? error : new Error('Failed to auto-save');
        console.error('Auto-save failed:', err);
        
        if (onError) {
          onError(err);
        }
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, key, debounceMs, validate, onSave, onError]);

  // 복원 함수
  const restore = useCallback((): T | null => {
    try {
      const storageKey = `autosave_${key}`;
      const saved = localStorage.getItem(storageKey);
      
      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);
      
      // 타임스탬프 확인 (30일 이상 된 데이터는 무시)
      if (parsed.timestamp) {
        const savedDate = new Date(parsed.timestamp);
        const daysDiff = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 30) {
          localStorage.removeItem(storageKey);
          return null;
        }
      }

      return parsed.data || null;
    } catch (error) {
      console.error('Failed to restore auto-saved data:', error);
      return null;
    }
  }, [key]);

  // 임시 저장 삭제 함수
  const clear = useCallback(() => {
    try {
      const storageKey = `autosave_${key}`;
      localStorage.removeItem(storageKey);
      lastSavedRef.current = null;
    } catch (error) {
      console.error('Failed to clear auto-saved data:', error);
    }
  }, [key]);

  // 저장 중인지 확인하는 함수
  const isSaving = useCallback(() => {
    return isSavingRef.current;
  }, []);

  // 마지막 저장 시간 가져오기
  const getLastSavedTime = useCallback((): Date | null => {
    try {
      const storageKey = `autosave_${key}`;
      const saved = localStorage.getItem(storageKey);
      
      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);
      return parsed.timestamp ? new Date(parsed.timestamp) : null;
    } catch {
      return null;
    }
  }, [key]);

  return {
    restore,
    clear,
    isSaving,
    getLastSavedTime,
  };
}

