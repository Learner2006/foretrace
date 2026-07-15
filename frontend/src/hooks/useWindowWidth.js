import { useState, useEffect } from "react";

export const BP = {
  mobile:  768,
  tablet:  1024,
  desktop: 1024,
};

export function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  // Passive listener for resize events. Keeps scrolling smooth on low-end devices.
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

export function useBreakpoint() {
  const width = useWindowWidth();
  return {
    width,
    isMobile:  width < BP.mobile,
    isTablet:  width >= BP.mobile && width < BP.tablet,
    isDesktop: width >= BP.desktop,
  };
}
