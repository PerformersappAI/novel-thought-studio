import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, MicOff, Play, Pause, RotateCcw, Upload, ArrowRight, Lock, Loader2, Check, FileAudio, AudioWaveform } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingBackButton from "@/components/onboarding/OnboardingBackButton";
import TrustBanner from "@/components/onboarding/TrustBanner";

const SCRIPTED_PASSAGE = `My name is [say your full name]. I am registering my voice with ClaimMyFace today, on [say today's date]. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above. There is, according to legend, a boiling pot of gold at one end.`;

const MIN_SECONDS = 20;
const MAX_SECONDS = 60;
const MAX_DEMO_MB = 25;

async function sha256OfBlob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const OnboardingVoice = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const demoInputRef = useRef<HTMLInputElement>(null);

  // Live waveform
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const drawWave = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bufferLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLen);

    const render = () => {
      analyser.getByteTimeDomainData(data);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "hsl(196 100% 60%)";
      ctx.beginPath();
      const slice = w / bufferLen;
      let x = 0;
      for (let i = 0; i < bufferLen; i++) {
        const v = data[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += slice;
      }
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      // Setup analyser for waveform
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWave();

      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
        MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" :
        MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        setRecordedBlob(blob);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(URL.createObjectURL(blob));
        stopStream();
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= MAX_SECONDS) stopRecording();
          return next;
        });
      }, 1000);
    } catch (err: any) {
      toast({
        title: "Microphone access denied",
        description: err?.message || "Allow microphone access to record your voice print.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const resetRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setSeconds(0);
    setPlaying(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleDemoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("audio/")) {
      toast({ title: "Invalid file", description: "Please upload an audio file (MP3, WAV, M4A, etc).", variant: "destructive" });
      return;
    }
    if (f.size > MAX_DEMO_MB * 1024 * 1024) {
      toast({ title: "File too large", description: `Max ${MAX_DEMO_MB}MB.`, variant: "destructive" });
      return;
    }
    setDemoFile(f);
  };

  const submit = async () => {
    if (!user) return;
    if (!recordedBlob && !demoFile) {
      toast({ title: "Nothing to submit", description: "Record a sample or upload a demo first." });
      return;
    }
    if (recordedBlob && seconds < MIN_SECONDS) {
      toast({
        title: "Recording too short",
        description: `Please record at least ${MIN_SECONDS} seconds for an accurate fingerprint.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const updates: Record<string, any> = {
        voice_registered_at: new Date().toISOString(),
      };

      if (recordedBlob) {
        const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
        const path = `${user.id}/voice-print-${Date.now()}.${ext}`;
        const hash = await sha256OfBlob(recordedBlob);
        const { error: upErr } = await supabase.storage
          .from("voice-prints")
          .upload(path, recordedBlob, { contentType: recordedBlob.type, upsert: false });
        if (upErr) throw upErr;
        updates.voice_print_url = path;
        updates.voice_print_hash = hash;
        updates.voice_print_duration_seconds = seconds;
      }

      if (demoFile) {
        const ext = demoFile.name.split(".").pop() || "mp3";
        const safeName = demoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/demo-${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("voice-prints")
          .upload(path, demoFile, { contentType: demoFile.type, upsert: false });
        if (upErr) throw upErr;
        updates.voice_print_demo_url = path;
      }

      const { error: profErr } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);
      if (profErr) throw profErr;

      toast({
        title: "Voice print registered",
        description: "Your voice is now part of your protected identity.",
      });
      navigate("/onboarding/certified");
    } catch (err: any) {
      toast({
        title: "Could not save voice print",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const skip = async () => {
    if (!user) return;
    setSkipping(true);
    navigate("/onboarding/certified");
    setSkipping(false);
  };

  const minSecondsMet = seconds >= MIN_SECONDS;
  const canSubmit = (!!recordedBlob && minSecondsMet) || !!demoFile;

  return (
    <div className="min-h-screen bg-[hsl(var(--cmf-deep-bg))] text-foreground py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <OnboardingBackButton to="/onboarding/face-capture" label="Back to Face Capture" />
        <OnboardingProgress step={3} />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--cmf-cyan))]/30 bg-[hsl(var(--cmf-cyan))]/5 text-[hsl(var(--cmf-cyan))] text-xs font-semibold tracking-wider">
            <AudioWaveform className="w-3.5 h-3.5" />
            STEP 3 OF 5 — VOICE PRINT
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-3">
            Map Your Voice
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            This adds the voice layer to your identity map. The scanner uses it to detect AI voice clones, fake voiceovers, and unauthorized audio — anywhere on the web. <span className="text-foreground/80">Optional but strongly recommended.</span>
          </p>
        </motion.div>

        {/* Scripted passage card */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display text-xl font-semibold">Read this aloud</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {MIN_SECONDS}–{MAX_SECONDS} seconds · clear room, normal speaking voice
              </p>
            </div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Private — only you and admins can hear it
            </div>
          </div>

          <div className="rounded-xl bg-background/60 border border-border/40 p-4 text-sm leading-relaxed text-foreground/90 italic">
            "{SCRIPTED_PASSAGE}"
          </div>

          {/* Recorder */}
          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {!recording && !recordedBlob && (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-[hsl(var(--crimson))] hover:bg-[hsl(var(--crimson))]/90 text-white"
                  >
                    <Mic className="w-5 h-5 mr-2" /> Start Recording
                  </Button>
                )}
                {recording && (
                  <Button onClick={stopRecording} size="lg" variant="outline" className="border-[hsl(var(--crimson))] text-[hsl(var(--crimson-bright))]">
                    <MicOff className="w-5 h-5 mr-2" /> Stop
                  </Button>
                )}
                {recordedBlob && !recording && (
                  <>
                    <Button onClick={togglePlay} size="lg" variant="outline">
                      {playing ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                      {playing ? "Pause" : "Play back"}
                    </Button>
                    <Button onClick={resetRecording} size="lg" variant="ghost">
                      <RotateCcw className="w-4 h-4 mr-1.5" /> Re-record
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono text-sm">
                {recording && (
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--crimson))] animate-pulse" />
                )}
                <span className={minSecondsMet ? "text-emerald-400" : "text-muted-foreground"}>
                  {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
                </span>
                <span className="text-muted-foreground/60 text-xs">/ min {MIN_SECONDS}s</span>
              </div>
            </div>

            {/* Waveform / placeholder */}
            <div className="mt-4 h-20 rounded-lg bg-background/80 border border-border/40 overflow-hidden flex items-center justify-center">
              {recording ? (
                <canvas ref={canvasRef} width={800} height={80} className="w-full h-full" />
              ) : recordedBlob ? (
                <audio
                  ref={audioRef}
                  src={recordedUrl ?? undefined}
                  onEnded={() => setPlaying(false)}
                  className="w-full px-3"
                  controls
                />
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <AudioWaveform className="w-4 h-4" /> Press record to capture your voice
                </div>
              )}
            </div>

            {recordedBlob && !minSecondsMet && (
              <p className="text-xs text-[hsl(var(--gold))] mt-3">
                ⚠ Sample is shorter than {MIN_SECONDS}s. Re-record for a stronger fingerprint.
              </p>
            )}
          </div>
        </div>

        {/* Optional demo upload */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-6 space-y-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Optional — Upload a Demo Reel</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Voiceover demo, commercial, monologue. MP3/WAV/M4A · max {MAX_DEMO_MB}MB. Strengthens future matching.
            </p>
          </div>
          <input
            ref={demoInputRef}
            type="file"
            accept="audio/*"
            onChange={handleDemoSelect}
            className="hidden"
          />
          {!demoFile ? (
            <Button
              onClick={() => demoInputRef.current?.click()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" /> Browse audio file
            </Button>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-background/50 border border-border/40 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileAudio className="w-5 h-5 text-[hsl(var(--cmf-cyan))] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{demoFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(demoFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setDemoFile(null)}>
                Remove
              </Button>
            </div>
          )}
        </div>

        <TrustBanner />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={submit}
            disabled={!canSubmit || submitting}
            size="lg"
            className="bg-[hsl(var(--crimson))] hover:bg-[hsl(var(--crimson))]/90 text-white flex-1"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving voice print…</>
            ) : (
              <><Check className="w-5 h-5 mr-2" /> Register My Voice <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
          <Button
            onClick={skip}
            disabled={submitting || skipping}
            size="lg"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Your voice file is encrypted at rest. Only you and ClaimMyFace admins can access it. You can delete it anytime from your dashboard.
        </p>
      </div>
    </div>
  );
};

export default OnboardingVoice;
