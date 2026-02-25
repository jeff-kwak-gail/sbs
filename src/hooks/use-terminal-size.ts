import { useState, useEffect } from "react";
import { useStdout } from "ink";

export function useTerminalSize(): [number, number] {
  const { stdout } = useStdout();
  const [size, setSize] = useState<[number, number]>([
    stdout?.columns ?? 80,
    stdout?.rows ?? 24,
  ]);

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => setSize([stdout.columns, stdout.rows]);
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);

  return size;
}
