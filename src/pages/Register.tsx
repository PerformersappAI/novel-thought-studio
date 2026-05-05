import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Camera, Check, Loader2, ArrowRight, Upload, Mic, MicOff, Play, Pause, Video,
  RotateCcw, Lock, Eye, EyeOff, ArrowLeft, FileAudio, AudioWaveform, AlertTriangle,
} from "lucide-react";
import * as faceapi from "@vladmandic/face-api";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import logo from "@/assets/cmf-shield-logo.png";

/* ─── constants ─── */
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
type Pose = "front" | "left" | "right";
type Capture = { dataUrl: string; blob: Blob; timestamp: string };
const POSES: { key: Pose; label: string; instruction: string }[] = [
  { key: "front", label: "Face Forward", instruction: "Look straight at the camera." },
  { key: "left", label: "Left Profile", instruction: "Turn your head to the LEFT." },
  { key: "right", label: "Right Profile", instruction: "Turn your head to the RIGHT." },
];
const MIN_VOICE_SEC = 20;
const MAX_VOICE_SEC = 60;
const SCRIPTED_PASSAGE = `My name is [say your full name]. I am registering my voice with ClaimMyFace today, on [say today's date]. The rainbow is a division of white light into many beautiful colors.`;

const LOADING_MESSAGES = [
  "Setting up your protection…",
  "Encrypting your biometrics…",
  "Registering your identity…",
  "Finalizing your profile…",
];

async function sha256(blob: Blob) {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ─── Shutter sound via Web Audio ─── */
function playShutter() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
    setTimeout(() => ctx.close(), 200);
  } catch {}
}

/* ─── Sections enum ─── */
type Section = "info" | "photos" | "voice";

