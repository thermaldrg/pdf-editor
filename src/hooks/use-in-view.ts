import { useEffect, useState } from 'react';

interface UseInViewArgs {
  readonly target: Element | null;
  readonly rootMargin?: string;
}

/**
 * Returns true once the target element has scrolled near or into the viewport.
 * The flag is "sticky": once flipped on, it stays on so that previously
 * rendered content (e.g. a PDF page canvas) is not torn down when scrolled
 * away. Pass a generous `rootMargin` to pre-render content just above and
 * below the viewport for a flicker-free scroll experience.
 */
export function useInView({
  target,
  rootMargin = '800px 0px',
}: UseInViewArgs): boolean {
  const [isInView, setIsInView] = useState<boolean>(false);
  useEffect((): (() => void) | void => {
    if (!target || isInView) return;
    const observer: IntersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin },
    );
    observer.observe(target);
    return (): void => observer.disconnect();
  }, [isInView, rootMargin, target]);
  return isInView;
}
