"use client";

class TactileEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = window.localStorage.getItem("ql_sound_muted") === "1";
    }
  }

  private ensureContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ql_sound_muted", this.muted ? "1" : "0");
    }
    if (!this.muted) {
      this.play("switch");
    }
    return this.muted;
  }

  play(kind: "tap" | "switch" | "success" = "tap") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(kind === "success" ? [10, 30, 12] : 6);
      } catch {}
    }

    if (this.muted || typeof window === "undefined") return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (kind === "tap") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(760, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.032);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.032);
        osc.start(now);
        osc.stop(now + 0.035);
      } else if (kind === "switch") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.045);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.055);
      } else if (kind === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.065);
        osc.frequency.setValueAtTime(783.99, now + 0.13);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.34);
      }
    } catch {}
  }
}

export const soundFX = new TactileEngine();
