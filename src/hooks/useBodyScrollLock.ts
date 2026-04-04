import { useEffect, useRef } from "react";

export function useBodyScrollLock(lock: boolean): void {
  const bodyRef = useRef(document.body.style.overflow);

  useEffect(() => {
    if (lock) {
      bodyRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = bodyRef.current || "";
    }

    return () => {
      document.body.style.overflow = bodyRef.current || "";
    };
  }, [lock]);
}
