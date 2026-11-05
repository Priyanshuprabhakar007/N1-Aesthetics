import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ScrollTrigger, prefersReducedMotion } from './gsap';

interface RouterContextValue {
  pathname: string;
  hash: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue>({
  pathname: '/',
  hash: '',
  navigate: () => {},
});

const STICKY_HEADER_OFFSET = 88;

function scrollToTargetWithOffset(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const targetTop = Math.max(0, window.scrollY + rect.top - STICKY_HEADER_OFFSET);
  window.scrollTo({
    top: targetTop,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
  return true;
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  );
  const [hash, setHash] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.hash || '' : ''
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
      setHash(window.location.hash || '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    if (hash) {
      const id = hash.replace(/^#/, '');
      timer = window.setTimeout(() => {
        scrollToTargetWithOffset(id);
        ScrollTrigger.refresh();
      }, 80);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      timer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 60);
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [pathname, hash]);

  const navigate = useCallback((to: string) => {
    if (typeof window === 'undefined') return;
    const [rawPath, rawHash] = to.split('#');
    const nextPath = rawPath || window.location.pathname || '/';
    const nextHash = rawHash ? `#${rawHash}` : '';
    const isSamePath = nextPath === window.location.pathname;

    window.history.pushState({}, '', `${nextPath}${nextHash}`);
    setPathname(nextPath);
    setHash(nextHash);

    if (nextHash && isSamePath) {
      const id = nextHash.replace(/^#/, '');
      scrollToTargetWithOffset(id);
    } else if (!nextHash && isSamePath) {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, hash, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export function Link({ href, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey ||
      href.startsWith('http') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return;
    }
    e.preventDefault();
    navigate(href);
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
