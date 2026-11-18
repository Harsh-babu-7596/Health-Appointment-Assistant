import { useEffect, useState, type RefObject } from "react";

/** Returns true once the element has scrolled into view (and stays true). */
export function useInView<T extends Element>(ref: RefObject<T | null>, threshold = 0.12): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, inView]);

  return inView;
}
