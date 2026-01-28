import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Authentication Context for Sprint Tutor Flow
 *
 * Manages global authentication state including JWT token, user ID, role, and username.
 * Persists authentication state to localStorage for session persistence across page refreshes.
 *
 * @module AuthContext
 * @see {@link useAuth} Hook for accessing auth context
 *
 * @example
 * // Wrap your app with AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * @example
 * // Use in components
 * const { isAuthenticated, role, login, logout } = useAuth();
 */

// Constants
/**
 * LocalStorage keys for persisting auth state
 */
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_ID: 'userId',
  ROLE: 'role',
  USER_NAME: 'userName',
} as const;

/**
 * User roles in the system
 */
export type UserRole = 'PM' | 'INSTRUCTOR';

/**
 * Authentication context type definition
 */
interface AuthContextType {
  /** JWT authentication token */
  token: string | null;
  /** User ID as string */
  userId: string | null;
  /** User role (PM or INSTRUCTOR) */
  role: UserRole | null;
  /** User's display name */
  userName: string | null;
  /** Computed authentication status */
  isAuthenticated: boolean;
  /** Login function to set auth state */
  login: (token: string, userId: number, role: UserRole, name: string) => void;
  /** Logout function to clear auth state */
  logout: () => void;
}

/**
 * AuthProvider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication context
 * @private
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 *
 * Provides authentication state and methods to all child components.
 * Automatically loads auth state from localStorage on mount.
 *
 * @component
 * @param {AuthProviderProps} props - Provider props
 * @returns {JSX.Element} Provider component
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  /**
   * Loads authentication state from localStorage on component mount
   * Restores previous session if valid auth data exists
   */
  useEffect(() => {
    loadAuthFromStorage();
  }, []);

  /**
   * Loads auth state from localStorage
   * @private
   */
  const loadAuthFromStorage = (): void => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
    const storedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);

    // Only restore if we have all required auth data
    if (storedToken && storedUserId && storedRole) {
      setToken(storedToken);
      setUserId(storedUserId);
      setRole(storedRole);
      setUserName(storedName);
    }
  };

  /**
   * Logs in a user and persists auth state
   *
   * @param {string} token - JWT authentication token
   * @param {number} userId - User ID from backend
   * @param {UserRole} role - User role (PM or INSTRUCTOR)
   * @param {string} name - User's display name
   *
   * @example
   * login('eyJhbGc...', 123, 'PM', 'John Doe');
   */
  const login = (token: string, userId: number, role: UserRole, name: string): void => {
    const userIdStr = userId.toString();

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_ID, userIdStr);
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name);

    // Update React state
    setToken(token);
    setUserId(userIdStr);
    setRole(role);
    setUserName(name);
  };

  /**
   * Logs out the current user
   * Clears all auth state from both localStorage and React state
   *
   * @example
   * logout(); // Clears all auth data and user is logged out
   */
  const logout = (): void => {
    // Clear from localStorage
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);

    // Clear React state
    setToken(null);
    setUserId(null);
    setRole(null);
    setUserName(null);
  };

  const value: AuthContextType = {
    token,
    userId,
    role,
    userName,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access authentication context
 *
 * @throws {Error} If used outside of AuthProvider
 * @returns {AuthContextType} Authentication context value
 *
 * @example
 * function MyComponent() {
 *   const { isAuthenticated, role, userName, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *
 *   return <div>Welcome, {userName}! <button onClick={logout}>Logout</button></div>;
 * }
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}