/* ─── Pose Guide Overlay ─── */
const PoseGuideOverlay = ({ pose }: { pose: Pose }) => {
  if (pose === "front") return null;
  const isLeft = pose === "left";
  return (
    <motion.div
      className="absolute bottom-4 left-0 right-0 flex flex-col items-center z-20 pointer-events-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={pose}
    >
      <motion.div
        className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/40"
        animate={{ x: isLeft ? [0, -8, 0] : [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {isLeft && (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        <span className="text-sm font-semibold text-primary">
          Turn {isLeft ? "← LEFT" : "RIGHT →"}
        </span>
        {!isLeft && (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ─── Full-screen loading overlay ─── */
const LoadingOverlay = () => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2500);
    const progTimer = setInterval(() => setProgress(p => Math.min(p + 2, 95)), 300);
    return () => { clearInterval(msgTimer); clearInterval(progTimer); };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.img
        src={logo}
        alt="ClaimMyFace"
        className="h-16 w-auto"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="w-64 space-y-3">
        <Progress value={progress} className="h-2" />
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            className="text-sm text-muted-foreground text-center font-body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {LOADING_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5 text-primary" />
        <span>End-to-end encrypted</span>
      </div>
    </motion.div>
  );
};

const Register = () => {
  const { user, loading: authLoading, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [section, setSection] = useState<Section>("info");
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  /* ─── Info fields ─── */
  const [legalName, setLegalName] = useState("");
  const [stageName, setStageName] = useState("");
  const [akas, setAkas] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  /* ─── Face capture ─── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [poseIdx, setPoseIdx] = useState(0);
  const [captures, setCaptures] = useState<Record<Pose, Capture | null>>({ front: null, left: null, right: null });
  const [descriptor, setDescriptor] = useState<number[] | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [photosCompleted, setPhotosCompleted] = useState(false);

  /* ─── Voice ─── */
  const [recording, setRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceSec, setVoiceSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const mrRef = useRef<MediaRecorder | null>(null);
  const vStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ─── Auto-save debounce ref ─── */
  const saveTimerRef = useRef<number | null>(null);

  /* ─── Load face models on mount ─── */
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch {}
    })();
  }, []);

  /* ─── Cleanup ─── */
  useEffect(() => {
    return () => {
      stopCamera();
      stopVoiceStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* ─── Prefill from existing profile when user is logged in ─── */
  useEffect(() => {
    if (user && !profileLoaded) {
      setAccountCreated(true);
      setEmail(user.email ?? "");
      (async () => {
        const { data } = await supabase.from("profiles").select("legal_name, stage_name, bio, headshot_url, face_registered_at").eq("user_id", user.id).maybeSingle();
        if (data) {
          if (data.legal_name) setLegalName(data.legal_name);
          if (data.stage_name) setStageName(data.stage_name);
          if (data.bio?.startsWith("AKAs: ")) setAkas(data.bio.replace("AKAs: ", ""));
          if (data.headshot_url) setHeadshotPreview(data.headshot_url);
          if (data.face_registered_at) setPhotosCompleted(true);
        }
        setProfileLoaded(true);
      })();
    }
  }, [user, profileLoaded]);

  /* ─── Auto-save profile fields (debounced 1s) ─── */
  const autoSaveProfile = useCallback(() => {
    if (!user) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      const payload: any = {};
      if (legalName.trim()) { payload.legal_name = legalName.trim(); payload.full_name = legalName.trim(); }
      if (stageName.trim()) payload.stage_name = stageName.trim();
      if (akas.trim()) payload.bio = `AKAs: ${akas.trim()}`;
      if (Object.keys(payload).length > 0) {
        await supabase.from("profiles").update(payload).eq("user_id", user.id);
      }
    }, 1000);
  }, [user, legalName, stageName, akas]);

  useEffect(() => {
    if (user && profileLoaded) autoSaveProfile();
  }, [legalName, stageName, akas, user, profileLoaded, autoSaveProfile]);

  const allCaptured = captures.front && captures.left && captures.right;

  /* ─── Camera helpers ─── */
  const stopCamera = () => {
    if (detectRef.current) { clearInterval(detectRef.current); detectRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const enumerateCams = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter(d => d.kind === "videoinput");
      setDevices(cams);
      if (cams.length && !selectedDeviceId) setSelectedDeviceId(cams[0].deviceId);
      return cams;
    } catch { return []; }
  };

  const startCamera = async (deviceId?: string) => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 720 }, height: { ideal: 720 } }
          : { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraOpen(true);
      setCameraError(false);
      const cams = await enumerateCams();
      const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId;
      if (activeId) setSelectedDeviceId(activeId);
      else if (!selectedDeviceId && cams[0]) setSelectedDeviceId(cams[0].deviceId);
      runDetection();
    } catch (e: any) {
      setCameraError(true);
      toast({ title: "Camera unavailable", description: "Could not start camera. You can upload photos instead.", variant: "destructive" });
    }
  };

  const switchCamera = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (cameraOpen) await startCamera(deviceId);
  };

  useEffect(() => {
    if (section !== "photos" || photosCompleted || allCaptured) return;
    enumerateCams();
  }, [section, photosCompleted, allCaptured]);

  const CameraPicker = () => {
    if (devices.length < 1) return null;
    const cameraOptions = devices.map((d, i) => ({ device: d, value: d.deviceId || `camera-${i}` }));
    const pickerValue = selectedDeviceId || cameraOptions[0]?.value;
    const handleCameraPick = (value: string) => {
      const option = cameraOptions.find(o => o.value === value);
      switchCamera(option?.device.deviceId || "");
    };
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Video className="w-4 h-4" /> Camera
        </Label>
        <Select value={pickerValue} onValueChange={handleCameraPick}>
          <SelectTrigger className="w-full bg-background/70">
            <SelectValue placeholder="Choose camera" />
          </SelectTrigger>
          <SelectContent>
            {cameraOptions.map(({ device: d, value }, i) => (
              <SelectItem key={value} value={value}>
                {d.label || `Camera ${i + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const runDetection = () => {
    if (detectRef.current) clearInterval(detectRef.current);
    detectRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      const canvas = overlayRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
      const result = await faceapi.detectSingleFace(video, opts).withFaceLandmarks();
      const dw = video.clientWidth, dh = video.clientHeight;
      if (canvas.width !== dw || canvas.height !== dh) { canvas.width = dw; canvas.height = dh; }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, dw, dh);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(dw / 2, dh / 2, dw * 0.28, dh * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (result) {
        setFaceDetected(true);
        const r = faceapi.resizeResults(result, { width: dw, height: dh });
        ctx.fillStyle = "hsl(351, 85%, 55%)";
        r.landmarks.positions.forEach(pt => { ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2); ctx.fill(); });
      } else {
        setFaceDetected(false);
      }
    }, 120);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const pose = POSES[poseIdx].key;
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, c.width, c.height);

    playShutter();

    if (pose === "front") {
      const det = await faceapi.detectSingleFace(c, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks().withFaceDescriptor();
      if (!det) { toast({ title: "No face detected", variant: "destructive" }); return; }
      setDescriptor(Array.from(det.descriptor));
    }
    const blob: Blob | null = await new Promise(r => c.toBlob(r, "image/jpeg", 0.9));
    if (!blob) return;
    const dataUrl = c.toDataURL("image/jpeg", 0.85);
    setCaptures(prev => ({ ...prev, [pose]: { dataUrl, blob, timestamp: new Date().toISOString() } }));
    if (poseIdx < POSES.length - 1) setPoseIdx(i => i + 1);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const pose = POSES[poseIdx].key;
    const dataUrl = await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.onerror = () => rej(fr.error); fr.readAsDataURL(file); });
    const img = new Image(); img.src = dataUrl;
    await new Promise(r => img.onload = r);
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext("2d"); if (!ctx) return; ctx.drawImage(img, 0, 0);
    playShutter();
    if (pose === "front") {
      const det = await faceapi.detectSingleFace(c, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })).withFaceLandmarks().withFaceDescriptor();
      if (!det) { toast({ title: "No face detected in uploaded photo", variant: "destructive" }); return; }
      setDescriptor(Array.from(det.descriptor));
    }
    const blob: Blob | null = await new Promise(r => c.toBlob(r, "image/jpeg", 0.9));
    if (!blob) return;
    setCaptures(prev => ({ ...prev, [pose]: { dataUrl: c.toDataURL("image/jpeg", 0.85), blob, timestamp: new Date().toISOString() } }));
    if (poseIdx < POSES.length - 1) setPoseIdx(i => i + 1);
  };

  const retakePhoto = (pose: Pose) => {
    setCaptures(prev => ({ ...prev, [pose]: null }));
    if (pose === "front") setDescriptor(null);
    setPoseIdx(POSES.findIndex(p => p.key === pose));
    setPhotosCompleted(false);
  };

  const retakeAll = () => {
    setCaptures({ front: null, left: null, right: null });
    setDescriptor(null);
    setPoseIdx(0);
    setPhotosCompleted(false);
    setCameraError(false);
  };

  /* ─── Voice helpers ─── */
  const stopVoiceStream = () => {
    vStreamRef.current?.getTracks().forEach(t => t.stop());
    vStreamRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      vStreamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        setVoiceBlob(blob);
        if (voiceUrl) URL.revokeObjectURL(voiceUrl);
        setVoiceUrl(URL.createObjectURL(blob));
        stopVoiceStream();
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
      setVoiceSec(0);
      timerRef.current = window.setInterval(() => {
        setVoiceSec(s => {
          if (s + 1 >= MAX_VOICE_SEC) stopRecording();
          return s + 1;
        });
      }, 1000);
    } catch (err: any) {
      toast({ title: "Microphone denied", description: err?.message, variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mrRef.current?.stop();
    mrRef.current = null;
    setRecording(false);
  };

  const resetVoice = () => {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoiceBlob(null);
    setVoiceUrl(null);
    setVoiceSec(0);
    setPlaying(false);
  };

  const onHeadshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast({ title: "File too large (max 8MB)", variant: "destructive" }); return; }
    setHeadshotFile(file);
    setHeadshotPreview(URL.createObjectURL(file));
  };

  /* ─── Create account (or skip if already logged in) ─── */
  const handleCreateAccount = async () => {
    if (!legalName.trim() || !email.trim() || !password || password.length < 8) {
      toast({ title: "Fill in all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, legalName, {
      account_type: "performer",
      stage_name: stageName,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setAccountCreated(true);
    toast({ title: "Account created!", description: "Check your email for confirmation." });
    setSubmitting(false);
    setSection("photos");
  };

  const handleContinueToPhotos = async () => {
    if (!accountCreated) {
      await handleCreateAccount();
      return;
    }
    if (!user) { setSection("photos"); return; }
    setSubmitting(true);
    try {
      let headshot_url: string | undefined;
      if (headshotFile) {
        const ext = headshotFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/headshot-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("headshots").upload(path, headshotFile, { upsert: true, contentType: headshotFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("headshots").getPublicUrl(path);
        headshot_url = pub.publicUrl;
      }
      const payload: any = {
        legal_name: legalName.trim(),
        full_name: legalName.trim(),
        stage_name: stageName.trim() || null,
      };
      if (akas.trim()) payload.bio = `AKAs: ${akas.trim()}`;
      if (headshot_url) payload.headshot_url = headshot_url;
      await supabase.from("profiles").update(payload).eq("user_id", user.id);
    } catch {}
    setSubmitting(false);
    setSection("photos");
  };

  /* ─── Final submit: save photos + voice + go to dashboard ─── */
  const handleFinish = async () => {
    if (!user) { navigate("/dashboard"); return; }
    setFinishing(true);
    try {
      // Upload face captures
      if (allCaptured && descriptor) {
        const uploads: Record<Pose, string> = { front: "", left: "", right: "" };
        for (const pose of ["front", "left", "right"] as Pose[]) {
          const cap = captures[pose]!;
          const path = `${user.id}/${pose}-${Date.now()}.jpg`;
          await supabase.storage.from("face-captures").upload(path, cap.blob, { upsert: true, contentType: "image/jpeg" });
          uploads[pose] = path;
        }
        await supabase.from("profiles").update({
          face_capture_front_url: uploads.front,
          face_capture_left_url: uploads.left,
          face_capture_right_url: uploads.right,
          face_descriptor: descriptor as any,
          face_registered_at: new Date().toISOString(),
        } as any).eq("user_id", user.id);
      }
      // Upload voice
      if (voiceBlob && voiceSec >= MIN_VOICE_SEC) {
        const ext = voiceBlob.type.includes("mp4") ? "mp4" : "webm";
        const path = `${user.id}/voice-print-${Date.now()}.${ext}`;
        const hash = await sha256(voiceBlob);
        await supabase.storage.from("voice-prints").upload(path, voiceBlob, { contentType: voiceBlob.type });
        await supabase.from("profiles").update({
          voice_print_url: path,
          voice_print_hash: hash,
          voice_print_duration_seconds: voiceSec,
          voice_registered_at: new Date().toISOString(),
        }).eq("user_id", user.id);
      }
      // Call actor registry edge function
      try {
        const prof = (await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()).data;
        if (prof) {
          await supabase.functions.invoke("actor-registry", {
            body: {
              action: "register",
              legal_name: prof.legal_name || prof.full_name,
              stage_name: prof.stage_name,
              aka_names: akas.trim() || null,
              email: user.email,
              reference_photo_url: prof.headshot_url,
            },
          });
        }
      } catch {}
      stopCamera();
      stopVoiceStream();
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setFinishing(false);
    }
  };

  const currentPose = POSES[poseIdx];
  const voiceReady = voiceBlob && voiceSec >= MIN_VOICE_SEC;

  /* ─── Full-screen loading overlay when finishing ─── */
  if (finishing) return <LoadingOverlay />;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Logo + back */}
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="ClaimMyFace" className="h-8 w-auto" />
          </a>
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </a>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-3">
          {(["info", "photos", "voice"] as Section[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border shrink-0 ${
                (section === "voice" && i < 2) || (section === "photos" && i === 0) ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" :
                section === s ? "bg-primary/15 border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]" :
                "bg-muted/30 border-border text-muted-foreground"
              }`}>
                {(section === "voice" && i < 2) || (section === "photos" && i === 0) ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs font-medium truncate">{["Your Info", "Photos", "Voice"][i]}</span>
              {i < 2 && <div className="h-px flex-1 bg-border hidden sm:block" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── SECTION 1: INFO ─── */}
          {section === "info" && (
            <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-2xl p-6 sm:p-8 space-y-5"
            >
              <header>
                <h1 className="font-display text-3xl font-bold">Tell us who you are.</h1>
                <p className="text-sm text-muted-foreground mt-1">Takes about 2 minutes. All information is private.</p>
              </header>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Legal Name *</Label>
                  <Input value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Your full legal name" />
                </div>
                <div className="space-y-2">
                  <Label>Stage Name</Label>
                  <Input value={stageName} onChange={e => setStageName(e.target.value)} placeholder="Professional / stage name" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Also Known As (AKAs)</Label>
                  <Input value={akas} onChange={e => setAkas(e.target.value)} placeholder="Comma-separated aliases" />
                </div>
                {!accountCreated && (
                  <>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <div className="relative">
                        <Input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" className="pr-10" />
                        <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Headshot */}
              <div className="space-y-2">
                <Label>Headshot (optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted/30 border border-border overflow-hidden flex items-center justify-center">
                    {headshotPreview ? (
                      <img src={headshotPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <Input type="file" accept="image/*" onChange={onHeadshot} className="max-w-xs" />
                </div>
              </div>

              <Button onClick={handleContinueToPhotos} disabled={submitting || (!accountCreated && (!legalName.trim() || !email.trim() || password.length < 8))} size="lg" className="w-full font-display">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue to Face Capture <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </motion.div>
          )}

          {/* ─── SECTION 2: PHOTOS ─── */}
          {section === "photos" && (
            <motion.div key="photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-2xl p-6 sm:p-8 space-y-5"
            >
              <header className="text-center">
                <h1 className="font-display text-3xl font-bold text-gradient-crimson">Capture Your Real Face</h1>
                <p className="text-sm text-muted-foreground mt-2">3 quick photos: front, left, right. Unfiltered, unedited.</p>
              </header>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

              {/* Photos already completed state (bug #6) */}
              {photosCompleted && !allCaptured && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3">
                    <Check className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h2 className="font-display text-xl font-semibold text-emerald-300">Photos Already Captured</h2>
                    <p className="text-sm text-muted-foreground">Your face photos were previously registered.</p>
                    <Button onClick={retakeAll} variant="outline" className="mt-2">
                      <RotateCcw className="w-4 h-4 mr-1" /> Retake All Photos
                    </Button>
                  </div>
                  <Button onClick={() => { stopCamera(); setSection("voice"); }} size="lg" className="w-full font-display">
                    Continue to Voice <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* Initial state: open camera or upload (bug #3: camera error fallback) */}
              {!photosCompleted && !cameraOpen && !allCaptured && (
                <div className="space-y-3">
                  {cameraError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Camera unavailable</p>
                        <p className="text-xs text-muted-foreground mt-1">Could not start video source. Please upload your photos instead.</p>
                      </div>
                    </div>
                  )}
                  <CameraPicker />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Button onClick={() => startCamera(selectedDeviceId || undefined)} disabled={!modelsLoaded} size="lg" className="w-full font-display">
                      {!modelsLoaded ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…</> : <><Camera className="w-4 h-4 mr-1" /> {cameraError ? "Try Camera Again" : "Open Camera"}</>}
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} disabled={!modelsLoaded} variant={cameraError ? "default" : "outline"} size="lg" className="w-full font-display">
                      <Upload className="w-4 h-4 mr-1" /> Upload Photos
                    </Button>
                  </div>
                </div>
              )}

              {/* Camera is open and not all captured */}
              {!photosCompleted && cameraOpen && !allCaptured && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Photo {poseIdx + 1} of 3 — {currentPose.label}</p>
                    <p className="font-medium mt-1">{currentPose.instruction}</p>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-black aspect-square mx-auto max-w-md">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: "scaleX(-1)" }} />
                    <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: "scaleX(-1)" }} />
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md ${faceDetected ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-primary/20 text-primary-foreground border border-primary/40"}`}>
                        {faceDetected ? "Face Detected ✓" : "No Face Detected"}
                      </span>
                    </div>
                    {/* Bug #5: Animated pose guide overlay */}
                    <PoseGuideOverlay pose={currentPose.key} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {POSES.map((p, i) => (
                      <div key={p.key} className={`rounded-lg border p-2 text-center text-xs ${captures[p.key] ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : i === poseIdx ? "border-primary/60 bg-primary/10 text-primary" : "border-border/40 text-muted-foreground"}`}>
                        {captures[p.key] ? <Check className="w-4 h-4 mx-auto mb-1" /> : <span className="block mb-1">{i + 1}</span>}
                        {p.label}
                      </div>
                    ))}
                  </div>
                  <CameraPicker />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Button onClick={capturePhoto} disabled={!faceDetected || !!captures[currentPose.key]} size="lg" className="w-full font-display">
                      <Camera className="w-4 h-4 mr-1" /> Take {currentPose.label} Photo
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="lg" className="w-full font-display" disabled={!!captures[currentPose.key]}>
                      <Upload className="w-4 h-4 mr-1" /> Upload Instead
                    </Button>
                  </div>
                </div>
              )}

              {/* All captured - review */}
              {allCaptured && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">Review Your Captures</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {POSES.map(p => {
                      const cap = captures[p.key]!;
                      return (
                        <div key={p.key} className="space-y-2">
                          <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/20">
                            <img src={cap.dataUrl} alt={p.label} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                          </div>
                          <p className="text-xs font-medium text-center">{p.label}</p>
                          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => retakePhoto(p.key)}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Retake
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <Button onClick={() => { stopCamera(); setPhotosCompleted(true); setSection("voice"); }} size="lg" className="w-full font-display">
                    Photos Look Good — Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setSection("info")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Info
              </Button>
            </motion.div>
          )}

          {/* ─── SECTION 3: VOICE ─── */}
          {section === "voice" && (
            <motion.div key="voice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-2xl p-6 sm:p-8 space-y-5"
            >
              <header>
                <h1 className="font-display text-3xl font-bold">Register Your Voice</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional but strongly recommended. Read the passage aloud ({MIN_VOICE_SEC}–{MAX_VOICE_SEC} seconds).
                </p>
              </header>

              <div className="rounded-xl bg-background/60 border border-border/40 p-4 text-sm leading-relaxed text-foreground/90 italic">
                "{SCRIPTED_PASSAGE}"
              </div>

              <div className="rounded-xl border border-border/40 bg-background/40 p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {!recording && !voiceBlob && (
                      <Button onClick={startRecording} size="lg" className="bg-[hsl(var(--crimson))] hover:bg-[hsl(var(--crimson))]/90 text-white">
                        <Mic className="w-5 h-5 mr-2" /> Start Recording
                      </Button>
                    )}
                    {recording && (
                      <Button onClick={stopRecording} size="lg" variant="outline" className="border-[hsl(var(--crimson))] text-[hsl(var(--crimson-bright))]">
                        <MicOff className="w-5 h-5 mr-2" /> Stop
                      </Button>
                    )}
                    {voiceBlob && !recording && (
                      <>
                        <Button onClick={() => { if (!audioRef.current) return; playing ? audioRef.current.pause() : audioRef.current.play(); setPlaying(!playing); }} size="lg" variant="outline">
                          {playing ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                          {playing ? "Pause" : "Play"}
                        </Button>
                        <Button onClick={resetVoice} size="lg" variant="ghost">
                          <RotateCcw className="w-4 h-4 mr-1.5" /> Re-record
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-sm">
                    {recording && <span className="w-2 h-2 rounded-full bg-[hsl(var(--crimson))] animate-pulse" />}
                    <span className={voiceSec >= MIN_VOICE_SEC ? "text-emerald-400" : "text-muted-foreground"}>
                      {String(Math.floor(voiceSec / 60)).padStart(2, "0")}:{String(voiceSec % 60).padStart(2, "0")}
                    </span>
                  </div>
                </div>
                {voiceBlob && (
                  <audio ref={audioRef} src={voiceUrl ?? undefined} onEnded={() => setPlaying(false)} className="w-full mt-3" controls />
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleFinish} disabled={submitting} size="lg" className="flex-1 glow-red font-display">
                  {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving…</> :
                    voiceReady ? <><Check className="w-5 h-5 mr-2" /> Finish & Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" /></> :
                    <>Skip Voice & Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>

              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setSection("photos")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Photos
              </Button>

              <div className="flex gap-2 items-start text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p>Your voice file is encrypted at rest. Only you and ClaimMyFace admins can access it.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Register;
