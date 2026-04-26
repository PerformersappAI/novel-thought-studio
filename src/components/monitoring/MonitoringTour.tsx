import { useEffect, useState, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";

export interface TourStep {
  ref: RefObject<HTMLElement>;
  title: string;
  body: string;
}

interface Props {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}

const PADDING = 12;

const MonitoringTour = ({ steps, open, onClose }: Props) => {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    if (!open) setIdx(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = steps[idx]?.ref.current;
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const update = () => setRect(el.getBoundingClientRect());
    update();
    const t = setTimeout(update, 350);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [idx, open, steps]);

  useEffect(() => {
    const id = setInterval(() => force((v) => v + 1), 600);
    return () => clearInterval(id);
  }, []);

  if (!open) return null;

  const isLast = idx === steps.length - 1;
  const step = steps[idx];

  const cutout = rect
    ? {
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null;

  // tooltip placement: below cutout if room, else above
  const tooltipTop = cutout
    ? cutout.top + cutout.height + 16 < window.innerHeight - 220
      ? cutout.top + cutout.height + 16
      : Math.max(16, cutout.top - 220)
    : 80;
  const tooltipLeft = cutout
    ? Math.min(Math.max(16, cutout.left), window.innerWidth - 360 - 16)
    : 16;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dimmed overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={() => setIdx((i) => Math.min(i + 1, steps.length - 1))}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {cutout && (
              <rect
                x={cutout.left}
                y={cutout.top}
                width={cutout.width}
                height={cutout.height}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="hsl(218 50% 4% / 0.78)" mask="url(#tour-mask)" />
        {cutout && (
          <rect
            x={cutout.left}
            y={cutout.top}
            width={cutout.width}
            height={cutout.height}
            rx="12"
            ry="12"
            fill="none"
            stroke="hsl(351 83% 42%)"
            strokeWidth="2"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Tooltip */}
      <div
        className="absolute w-[360px] max-w-[calc(100vw-32px)] bg-card border border-primary/40 rounded-xl shadow-2xl p-5"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="text-xs uppercase tracking-wider text-primary font-semibold">
            Step {idx + 1} of {steps.length}
          </div>
          <button onClick={onClose} aria-label="Close tour" className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <h4 className="font-display text-lg font-bold text-foreground mb-1">{step.title}</h4>
        <p className="text-sm text-muted-foreground mb-4">{step.body}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {idx > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIdx((i) => i - 1)}>
                Back
              </Button>
            )}
            {!isLast ? (
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIdx((i) => i + 1)}>
                Next <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onClose}>
                Got It <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
        {isLast && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            You're all set. We'll alert you the moment we find something new.
          </p>
        )}
      </div>
    </div>
  );
};

export default MonitoringTour;
