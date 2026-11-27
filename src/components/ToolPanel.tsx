import { useEffect, useState } from "react";
import { useI18n } from "@tau/plugins";
import {
  IPluginStorage,
  useWhiteboardAPI,
  type WhiteboardToolProps,
} from "@tau/plugins/whiteboard";
import { Button } from "@tau/ui";
import { readStyle, type Style } from "../preferences";
import { messages } from "../i18n";
import PosePicker from "./PosePicker";

export function ToolPanel({ run }: WhiteboardToolProps) {
  const { t } = useI18n(messages);
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
          <Button onClick={() => setAttempt((value) => value + 1)}>{t("panel.retry")}</Button>
        </div>
      ) : style ? (
        <PosePicker {...style} onPick={(pose) => run({ pose })} />
      ) : (
        <p role="status">{t("panel.loading")}</p>
      )}
    </div>
  );
}
