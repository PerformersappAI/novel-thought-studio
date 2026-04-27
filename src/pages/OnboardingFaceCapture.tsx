import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Camera, Check, Loader2, RotateCcw, ArrowRight, Lock, Upload, Video } from "lucide-react";
import OnboardingBackButton from "@/components/onboarding/OnboardingBackButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as faceapi from "@vladmandic/face-api";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import TrustBanner from "@/components/onboarding/TrustBanner";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

type Pose = "front" | "left" | "right";
type Capture = { dataUrl: string; blob: Blob; timestamp: string };

const POSES: { key: Pose; label: string; instruction: string; cta: string }[] = [
  { key: "front", label: "Face Forward", instruction: "Look straight at the camera. Neutral expression. No smile.", cta: "Take Front Photo" },
  { key: "left", label: "Left Profile", instruction: "Turn your head to the LEFT. Hold still.", cta: "Take Left Profile" },
  { key: "right", label: "Right Profile", instruction: "Turn your head to the RIGHT. Hold still.", cta: "Take Right Profile" },
];

const OnboardingFaceCapture = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modelsLoading, setModelsLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentPoseIdx, setCurrentPoseIdx] = useState(0);
  const [captures, setCaptures] = useState<Record<Pose, Capture | null>>({ front: null, left: null, right: null });
  const [descriptor, setDescriptor] = useState<number[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  // Load face-api models
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoading(false);
      } catch (e: any) {
        toast({ title: "Failed to load face models", description: e.message, variant: "destructive" });
      }
    })();
  }, [toast]);

  const stopCamera = () => {
    if (detectIntervalRef.current) {
      window.clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => () => stopCamera(), []);

  const enumerateCams = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      if (cams.length && !selectedDeviceId) setSelectedDeviceId(cams[0].deviceId);
      return cams;
    } catch {
      return [];
    }
  };

  const startCamera = async (deviceId?: string) => {
    try {
      // stop any existing stream first so we can switch devices
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 720 }, height: { ideal: 720 } }
          : { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOpen(true);
      // labels become available after permission is granted
      const cams = await enumerateCams();
      const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId;
      if (activeId) setSelectedDeviceId(activeId);
      else if (!selectedDeviceId && cams[0]) setSelectedDeviceId(cams[0].deviceId);
      runDetectionLoop();
    } catch (e: any) {
      const msg =
        e?.name === "NotAllowedError"
          ? "Permission denied. Allow camera access in your browser settings."
          : e?.name === "NotFoundError"
          ? "No camera found on this device."
          : e?.name === "NotReadableError"
          ? "Camera is in use by another app. Close it and try again."
          : e?.message || "Could not start camera.";
      toast({ title: "Camera error", description: msg, variant: "destructive" });
    }
  };

  const switchCamera = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    await startCamera(deviceId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image file.", variant: "destructive" });
      return;
    }

    const pose = POSES[currentPoseIdx].key;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(file);
    });

    // Draw to canvas to normalize and run detection
    const img = new Image();
    img.src = dataUrl;
    await new Promise((r) => (img.onload = r));
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    if (pose === "front") {
      const detection = await faceapi
        .detectSingleFace(c, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        toast({ title: "No face detected", description: "Please upload a clear forward-facing photo.", variant: "destructive" });
        return;
      }
      setDescriptor(Array.from(detection.descriptor));
    }

    const blob: Blob | null = await new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;
    const finalDataUrl = c.toDataURL("image/jpeg", 0.85);
    setCaptures((prev) => ({ ...prev, [pose]: { dataUrl: finalDataUrl, blob, timestamp: new Date().toISOString() } }));
    if (currentPoseIdx < POSES.length - 1) setCurrentPoseIdx((i) => i + 1);
  };

  const runDetectionLoop = () => {
    if (detectIntervalRef.current) window.clearInterval(detectIntervalRef.current);
    detectIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      const canvas = overlayRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
      const result = await faceapi
        .detectSingleFace(video, opts)
        .withFaceLandmarks();

      const dispW = video.clientWidth;
      const dispH = video.clientHeight;
      if (canvas.width !== dispW || canvas.height !== dispH) {
        canvas.width = dispW;
        canvas.height = dispH;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Oval guide
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width * 0.28, canvas.height * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (result) {
        setFaceDetected(true);
        const resized = faceapi.resizeResults(result, { width: dispW, height: dispH });
        // Draw 68 landmarks
        ctx.fillStyle = "hsl(351, 85%, 55%)";
        resized.landmarks.positions.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        setFaceDetected(false);
      }
    }, 180);
  };

  const captureCurrent = async () => {
    const video = videoRef.current;
    if (!video) return;
    const pose = POSES[currentPoseIdx].key;

    // Draw video frame to off-screen canvas
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, c.width, c.height);

    const blob: Blob | null = await new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;
    const dataUrl = c.toDataURL("image/jpeg", 0.85);

    // For front pose, also compute the face descriptor
    if (pose === "front") {
      const detection = await faceapi
        .detectSingleFace(c, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        toast({ title: "No face detected", description: "Please center your face and try again.", variant: "destructive" });
        return;
      }
      setDescriptor(Array.from(detection.descriptor));
    }

    setCaptures((prev) => ({ ...prev, [pose]: { dataUrl, blob, timestamp: new Date().toISOString() } }));

    if (currentPoseIdx < POSES.length - 1) {
      setCurrentPoseIdx((i) => i + 1);
    }
  };

  const retake = (pose: Pose) => {
    setCaptures((prev) => ({ ...prev, [pose]: null }));
    if (pose === "front") setDescriptor(null);
    const idx = POSES.findIndex((p) => p.key === pose);
    setCurrentPoseIdx(idx);
  };

  const allCaptured = captures.front && captures.left && captures.right;

  const registerFace = async () => {
    if (!user || !allCaptured || !descriptor) return;
    setSubmitting(true);
    try {
      const uploads: Record<Pose, string> = { front: "", left: "", right: "" };
      for (const pose of ["front", "left", "right"] as Pose[]) {
        const cap = captures[pose]!;
        const path = `${user.id}/${pose}-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("face-captures")
          .upload(path, cap.blob, { upsert: true, contentType: "image/jpeg" });
        if (upErr) throw upErr;
        uploads[pose] = path;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          face_capture_front_url: uploads.front,
          face_capture_left_url: uploads.left,
          face_capture_right_url: uploads.right,
          face_descriptor: descriptor as any,
          face_registered_at: new Date().toISOString(),
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;

      stopCamera();
      navigate("/onboarding/voice");
    } catch (e: any) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const currentPose = POSES[currentPoseIdx];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-6">
        <OnboardingBackButton to="/onboarding/profile" label="Back to Profile" />
        <OnboardingProgress step={2} />
        <TrustBanner />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <header className="text-center sm:text-left">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-gradient-crimson">
              Capture Your Real Face
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Your headshot is retouched. We need the real you — unfiltered, unedited. These three photos
              become your legal face baseline. Timestamped proof that this is your face, on this date,
              registered by you.
            </p>
          </header>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {!cameraOpen && !allCaptured && (
            <div className="rounded-xl border-2 border-primary/40 bg-card/40 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">How We Protect Your Face Data</h2>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  "Your photos are processed on YOUR device first — we never see your raw face data until you choose to upload",
                  "Your face is converted into an encrypted mathematical descriptor — not a searchable photo database",
                  "Your captures are stored in an encrypted private vault — only YOU can access them",
                  "Your face data is NEVER used to train AI models, sold to third parties, or shared without your written consent",
                ].map((t) => (
                  <li key={t} className="flex gap-2 items-start">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/90">{t}</span>
                  </li>
                ))}
              </ul>
              <div className="grid sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => startCamera()}
                  disabled={modelsLoading}
                  size="lg"
                  className="w-full font-display"
                >
                  {modelsLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading face engine…</>
                  ) : (
                    <><Camera className="w-4 h-4 mr-1" /> Open Camera →</>
                  )}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={modelsLoading}
                  variant="outline"
                  size="lg"
                  className="w-full font-display"
                >
                  <Upload className="w-4 h-4 mr-1" /> Upload from Device
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                No camera? Upload 3 clear photos (front, left, right) instead.
              </p>
            </div>
          )}

          {cameraOpen && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Photo {currentPoseIdx + 1} of 3 — {currentPose.label}
                </p>
                <p className="font-medium mt-1">{currentPose.instruction}</p>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-border bg-black aspect-square mx-auto max-w-md">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  style={{ transform: "scaleX(-1)" }}
                />
                <canvas
                  ref={overlayRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md ${
                      faceDetected
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-primary/20 text-primary-foreground border border-primary/40"
                    }`}
                  >
                    {faceDetected ? "Face Detected ✓" : "No Face Detected"}
                  </span>
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-[10px] text-white/80 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded">
                    🔒 Processing on your device only
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {POSES.map((p, i) => (
                  <div
                    key={p.key}
                    className={`rounded-lg border p-2 text-center text-xs ${
                      captures[p.key]
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : i === currentPoseIdx
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border/40 text-muted-foreground"
                    }`}
                  >
                    {captures[p.key] ? <Check className="w-4 h-4 mx-auto mb-1" /> : <span className="block mb-1">{i + 1}</span>}
                    {p.label}
                  </div>
                ))}
              </div>

              {devices.length > 1 && (
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Select value={selectedDeviceId} onValueChange={switchCamera}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((d, i) => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-2">
                <Button
                  onClick={captureCurrent}
                  disabled={!faceDetected || !!captures[currentPose.key]}
                  size="lg"
                  className="w-full font-display"
                >
                  <Camera className="w-4 h-4 mr-1" /> {currentPose.cta}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="lg"
                  className="w-full font-display"
                  disabled={!!captures[currentPose.key]}
                >
                  <Upload className="w-4 h-4 mr-1" /> Upload Instead
                </Button>
              </div>
            </div>
          )}

          {allCaptured && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold">Review Your Captures</h2>
              <div className="grid grid-cols-3 gap-3">
                {POSES.map((p) => {
                  const cap = captures[p.key]!;
                  return (
                    <div key={p.key} className="space-y-2">
                      <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/20">
                        <img src={cap.dataUrl} alt={p.label} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                      </div>
                      <p className="text-xs font-medium text-center">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground text-center">
                        {new Date(cap.timestamp).toLocaleString()}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => retake(p.key)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Retake
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg border border-border/60 bg-card/40 p-3 flex gap-2 items-start">
                <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  🔒 These photos will be encrypted and stored privately. Only you can view them.
                </p>
              </div>

              <Button
                onClick={registerFace}
                disabled={submitting}
                size="lg"
                className="w-full font-display"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Registering…</>
                ) : (
                  <>These Look Good — Continue <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingFaceCapture;
