import React, { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import {
  Mail,
  LockKeyhole,
  Fingerprint,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

/*
 * VOLSIM-PRO AUTH GATE
 * Visual-only replacement for the existing LoginScreen.
 *
 * Preserved:
 * - useAuth()
 * - login(email, password)
 * - register(email, password)
 * - isLoading
 * - login/signup flow
 * - existing error handling
 * - biometric handler
 * - forgot-password handler
 * - admin-portal handler
 *
 * No WebSocket, trading, market-data, Zustand, or backend architecture
 * is introduced here.
 */

type AuthTab = 'login' | 'signup';


export const LoginScreen: React.FC = () => {
  const { login, register, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');

    if (!email.trim() || !password) {
      setLocalError('Please enter your email address and password.');
      return;
    }

    try {
      if (activeTab === 'signup') {
        await register(email.trim(), password);
        await login(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Authentication failed. Please check your credentials and try again.';

      setLocalError(message);
    }
  };

  const handleBiometric = () => {
    setLocalError('Biometric Login is not available yet.');
  };

  const handleForgotPassword = () => {
    setLocalError('Password recovery is not available yet.');
  };

  const router = useRouter();

  const handleAdminPortal = () => {
    router.push('/admin');
  };

  return (
    <main className="vs-auth-root">
<style>{`
  :root {
    --vs-bg: #020617;
    --vs-navy: #0a1628;
    --vs-card: #0f172a;
    --vs-blue: #00b4ff;
    --vs-sky: #0ea5e9;
    --vs-cyan: #22d3ee;
    --vs-text: #f4fbff;
    --vs-muted: #9bb7cf;
  }

  * {
    box-sizing: border-box;
  }

  .vs-auth-root {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
    color: var(--vs-text);
    background:
      radial-gradient(
        ellipse at 50% 42%,
        rgba(0, 105, 255, 0.40) 0%,
        rgba(0, 76, 180, 0.26) 28%,
        rgba(0, 42, 105, 0.13) 58%
      ),
      radial-gradient(
        ellipse at 15% 20%,
        rgba(0, 180, 255, 0.13),
        transparent 34%
      ),
      radial-gradient(
        ellipse at 85% 70%,
        rgba(14, 165, 233, 0.12),
        transparent 38%
      ),
      linear-gradient(
        135deg,
        #010417 0%,
        #02091a 42%,
        #061225 58%,
        #010417 100%
      );
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .vs-auth-root::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background:
      radial-gradient(
        circle at 50% 50%,
        transparent 0%,
        transparent 52%,
        rgba(0, 0, 0, 0.42) 100%
      ),
      linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.36),
        transparent 18%,
        transparent 82%,
        rgba(0, 0, 0, 0.36)
      );
  }

  .vs-auth-root::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    opacity: 0.55;
    background-image:
      radial-gradient(circle, rgba(103, 232, 249, 0.65) 0.7px, transparent 1px),
      radial-gradient(circle, rgba(14, 165, 233, 0.4) 0.6px, transparent 1px);
    background-size: 73px 73px, 113px 113px;
    background-position: 7px 13px, 31px 47px;
    mask-image: linear-gradient(
      180deg,
      transparent 0%,
      black 14%,
      black 86%,
      transparent 100%
    );
  }

  .vs-cosmic-layer {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    pointer-events: none;
  }

  .vs-nebula {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.7;
  }

  .vs-nebula-a {
    width: 42vw;
    height: 30vw;
    left: -8vw;
    top: 4vh;
    background: rgba(0, 139, 255, 0.12);
    transform: rotate(-18deg);
  }

  .vs-nebula-b {
    width: 38vw;
    height: 28vw;
    right: -6vw;
    bottom: 2vh;
    background: rgba(0, 180, 255, 0.11);
    transform: rotate(25deg);
  }

  .vs-stars {
    position: absolute;
    inset: 0;
  }

  .vs-cosmic-mountain-net {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 54%;
    opacity: 0.78;
    pointer-events: none;
    overflow: visible;
    z-index: 1;
    filter:
      drop-shadow(0 0 4px rgba(56, 189, 248, 0.20))
      drop-shadow(0 0 10px rgba(14, 165, 233, 0.12));
  }

  .vs-cmn-deep,
  .vs-cmn-mid,
  .vs-cmn-bright,
  .vs-cmn-ribs,
  .vs-cmn-net {
    fill: none;
    vector-effect: non-scaling-stroke;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .vs-cmn-deep {
    stroke: rgba(0, 76, 180, 0.18);
    stroke-width: 0.55;
  }

  .vs-cmn-mid {
    stroke: rgba(0, 126, 235, 0.32);
    stroke-width: 0.62;
  }

  .vs-cmn-bright {
    stroke: rgba(0, 183, 255, 0.52);
    stroke-width: 0.72;
    filter:
      drop-shadow(0 0 2px rgba(0, 183, 255, 0.26))
      drop-shadow(0 0 5px rgba(0, 140, 255, 0.12));
  }

  .vs-cmn-ribs {
    stroke: rgba(0, 126, 235, 0.22);
    stroke-width: 0.48;
  }

  .vs-cmn-net {
    stroke: rgba(56, 189, 248, 0.48);
    stroke-width: 0.46;
    filter: drop-shadow(0 0 3px rgba(56, 189, 248, 0.24));
  }

  .vs-cmn-stars {
    fill: #dff9ff;
    filter:
      drop-shadow(0 0 3px rgba(103, 232, 249, 0.95))
      drop-shadow(0 0 7px rgba(0, 183, 255, 0.72));
  }

  .vs-cmn-stars circle:nth-child(3n) {
    fill: #ffffff;
    filter:
      drop-shadow(0 0 3px rgba(186, 244, 255, 1))
      drop-shadow(0 0 8px rgba(0, 183, 255, 0.86));
  }

  @media (max-width: 640px) {
    .vs-cosmic-mountain-net {
      height: 30%;
      opacity: 0.66;
    }

    .vs-cmn-deep {
      stroke-width: 0.48;
    }

    .vs-cmn-mid {
      stroke-width: 0.54;
    }

    .vs-cmn-bright {
      stroke-width: 0.62;
    }

    .vs-cmn-ribs,
    .vs-cmn-net {
      stroke-width: 0.42;
    }
  }
  .vs-star {
    position: absolute;
    border-radius: 50%;
    background: #d9f7ff;
    box-shadow:
      0 0 4px rgba(103, 232, 249, 0.95),
      0 0 10px rgba(0, 180, 255, 0.70),
      0 0 18px rgba(0, 139, 255, 0.32);
  }

  .vs-watermark {
    position: absolute;
    z-index: 1;
    top: -1.5vh;
    display: flex;
    flex-direction: column;
    gap: 0.4vh;
    pointer-events: none;
    user-select: none;
    overflow: hidden;
  }

  .vs-watermark.left {
    left: -1.8vw;
    align-items: flex-start;
  }

  .vs-watermark.right {
    right: -1.8vw;
    align-items: flex-end;
  }

  .vs-watermark span {
    display: block;
    white-space: nowrap;
    color: rgba(0, 126, 235, 0.11);
    font-size: clamp(32px, 3.75vw, 62px);
    line-height: 0.82;
    font-weight: 800;
    letter-spacing: -0.060em;
    filter: blur(0.20px);
    text-shadow:
      0 0 16px rgba(0, 126, 235, 0.11),
      0 0 34px rgba(0, 105, 220, 0.07),
      0 0 64px rgba(0, 90, 190, 0.04);
  }

  .vs-watermark span:nth-child(1) {
    opacity: 1;
  }

  .vs-watermark span:nth-child(2) {
    opacity: 0.68;
  }

  .vs-watermark span:nth-child(3) {
    opacity: 0.48;
  }

  .vs-network {
    position: absolute;
    inset: auto 0 0;
    width: 100%;
    height: 62%;
    opacity: 0.90;
    filter: drop-shadow(0 0 3px rgba(0, 139, 255, 0.30));
  }

  .vs-network-line {
    fill: none;
    stroke: rgba(0, 180, 255, 0.46);
    stroke-width: 1.25;
    vector-effect: non-scaling-stroke;
  }
  .vs-sea-current {
  fill: none;
  stroke: rgba(0, 105, 220, 0.15);
  stroke-width: 1.15;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  filter:
    drop-shadow(0 0 4px rgba(0, 126, 235, 0.08))
    drop-shadow(0 0 9px rgba(0, 105, 220, 0.04));
}
.vs-pyramid-net-refinement {
  fill: none;
  pointer-events: none;
  vector-effect: non-scaling-stroke;
}

.vs-pyramid-net-deep {
  fill: none;
  stroke: rgba(0, 58, 145, 0.27);
  stroke-width: 0.50;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.vs-pyramid-net-mid {
  fill: none;
  stroke: rgba(0, 126, 235, 0.40);
  stroke-width: 0.60;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter:
    drop-shadow(0 0 2px rgba(0, 126, 235, 0.10))
    drop-shadow(0 0 5px rgba(0, 105, 220, 0.05));
}

.vs-pyramid-net-bright {
  fill: none;
  stroke: rgba(0, 183, 255, 0.55);
  stroke-width: 0.70;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter:
    drop-shadow(0 0 2px rgba(0, 183, 255, 0.22))
    drop-shadow(0 0 5px rgba(0, 140, 255, 0.10));
}
.vs-cosmic-terrain {
  pointer-events: none;
}

.vs-cosmic-dust-deep {
  fill: rgba(0, 105, 220, 0.34);
  filter: drop-shadow(0 0 2px rgba(0, 105, 220, 0.20));
}

.vs-cosmic-dust-mid {
  fill: rgba(0, 183, 255, 0.58);
  filter:
    drop-shadow(0 0 2px rgba(0, 183, 255, 0.34))
    drop-shadow(0 0 5px rgba(0, 126, 235, 0.16));
}

.vs-cosmic-energy {
  fill: rgba(103, 232, 249, 0.76);
  filter:
    drop-shadow(0 0 3px rgba(34, 211, 238, 0.65))
    drop-shadow(0 0 8px rgba(0, 139, 255, 0.38));
}
.vs-network-fine-mesh {
    fill: none;
    stroke: rgba(0, 105, 220, 0.48);
    stroke-width: 0.60;
    vector-effect: non-scaling-stroke;
    filter:
      drop-shadow(0 0 2px rgba(0, 125, 243, 0.14));
  }

  .vs-network-fine-mesh-deep {
    fill: none;
    stroke: rgba(0, 58, 145, 0.52);
    stroke-width: 0.54;
    vector-effect: non-scaling-stroke;
  }

  .vs-network-fine-mesh-mid {
    fill: none;
    stroke: rgba(0, 126, 235, 0.62);
    stroke-width: 0.64;
    vector-effect: non-scaling-stroke;
    filter:
      drop-shadow(0 0 2px rgba(0, 140, 255, 0.20))
      drop-shadow(0 0 4px rgba(0, 105, 220, 0.10));
  }

  .vs-network-fine-mesh-bright {
    fill: none;
    stroke: rgba(0, 183, 255, 0.72);
    stroke-width: 0.76;
    vector-effect: non-scaling-stroke;
    filter:
      drop-shadow(0 0 2px rgba(0, 183, 255, 0.38))
      drop-shadow(0 0 5px rgba(0, 140, 255, 0.22));
  }
  .vs-network-line-bright {
    fill: none;
    stroke: rgba(34, 211, 238, 0.68);
    stroke-width: 1.45;
    filter: drop-shadow(0 0 4px rgba(34, 211, 238, 0.38));
    vector-effect: non-scaling-stroke;
  }

  .vs-network-node {
    fill: rgba(34, 211, 238, 0.88);
    filter: drop-shadow(0 0 5px rgba(0, 180, 255, 0.65));
  }

  .vs-candle-field {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.68;
  }

  .vs-candle-wick {
    stroke: rgba(34, 211, 238, 0.72);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .vs-candle-up {
    fill: rgba(14, 165, 233, 0.5);
    stroke: rgba(34, 211, 238, 0.8);
    stroke-width: 0.7;
  }

  .vs-candle-down {
    fill: rgba(3, 105, 161, 0.38);
    stroke: rgba(56, 189, 248, 0.62);
    stroke-width: 0.7;
  }

  .vs-ray {
    position: absolute;
    height: 1px;
    transform-origin: left center;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(34, 211, 238, 0.18),
      transparent
    );
    filter: blur(0.2px);
  }

  .vs-ray-1 {
    width: 55vw;
    left: -10vw;
    top: 34%;
    transform: rotate(13deg);
  }

  .vs-ray-2 {
    width: 48vw;
    right: -7vw;
    top: 61%;
    transform: rotate(-14deg);
  }

  .vs-card-wrap {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    pointer-events: none;
  }

  .vs-card {
    position: relative;
    width: min(410px, calc(100vw - 36px));
    padding: 38px 34px 27px;
    border: 1px solid rgba(34, 211, 238, 0.42);
    border-radius: 19px;
    background:
      linear-gradient(
        145deg,
        rgba(15, 34, 58, 0.86),
        rgba(7, 18, 34, 0.91) 52%,
        rgba(3, 10, 23, 0.94)
      );
    box-shadow:
      0 0 0 1px rgba(0, 180, 255, 0.06),
      0 0 35px rgba(0, 180, 255, 0.19),
      0 28px 80px rgba(0, 0, 0, 0.62),
      inset 0 1px 0 rgba(150, 230, 255, 0.13);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    pointer-events: auto;
    overflow: hidden;
  }

  .vs-card::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse at 50% 0%,
        rgba(0, 180, 255, 0.15),
        transparent 52%
      ),
      linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.025),
        transparent 28%
      );
  }

  .vs-card::after {
    content: "";
    position: absolute;
    left: 12%;
    right: 12%;
    bottom: -16px;
    height: 70px;
    border-radius: 50%;
    background: rgba(0, 180, 255, 0.12);
    filter: blur(30px);
    pointer-events: none;
  }

  .vs-brand {
    position: relative;
    z-index: 2;
    margin: 0;
    text-align: center;
    font-size: clamp(31px, 4vw, 39px);
    line-height: 1;
    font-weight: 800;
    letter-spacing: -1.7px;
    color: #38bdf8;
    background: linear-gradient(
      180deg,
      #e0f7ff 0%,
      #7dd3fc 28%,
      #38bdf8 58%,
      #0284c7 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter:
      drop-shadow(0 0 4px rgba(56, 189, 248, 0.22))
      drop-shadow(0 0 12px rgba(14, 165, 233, 0.14));
  }

  .vs-ai-subtitle {
    position: relative;
    z-index: 2;
    margin-top: 8px;
    text-align: center;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.19em;
    text-transform: none;
    color: rgba(190, 231, 255, 0.78);
  }

  .vs-divider {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 1px;
    margin: 25px 0 18px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(34, 211, 238, 0.48) 22%,
      rgba(34, 211, 238, 0.72) 50%,
      rgba(34, 211, 238, 0.48) 78%,
      transparent
    );
  }

  .vs-tabs {
    position: relative;
    z-index: 3;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 20px;
    padding: 4px;
    border: 1px solid rgba(56, 189, 248, 0.20);
    border-radius: 11px;
    background: rgba(2, 15, 31, 0.65);
  }

  .vs-tab {
    position: relative;
    height: 38px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: #9cc5df;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 160ms ease;
  }

  .vs-tab:hover {
    color: #e0f7ff;
    border-color: rgba(34, 211, 238, 0.22);
  }

  .vs-tab.active {
    color: white;
    background: linear-gradient(
      135deg,
      #0ea5e9,
      #00b4ff 52%,
      #22d3ee
    );
    border-color: rgba(103, 232, 249, 0.72);
    box-shadow:
      0 0 13px rgba(0, 180, 255, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.20);
  }

  .vs-form {
    position: relative;
    z-index: 3;
  }

  .vs-field {
    position: relative;
    height: 56px;
    margin-bottom: 14px;
  }

  .vs-field-icon {
    position: absolute;
    z-index: 2;
    left: 16px;
    top: 50%;
    width: 21px;
    height: 21px;
    transform: translateY(-50%);
    color: #8ddfff;
    stroke-width: 1.7;
    pointer-events: none;
  }

  .vs-input {
    width: 100%;
    height: 100%;
    padding: 0 48px 0 52px;
    border: 1px solid rgba(96, 165, 250, 0.38);
    border-radius: 10px;
    outline: none;
    background: rgba(3, 17, 34, 0.78);
    color: #effaff;
    font-size: 16px;
    transition: all 160ms ease;
  }

  .vs-input::placeholder {
    color: #8da7bd;
  }

  .vs-input:focus {
    border-color: rgba(34, 211, 238, 0.82);
    background: rgba(5, 26, 49, 0.86);
    box-shadow:
      0 0 0 2px rgba(14, 165, 233, 0.09),
      0 0 18px rgba(0, 180, 255, 0.16);
  }

  .vs-password-toggle {
    position: absolute;
    z-index: 4;
    right: 13px;
    top: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    transform: translateY(-50%);
    border: 0;
    background: transparent;
    color: #80c8e8;
    cursor: pointer;
    border-radius: 7px;
  }

  .vs-password-toggle:hover {
    color: #67e8f9;
    background: rgba(14, 165, 233, 0.08);
  }

  .vs-login-button {
    position: relative;
    width: 100%;
    height: 53px;
    margin-top: 5px;
    border: 1px solid rgba(103, 232, 249, 0.65);
    border-radius: 10px;
    background: linear-gradient(
      135deg,
      #0284c7 0%,
      #0ea5e9 45%,
      #22d3ee 100%
    );
    color: white;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    box-shadow:
      0 0 15px rgba(0, 180, 255, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    transition: all 160ms ease;
  }

  .vs-login-button:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.08);
    box-shadow:
      0 0 22px rgba(0, 180, 255, 0.40),
      0 7px 24px rgba(0, 100, 190, 0.22);
  }

  .vs-login-button:disabled {
    opacity: 0.65;
    cursor: wait;
  }

  .vs-biometric-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 14px;
    margin-top: 18px;
  }

  .vs-secondary-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 0;
    background: transparent;
    color: #a9d8ef;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: color 160ms ease;
  }

  .vs-secondary-action:hover {
    color: #67e8f9;
  }

  .vs-secondary-action svg {
    width: 19px;
    height: 19px;
  }

  .vs-bottom-divider {
    width: 1px;
    height: 25px;
    background: rgba(148, 195, 222, 0.30);
  }

  .vs-admin-button {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    height: 45px;
    margin-top: 18px;
    border: 1px solid rgba(34, 211, 238, 0.36);
    border-radius: 9px;
    background: rgba(3, 18, 35, 0.62);
    color: #b9def1;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 160ms ease;
  }

  .vs-admin-button:hover {
    color: #e3f9ff;
    border-color: rgba(34, 211, 238, 0.72);
    box-shadow: 0 0 15px rgba(0, 180, 255, 0.14);
  }

  .vs-admin-button svg {
    width: 18px;
    height: 18px;
    color: #67e8f9;
  }

  .vs-error {
    position: relative;
    z-index: 4;
    margin: 9px 0 0;
    padding: 8px 10px;
    border: 1px solid rgba(255, 107, 107, 0.34);
    border-radius: 8px;
    background: rgba(85, 15, 25, 0.30);
    color: #ffb4bd;
    font-size: 12px;
    line-height: 1.35;
    text-align: center;
  }

  .vs-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
  }

  .vs-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: white;
    border-radius: 50%;
    animation: vs-spin 700ms linear infinite;
  }

  .vs-footer {
    position: relative;
    z-index: 3;
    margin-top: 21px;
    text-align: center;
    color: rgba(174, 207, 224, 0.56);
    font-size: 9px;
    letter-spacing: 0.12em;
  }

  @keyframes vs-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 720px) {
    .vs-card-wrap {
      padding: 16px;
    }

    .vs-card {
      width: min(410px, calc(100vw - 28px));
      padding: 31px 24px 23px;
      border-radius: 17px;
    }

    .vs-brand {
    position: relative;
    z-index: 2;
    margin: 0;
    text-align: center;
    font-size: clamp(31px, 4vw, 39px);
    line-height: 1;
    font-weight: 800;
    letter-spacing: -1.7px;
    color: #38bdf8;
    background: linear-gradient(
      180deg,
      #e0f7ff 0%,
      #7dd3fc 28%,
      #38bdf8 58%,
      #0284c7 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter:
      drop-shadow(0 0 4px rgba(56, 189, 248, 0.22))
      drop-shadow(0 0 12px rgba(14, 165, 233, 0.14));
  }

    .vs-watermark span {
      font-size: 42px;
    }

    .vs-candle-field {
      opacity: 0.40;
    }

    .vs-network {
      height: 52%;
    }

    .vs-biometric-row {
      gap: 8px;
    }

    .vs-secondary-action {
      font-size: 11px;
    }
  }

  @media (max-height: 720px) and (min-width: 600px) {
    .vs-card {
      transform: scale(0.88);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .vs-spinner {
      animation: none;
    }

    .vs-tab,
    .vs-login-button,
    .vs-secondary-action,
    .vs-admin-button {
      transition: none;
    }
  }
`}</style>
                  <div className="vs-cosmic-layer" aria-hidden="true">
        <div className="vs-nebula vs-nebula-a" />
        <div className="vs-nebula vs-nebula-b" />

        <div className="vs-stars">
          {Array.from({ length: 260 }, (_, index) => {
            const column = index % 20;
            const row = Math.floor(index / 20);

            return (
              <span
                key={index}
                className="vs-star"
                style={{
                  left: `${(column * 5.15 + (row * 1.73) % 4.8) - 1}%`,
                  top: `${(row * 10.9 + (column * 2.17) % 7.5) - 2}%`,
                  width: `${index % 17 === 0 ? 2 : index % 5 === 0 ? 1.4 : 0.8}px`,
                  height: `${index % 17 === 0 ? 2 : index % 5 === 0 ? 1.4 : 0.8}px`,
                  opacity:
                    index % 13 === 0
                      ? 0.98
                      : index % 5 === 0
                        ? 0.72
                        : 0.38,
                }}
              />
            );
          })}
        </div>

        <div className="vs-watermark left" aria-hidden="true">
          <span>VOLSIM-PRO</span>
          <span>VOLSIM-PRO</span>
          <span>VOLSIM-PRO</span>
        </div>

        <div className="vs-watermark right" aria-hidden="true">
          <span>VOLSIM-PRO</span>
          <span>VOLSIM-PRO</span>
          <span>VOLSIM-PRO</span>
        </div>

        <div className="vs-ray vs-ray-1" />
        <div className="vs-ray vs-ray-2" />

        
  <svg
    className="vs-candle-field"
    viewBox="0 0 1440 900"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="vs-chart-glow" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00bfff" stopOpacity="0.16" />
        <stop offset="45%" stopColor="#00bfff" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.60" />
      </linearGradient>

      <filter id="vs-chart-blur">
        <feGaussianBlur stdDeviation="5" />
      </filter>

      <filter id="vs-candle-glow">
        <feGaussianBlur stdDeviation="1.8" />
      </filter>
    </defs>

    {/* Subtle chart grid */}
    <g opacity="0.075" stroke="#38bdf8" strokeWidth="1">
      {Array.from({ length: 13 }, (_, index) => {
        const y = index * 75;
        return <line key={`h-${index}`} x1="0" y1={y} x2="1440" y2={y} />;
      })}

      {Array.from({ length: 19 }, (_, index) => {
        const x = index * 80;
        return <line key={`v-${index}`} x1={x} y1="0" x2={x} y2="900" />;
      })}
    </g>

    {/* Soft diagonal market-energy trail */}
    <path
      d="M -40 835
         C 120 790, 170 820, 270 735
         S 430 700, 520 620
         S 690 570, 790 485
         S 940 430, 1030 340
         S 1190 285, 1480 55"
      fill="none"
      stroke="url(#vs-chart-glow)"
      strokeWidth="24"
      opacity="0.34"
      filter="url(#vs-chart-blur)"
    />

    {/* Main historical-style price path */}
    <path
      d="M -40 835
         C 120 790, 170 820, 270 735
         S 430 700, 520 620
         S 690 570, 790 485
         S 940 430, 1030 340
         S 1190 285, 1480 55"
      fill="none"
      stroke="#38bdf8"
      strokeWidth="1.4"
      opacity="0.30"
    />

    {/* Dense historical OHLC candle series */}
    <g>
      {Array.from({ length: 260 }, (_, index) => {
        const x = -20 + index * 8.25;

        const trend = 820 - index * 4.15;

        const waveA =
          Math.sin(index * 0.34) * 25 +
          Math.sin(index * 0.91) * 13;

        const waveB =
          Math.sin(index * 0.17 + 1.7) * 18;

        const center = trend + waveA + waveB;

        const previousCenter =
          index === 0
            ? center + 8
            : 820 -
              (index - 1) * 4.15 +
              Math.sin((index - 1) * 0.34) * 25 +
              Math.sin((index - 1) * 0.91) * 13 +
              Math.sin((index - 1) * 0.17 + 1.7) * 18;

        const open = previousCenter;

        const movement =
          Math.sin(index * 1.37) * 16 +
          Math.cos(index * 0.53) * 9;

        const close = center + movement;

        const bodyTop = Math.min(open, close);
        const bodyBottom = Math.max(open, close);

        const bodyHeight = Math.max(3, bodyBottom - bodyTop);

        const wickTop =
          bodyTop -
          (8 + Math.abs(Math.sin(index * 0.73)) * 20);

        const wickBottom =
          bodyBottom +
          (8 + Math.abs(Math.cos(index * 0.61)) * 18);

        const bullish = close < open;

        const opacity =
          0.42 + (index / 180) * 0.48;

        return (
          <g
            key={`candle-${index}`}
            opacity={opacity}
          >
            {/* wick */}
            <line
              x1={x + 2.5}
              y1={wickTop}
              x2={x + 2.5}
              y2={wickBottom}
              stroke={bullish ? "#67e8f9" : "#38bdf8"}
              strokeWidth="1.2"
            />

            {/* subtle candle glow */}
            <rect
              x={x}
              y={bodyTop}
              width="5"
              height={bodyHeight}
              rx="0.8"
              fill={bullish ? "#67e8f9" : "#0ea5e9"}
              opacity="0.32"
              filter="url(#vs-candle-glow)"
            />

            {/* candle body */}
            <rect
              x={x}
              y={bodyTop}
              width="5"
              height={bodyHeight}
              rx="0.7"
              fill={bullish ? "#67e8f9" : "#0ea5e9"}
            />
          </g>
        );
      })}
    </g>

    {/* Recent-price highlight toward upper-right */}
    <circle
      cx="1410"
      cy="80"
      r="5"
      fill="#a5f3fc" opacity="0.95"
    />

    <circle
      cx="1410"
      cy="80"
      r="16"
      fill="none"
      stroke="#22d3ee"
      strokeWidth="1"
      opacity="0.28"
    />
  </svg>

        {/* COSMIC MOUNTAIN-NET TERRAIN — responsive bottom horizon */}
        <svg
          className="vs-cosmic-mountain-net"
          viewBox="0 0 1440 620"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* deep atmospheric terrain — large rising/falling mountain levels */}
          <g className="vs-cmn-deep">
            <path d="M0 585 C70 535 125 548 195 492 C270 432 335 458 405 405 C480 348 540 390 615 335 C690 280 755 330 830 286 C910 238 975 292 1050 250 C1135 202 1200 255 1275 214 C1340 178 1390 205 1440 170" />
            <path d="M0 605 C85 558 150 575 220 525 C295 470 350 490 430 440 C505 390 575 425 650 375 C730 320 795 365 870 325 C950 282 1015 330 1090 290 C1170 247 1240 292 1315 250 C1370 220 1410 230 1440 215" />
            <path d="M0 620 C80 595 145 600 225 565 C305 530 370 540 445 505 C525 468 590 485 665 450 C745 412 815 432 890 398 C970 360 1035 390 1110 360 C1190 328 1255 350 1330 320 C1380 300 1415 302 1440 294" />
          </g>

          {/* mid terrain — offset phases create a natural woven landscape */}
          <g className="vs-cmn-mid">
            <path d="M0 560 C65 510 130 525 205 470 C280 415 345 430 420 375 C495 320 560 355 635 300 C710 245 780 292 855 250 C935 205 995 255 1070 212 C1150 168 1215 215 1290 175 C1355 142 1405 165 1440 135" />
            <path d="M0 575 C80 535 145 550 225 500 C300 452 365 465 440 420 C520 370 585 398 665 350 C745 300 815 338 895 292 C975 247 1040 285 1120 245 C1195 205 1260 245 1335 205 C1385 178 1415 188 1440 180" />
            <path d="M0 590 C75 560 145 565 220 535 C300 502 370 510 450 475 C530 438 595 455 675 420 C755 385 820 402 900 365 C980 330 1050 350 1130 320 C1210 290 1270 310 1345 280 C1395 260 1420 265 1440 260" />
          </g>

          {/* bright mountain ridges — sparse radiant structure */}
          <g className="vs-cmn-bright">
            <path d="M0 545 C75 492 138 505 212 452 C285 400 350 415 425 360 C500 305 565 338 640 286 C715 234 780 278 855 236 C935 190 1000 238 1075 195 C1150 153 1215 198 1290 160 C1350 130 1405 150 1440 120" />
            <path d="M60 580 C130 535 195 545 265 495 C335 445 405 455 475 410 C545 365 615 385 685 340 C755 295 825 310 895 270 C970 228 1035 250 1105 220 C1180 188 1245 215 1315 185 C1370 162 1410 172 1440 165" />
          </g>

          {/* curved vertical terrain ribs — gives the landscape depth */}
          <g className="vs-cmn-ribs">
            <path d="M95 620 C125 560 135 505 155 440 C175 375 185 325 205 265" />
            <path d="M245 620 C275 555 295 495 320 430 C345 365 370 315 395 255" />
            <path d="M410 620 C445 555 465 500 495 435 C525 370 550 320 580 250" />
            <path d="M585 620 C620 555 650 495 675 430 C700 365 730 310 755 245" />
            <path d="M765 620 C800 555 830 500 855 435 C885 370 910 315 940 250" />
            <path d="M945 620 C980 555 1010 500 1040 430 C1070 365 1095 315 1120 255" />
            <path d="M1125 620 C1160 555 1185 500 1215 435 C1245 370 1270 320 1295 270" />
            <path d="M1290 620 C1320 565 1340 510 1360 450 C1380 390 1400 350 1420 310" />
          </g>

          {/* fine cosmic net — tiny woven currents across the terrain */}
          <g className="vs-cmn-net">
            <path d="M0 535 C90 500 165 520 250 480 C330 442 405 455 490 415 C575 375 650 392 735 350 C820 310 900 325 985 285 C1070 245 1145 265 1230 225 C1310 190 1375 205 1440 185" />
            <path d="M0 552 C85 520 170 535 255 500 C340 465 420 478 505 440 C590 402 675 420 760 382 C845 344 925 355 1010 318 C1095 280 1175 295 1260 260 C1340 228 1390 240 1440 225" />
            <path d="M25 575 C105 545 185 560 270 530 C350 500 435 510 520 475 C605 440 685 452 770 420 C855 388 940 395 1025 365 C1110 335 1190 345 1275 315 C1350 288 1400 300 1440 292" />
            <path d="M20 600 C100 575 180 585 260 560 C345 535 425 545 510 515 C595 485 680 495 765 465 C850 435 935 442 1020 415 C1105 388 1190 395 1275 370 C1350 348 1405 355 1440 350" />

            <path d="M130 610 C210 575 285 535 350 470 C415 405 470 350 530 285" />
            <path d="M330 620 C395 565 455 505 515 440 C575 375 635 320 700 265" />
            <path d="M540 620 C600 565 660 505 720 440 C780 375 840 325 900 275" />
            <path d="M760 620 C820 560 880 505 940 440 C1000 375 1060 325 1120 280" />
            <path d="M980 620 C1040 565 1100 510 1160 450 C1220 390 1280 345 1340 305" />
            <path d="M1190 620 C1250 575 1310 530 1360 475 C1400 430 1420 400 1440 375" />
          </g>

          {/* tiny radiant cosmic nodes */}
          <g className="vs-cmn-stars">
            <circle cx="155" cy="440" r="1.8" />
            <circle cx="320" cy="430" r="1.4" />
            <circle cx="395" cy="360" r="1.9" />
            <circle cx="495" cy="415" r="1.5" />
            <circle cx="580" cy="250" r="2.0" />
            <circle cx="675" cy="420" r="1.5" />
            <circle cx="755" cy="245" r="2.1" />
            <circle cx="855" cy="310" r="1.6" />
            <circle cx="940" cy="250" r="2.0" />
            <circle cx="1040" cy="430" r="1.5" />
            <circle cx="1120" cy="255" r="2.1" />
            <circle cx="1215" cy="435" r="1.5" />
            <circle cx="1295" cy="270" r="2.0" />
            <circle cx="1360" cy="450" r="1.5" />
          </g>
        </svg>

        {/* COSMIC MOUNTAIN-NET TERRAIN — responsive bottom horizon */}
        
      </div>

      <div className="vs-card-wrap">
        <section
          className="vs-card"
          aria-label="VOLSIM-PRO authentication"
        >
          <h1 className="vs-brand">VOLSIM-PRO</h1>

          <div className="vs-ai-subtitle">
            AI trading infrastructure
          </div>

          <div className="vs-divider" />

          <div
            className="vs-tabs"
            role="tablist"
            aria-label="Authentication"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'login'}
              className={`vs-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('login');
                setLocalError('');
              }}
            >
              Log In
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signup'}
              className={`vs-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('signup');
                setLocalError('');
              }}
            >
              Sign Up
            </button>
          </div>

          <form className="vs-form" onSubmit={handleSubmit}>
            <div className="vs-field">
              <Mail
                className="vs-field-icon"
                aria-hidden="true"
              />

              <input
                className="vs-input"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                aria-label="Email address"
              />
            </div>

            <div className="vs-field">
              <LockKeyhole
                className="vs-field-icon"
                aria-hidden="true"
              />

              <input
                className="vs-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete={
                  activeTab === 'signup'
                    ? 'new-password'
                    : 'current-password'
                }
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                aria-label="Password"
              />

              <button
                type="button"
                className="vs-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </button>
            </div>

            <button
              className="vs-login-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="vs-loading">
                  <span className="vs-spinner" />
                  {activeTab === 'signup'
                    ? 'Creating Account...'
                    : 'Signing In...'}
                </span>
              ) : activeTab === 'signup' ? (
                'Sign Up'
              ) : (
                'Log In'
              )}
            </button>

            {localError && (
              <div className="vs-error" role="alert">
                {localError}
              </div>
            )}
          </form>

          <div className="vs-biometric-row">
            <button
              type="button"
              className="vs-secondary-action"
              onClick={handleBiometric}
            >
              <Fingerprint aria-hidden="true" />
              <span>Biometric Login</span>
            </button>

            <span
              className="vs-bottom-divider"
              aria-hidden="true"
            />

            <button
              type="button"
              className="vs-secondary-action"
              onClick={handleForgotPassword}
            >
              <span>Forgot Password?</span>
            </button>
          </div>

          <button
            type="button"
            className="vs-admin-button"
            onClick={handleAdminPortal}
          >
            <Shield aria-hidden="true" />
            <span>Admin Portal</span>
          </button>

          <div className="vs-footer">
            Secure • Reliable • Global
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginScreen;






















































































