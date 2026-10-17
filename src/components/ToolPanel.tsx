import { useEffect, useState } from "react";
import {
  IPluginStorage,
  useWhiteboardAPI,
  type WhiteboardToolProps,
} from "@tau/plugins/whiteboard";
import { Button } from "@tau/ui";
import { readStyle, type Style } from "../preferences";
import PosePicker from "./PosePicker";

export function ToolPanel({ run }: WhiteboardToolProps) {
  const api = useWhiteboardAPI();
  const [style, setStyle] = useState<Style | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError("");
    void readStyle(api.getService(IPluginStorage)).then(
      (value) => {
        if (!cancelled) setStyle(value);
      },
      (reason) => {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : String(reason));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, attempt]);
  return (
    <div className="tau-stickman-panel">
      {error ? (
        <div role="alert">
          {error}
          <Button onClick={() => setAttempt((value) => value + 1)}>重试</Button>
        </div>
      ) : style ? (
        <PosePicker {...style} onPick={(pose) => run({ pose })} />
      ) : (
        <p role="status">正在读取人物样式…</p>
      )}
    </div>
  );
}
