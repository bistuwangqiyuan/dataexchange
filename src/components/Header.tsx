/**
 * Header Component
 * 网站头部导航
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 检查登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || null);
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <nav className="container py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86-.93-7-5.13-7-9V8.3l7-3.5 7 3.5V11c0 3.87-3.14 8.07-7 9z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              CryptoEx
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              首页
            </a>
            <a href="/markets" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              行情
            </a>
            <a href="/trade" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              交易
            </a>
            {isLoggedIn && (
              <>
                <a href="/wallet" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  钱包
                </a>
                <a href="/orders" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  订单
                </a>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                >
                  登出
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="btn btn-secondary btn-sm">
                  登录
                </a>
                <a href="/register" className="btn btn-primary btn-sm">
                  注册
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex flex-col space-y-3">
              <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1">
                首页
              </a>
              <a href="/markets" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1">
                行情
              </a>
              <a href="/trade" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1">
                交易
              </a>
              {isLoggedIn && (
                <>
                  <a href="/wallet" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1">
                    钱包
                  </a>
                  <a href="/orders" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1">
                    订单
                  </a>
                </>
              )}
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                {isLoggedIn ? (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 px-2 mb-2">
                      {userEmail}
                    </p>
                    <button
                      onClick={handleLogout}
                      className="w-full btn btn-secondary btn-sm"
                    >
                      登出
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <a href="/login" className="btn btn-secondary btn-sm text-center">
                      登录
                    </a>
                    <a href="/register" className="btn btn-primary btn-sm text-center">
                      注册
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

