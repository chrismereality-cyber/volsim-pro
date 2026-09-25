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
    color: #67e8f9;
    text-shadow:
      0 0 9px rgba(34, 211, 238, 0.75),
      0 0 22px rgba(0, 180, 255, 0.38);
  }

  .vs-ai-subtitle {
    position: relative;
    z-index: 2;
    margin-top: 8px;
    text-align: center;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.19em;
    text-transform: lowercase;
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
      font-size: 31px;
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
          className="vs-network"
          viewBox="0 0 1440 720"
          preserveAspectRatio="none"
        >
          <path className="vs-network-line" d="M0 620 L120 540 L220 610 L340 470 L455 535 L560 420 L690 500 L790 370 L930 465 L1050 350 L1170 440 L1300 320 L1440 390" />
          <path className="vs-network-line" d="M0 680 L150 600 L270 650 L390 555 L520 610 L640 515 L760 570 L900 455 L1030 525 L1150 430 L1290 485 L1440 410" />
          <path className="vs-network-line-bright" d="M0 590 L145 565 L245 500 L370 530 L490 440 L610 485 L730 400 L860 450 L980 375 L1110 410 L1235 330 L1440 360" />

          <path className="vs-network-line" d="M80 720 L210 545 L370 720" />
          <path className="vs-network-line" d="M260 720 L430 475 L590 720" />
          <path className="vs-network-line" d="M520 720 L690 430 L870 720" />
          <path className="vs-network-line" d="M820 720 L990 405 L1160 720" />
          <path className="vs-network-line" d="M1080 720 L1240 380 L1410 720" />

          <path className="vs-network-line" d="M80 610 L260 610 L370 530 L520 610 L690 500 L860 570 L980 455 L1150 520 L1300 430" />



          {/* Fine holographic sea-wave mesh woven between the major mountain peaks */}
          <g className="vs-network-fine-mesh">
    <path className="vs-network-fine-mesh-bright" d="M0 430 Q30 436 60 442.3 Q90 442 120 441.1 Q150 439 180 436.2 Q210 437 240 437.1 Q270 435 300 433.4 Q330 427 360 420.1 Q390 417 420 413.4 Q450 417 480 421.5 Q510 426 540 429.7 Q570 430 600 430.4 Q630 433 660 435.1 Q690 440 720 444.9 Q750 444 780 443.7 Q810 437 840 430.2 Q870 426 900 422.2 Q930 423 960 423.5 Q990 422 1020 421.3 Q1050 419 1080 417.2 Q1110 421 1140 425.1 Q1170 432 1200 439.8 Q1230 442 1260 443.3 Q1290 440 1320 437.2 Q1350 436 1380 435.8 Q1410 436 1440 435.4" />
    <path className="vs-network-fine-mesh-deep" d="M0 452.5 Q30 454 60 456.4 Q90 452 120 446.8 Q150 446 180 444.2 Q210 444 240 444.5 Q270 438 300 431.5 Q330 424 360 417.3 Q390 420 420 423.2 Q450 431 480 438.3 Q510 440 540 442 Q570 442 600 442.5 Q630 448 660 453.2 Q690 456 720 458.5 Q750 451 780 443.7 Q810 436 840 427.6 Q870 428 900 427.7 Q930 429 960 430.5 Q990 428 1020 425 Q1050 427 1080 428.1 Q1110 438 1140 446.9 Q1170 452 1200 458 Q1230 454 1260 450.3 Q1290 447 1320 443.2 Q1350 444 1380 444.4 Q1410 441 1440 436.9" />
    <path className="vs-network-fine-mesh-deep" d="M0 472 Q30 467 60 461.1 Q90 456 120 450.8 Q150 452 180 452.5 Q210 448 240 444.5 Q270 435 300 424.8 Q330 424 360 423.2 Q390 433 420 443.3 Q450 449 480 455 Q510 454 540 452.6 Q570 456 600 459.1 Q630 465 660 470.5 Q690 465 720 460.2 Q750 448 780 436.1 Q810 433 840 429.5 Q870 433 900 437.4 Q930 436 960 435.6 Q990 434 1020 432.7 Q1050 441 1080 450.2 Q1110 460 1140 470.8 Q1170 469 1200 466.9 Q1230 460 1260 452.1 Q1290 451 1320 450.4 Q1350 450 1380 448.7 Q1410 440 1440 431.2" />
    <path className="vs-network-fine-mesh-deep" d="M0 479.2 Q30 470 60 459.8 Q90 458 120 457 Q150 457 180 456.3 Q210 447 240 436.8 Q270 431 300 424.5 Q330 434 360 443.7 Q390 455 420 466.6 Q450 467 480 466.6 Q510 466 540 465.3 Q570 472 600 478.3 Q630 478 660 477.1 Q690 463 720 449.5 Q750 440 780 431.3 Q810 436 840 440.1 Q870 444 900 446.9 Q930 444 960 441.2 Q990 446 1020 451.7 Q1050 465 1080 479 Q1110 482 1140 485 Q1170 475 1200 465.2 Q1230 460 1260 454.7 Q1290 456 1320 457.1 Q1350 451 1380 444.7 Q1410 435 1440 425.7" />
    <path className="vs-network-fine-mesh-mid" d="M0 479.3 Q30 473 60 465.9 Q90 462 120 457.9 Q150 452 180 446.3 Q210 442 240 436.8 Q270 441 300 445.5 Q330 456 360 466.6 Q390 473 420 479.5 Q450 481 480 482.4 Q510 484 540 485.6 Q570 484 600 483.2 Q630 474 660 465.1 Q690 455 720 444.5 Q750 442 780 440.2 Q810 444 840 447.4 Q870 450 900 453.2 Q930 458 960 463 Q990 472 1020 481.8 Q1050 488 1080 493.3 Q1110 489 1140 484.5 Q1170 476 1200 468.5 Q1230 464 1260 459.2 Q1290 455 1320 450.2 Q1350 444 1380 438.8 Q1410 440 1440 440.8" />
    <path className="vs-network-fine-mesh-deep" d="M0 469.6 Q30 470 60 470.1 Q90 470 120 469.7 Q150 464 180 459.1 Q210 458 240 457.6 Q270 466 300 473.6 Q330 479 360 484.9 Q390 483 420 480.6 Q450 480 480 478.8 Q510 482 540 484.7 Q570 482 600 479.3 Q630 471 660 461.8 Q690 459 720 456.5 Q750 462 780 466.7 Q810 469 840 471.1 Q870 470 900 468.4 Q930 473 960 476.9 Q990 484 1020 490.7 Q1050 489 1080 487.3 Q1110 480 1140 472.2 Q1170 470 1200 468 Q1230 469 1260 470.7 Q1290 467 1320 463.3 Q1350 460 1380 456.2 Q1410 462 1440 467.5" />
    <path className="vs-network-fine-mesh-deep" d="M0 473.5 Q30 476 60 477.9 Q90 474 120 469.9 Q150 466 180 461.3 Q210 468 240 475.5 Q270 486 300 496.3 Q330 496 360 496.1 Q390 492 420 487.6 Q450 490 480 491.7 Q510 492 540 492.7 Q570 483 600 473.9 Q630 466 660 458.9 Q690 464 720 468.4 Q750 475 780 481.2 Q810 480 840 479.3 Q870 481 900 482 Q930 491 960 499.1 Q990 502 1020 504 Q1050 495 1080 485.6 Q1110 479 1140 472.2 Q1170 474 1200 476.1 Q1230 475 1260 474.3 Q1290 469 1320 463 Q1350 466 1380 468.5 Q1410 480 1440 491.1" />
    <path className="vs-network-fine-mesh-deep" d="M0 482 Q30 482 60 481.7 Q90 475 120 469 Q150 472 180 475.6 Q210 489 240 503 Q270 508 300 513.1 Q330 507 360 500.3 Q390 499 420 496.8 Q450 500 480 502.8 Q510 496 540 489 Q570 477 600 465 Q630 466 660 467.1 Q690 478 720 487.9 Q750 490 780 492.9 Q810 491 840 489.5 Q870 497 900 503.8 Q930 511 960 518.2 Q990 511 1020 503.2 Q1050 491 1080 479 Q1110 478 1140 477.9 Q1170 481 1200 483.8 Q1230 479 1260 473.8 Q1290 472 1320 470.5 Q1350 482 1380 493.9 Q1410 504 1440 514" />
    <path className="vs-network-fine-mesh-mid" d="M0 483.1 Q30 482 60 480.7 Q90 483 120 485.3 Q150 495 180 504 Q210 512 240 520.1 Q270 520 300 519.1 Q330 515 360 511.1 Q390 509 420 506.3 Q450 501 480 496.4 Q510 488 540 479.4 Q570 476 600 473.4 Q630 480 660 485.6 Q690 493 720 499.5 Q750 503 780 505.8 Q810 510 840 513.7 Q870 518 900 522.5 Q930 519 960 516.4 Q990 507 1020 496.7 Q1050 490 1080 483.7 Q1110 483 1140 482.8 Q1170 482 1200 482 Q1230 482 1260 483 Q1290 490 1320 497.5 Q1350 507 1380 517 Q1410 519 1440 521.6" />
    <path className="vs-network-fine-mesh-deep" d="M0 490.1 Q30 490 60 490.4 Q90 499 120 507.1 Q150 519 180 530.7 Q210 533 240 534.7 Q270 528 300 521.8 Q330 518 360 513.7 Q390 511 420 507.7 Q450 499 480 490.4 Q510 484 540 476.7 Q570 482 600 487.1 Q630 498 660 508.2 Q690 513 720 517.3 Q750 519 780 521.2 Q810 526 840 531.4 Q870 532 900 531.6 Q930 521 960 510.2 Q990 500 1020 488.9 Q1050 488 1080 487 Q1110 489 1140 491 Q1170 491 1200 490.3 Q1230 495 1260 500.4 Q1290 512 1320 524.4 Q1350 531 1380 536.8 Q1410 532 1440 526.5" />
    <path className="vs-network-fine-mesh-deep" d="M0 507.1 Q30 508 60 508.4 Q90 518 120 527.3 Q150 532 180 536.1 Q210 529 240 522.8 Q270 518 300 513.7 Q330 516 360 518.7 Q390 517 420 514.5 Q450 506 480 498.5 Q510 499 540 499.3 Q570 509 600 518.3 Q630 522 660 525.9 Q690 522 720 519 Q750 521 780 522.7 Q810 528 840 532.8 Q870 528 900 523.4 Q930 513 960 503.2 Q990 502 1020 501.7 Q1050 507 1080 512.6 Q1110 512 1140 510.9 Q1170 509 1200 506.2 Q1230 513 1260 520.2 Q1290 528 1320 536.1 Q1350 532 1380 528.9 Q1410 522 1440 514.3" />
    <path className="vs-network-fine-mesh-deep" d="M0 514.1 Q30 522 60 530.6 Q90 540 120 549.8 Q150 545 180 540.7 Q210 531 240 521.6 Q270 522 300 522.2 Q330 524 360 525.4 Q390 518 420 509.7 Q450 505 480 500.5 Q510 510 540 519.8 Q570 529 600 538.9 Q630 536 660 533.8 Q690 531 720 529.1 Q750 535 780 540.5 Q810 540 840 539.5 Q870 527 900 515.1 Q930 509 960 502.4 Q990 509 1020 515.3 Q1050 519 1080 522.8 Q1110 519 1140 515.4 Q1170 519 1200 522.9 Q1230 534 1260 545.5 Q1290 546 1320 547.2 Q1350 537 1380 526.5 Q1410 523 1440 518.8" />
    <path className="vs-network-fine-mesh-mid" d="M0 538.8 Q30 546 60 553.3 Q90 554 120 554.3 Q150 547 180 540.4 Q210 535 240 529.5 Q270 528 300 525.9 Q330 522 360 518.8 Q390 516 420 512.6 Q450 517 480 522 Q510 531 540 540.3 Q570 544 600 548.3 Q630 547 660 546.6 Q690 547 720 547.3 Q750 546 780 545 Q810 537 840 529.8 Q870 522 900 514.1 Q930 514 960 514.7 Q990 519 1020 524 Q1050 526 1080 528.6 Q1110 532 1140 535 Q1170 542 1200 549.2 Q1230 553 1260 556.2 Q1290 551 1320 545.4 Q1350 538 1380 531.2 Q1410 529 1440 526.1" />
    <path className="vs-network-fine-mesh-bright" d="M0 561.1 Q30 565 60 569.5 Q90 562 120 554.7 Q150 546 180 536.3 Q210 534 240 531.8 Q270 530 300 528.8 Q330 524 360 519.8 Q390 522 420 523.8 Q450 535 480 546.2 Q510 554 540 561.9 Q570 560 600 558.9 Q630 557 660 555.1 Q690 555 720 555.7 Q750 550 780 543.6 Q810 533 840 521.7 Q870 519 900 516.1 Q930 523 960 529.4 Q990 534 1020 539.1 Q1050 541 1080 542.5 Q1110 549 1140 555.2 Q1170 562 1200 569 Q1230 565 1260 561.4 Q1290 551 1320 540.4 Q1350 536 1380 530.9 Q1410 531 1440 530.2" />
    <path className="vs-network-fine-mesh-deep" d="M0 581.9 Q30 577 60 572.1 Q90 559 120 545.9 Q150 540 180 535.1 Q210 536 240 536.9 Q270 534 300 530.1 Q330 528 360 526.9 Q390 538 420 548.1 Q450 561 480 573.6 Q510 574 540 574.6 Q570 569 600 564 Q630 564 660 563.1 Q690 560 720 557.2 Q750 545 780 533.4 Q810 526 840 518 Q870 524 900 531 Q930 540 960 549.2 Q990 551 1020 553.1 Q1050 557 1080 560.4 Q1110 569 1140 578 Q1170 578 1200 578.4 Q1230 566 1260 553.7 Q1290 544 1320 534.9 Q1350 535 1380 535.6 Q1410 535 1440 533.8" />
    <path className="vs-network-fine-mesh-deep" d="M0 578.5 Q30 568 60 557 Q90 551 120 544.5 Q150 549 180 554.3 Q210 555 240 556.4 Q270 550 300 544.3 Q330 547 360 549.5 Q390 561 420 573 Q450 576 480 578 Q510 570 540 562.4 Q570 561 600 559.5 Q630 564 660 568 Q690 563 720 557.6 Q750 548 780 538 Q810 541 840 543.2 Q870 553 900 563.3 Q930 564 960 564.7 Q990 561 1020 557.2 Q1050 563 1080 568.3 Q1110 574 1140 580.3 Q1170 573 1200 565.5 Q1230 555 1260 545.2 Q1290 547 1320 549.1 Q1350 554 1380 558.2 Q1410 554 1440 549" />
    <path className="vs-network-fine-mesh-mid" d="M0 573.3 Q30 566 60 557.7 Q90 556 120 554.6 Q150 556 180 557.8 Q210 557 240 556.6 Q270 558 300 560 Q330 568 360 575 Q390 581 420 586.2 Q450 584 480 581.5 Q510 577 540 572.8 Q570 572 600 570.3 Q630 567 660 564.2 Q690 558 720 551.6 Q750 550 780 549 Q810 555 840 561.7 Q870 567 900 572.8 Q930 574 960 574.6 Q990 577 1020 578.5 Q1050 582 1080 584.6 Q1110 581 1140 578.3 Q1170 570 1200 561.6 Q1230 558 1260 553.5 Q1290 555 1320 556.8 Q1350 557 1380 557.9 Q1410 558 1440 558.2" />
    <path className="vs-network-fine-mesh-deep" d="M0 566.8 Q30 562 60 557.3 Q90 560 120 563.7 Q150 565 180 566.3 Q210 566 240 565.9 Q270 573 300 579.5 Q330 589 360 598 Q390 598 420 597.3 Q450 590 480 582.9 Q510 580 540 576.7 Q570 576 600 574.4 Q630 568 660 561.6 Q690 557 720 552 Q750 558 780 564 Q810 573 840 582.8 Q870 585 900 587.2 Q930 587 960 586.6 Q990 590 1020 593.7 Q1050 593 1080 592.9 Q1110 583 1140 573.7 Q1170 566 1200 557.4 Q1230 559 1260 560.5 Q1290 564 1320 567.1 Q1350 567 1380 566.2 Q1410 570 1440 573.7" />
    <path className="vs-network-fine-mesh-deep" d="M0 560.5 Q30 563 60 566 Q90 571 120 576 Q150 576 180 575 Q210 579 240 582.9 Q270 594 300 605.8 Q330 610 360 614 Q390 605 420 596.8 Q450 590 480 582.2 Q510 582 540 581.6 Q570 578 600 573.6 Q630 566 660 558.3 Q690 561 720 564 Q750 577 780 589.3 Q810 595 840 601.6 Q870 599 900 597.3 Q930 599 960 600.2 Q990 603 1020 605.3 Q1050 597 1080 589.1 Q1110 577 1140 564 Q1170 563 1200 561.3 Q1230 568 1260 574.1 Q1290 576 1320 577 Q1350 578 1380 578.9 Q1410 588 1440 598.1" />
    <path className="vs-network-fine-mesh-deep" d="M0 565.3 Q30 574 60 582.6 Q90 585 120 587.2 Q150 588 180 588.3 Q210 599 240 609.4 Q270 619 300 628.4 Q330 622 360 614.8 Q390 602 420 590 Q450 588 480 585.3 Q510 585 540 584.5 Q570 577 600 568.9 Q630 567 660 564.7 Q690 578 720 590.9 Q750 603 780 615 Q810 614 840 612.2 Q870 609 900 606.7 Q930 610 960 613.6 Q990 610 1020 605.4 Q1050 590 1080 575.5 Q1110 568 1140 561.5 Q1170 569 1200 576.8 Q1230 583 1260 588.8 Q1290 588 1320 587.8 Q1350 594 1380 600.8 Q1410 613 1440 624.8" />
    <path className="vs-network-fine-mesh-mid" d="M0 593.7 Q30 597 60 600.5 Q90 601 120 600.9 Q150 604 180 606.9 Q210 612 240 617.5 Q270 617 300 616.2 Q330 610 360 603.1 Q390 600 420 596 Q450 596 480 596.8 Q510 595 540 593 Q570 591 600 588.3 Q630 592 660 596.6 Q690 604 720 611.2 Q750 613 780 614.4 Q810 612 840 609.4 Q870 609 900 609.5 Q930 609 960 609 Q990 603 1020 597.4 Q1050 592 1080 586.3 Q1110 588 1140 590.2 Q1170 595 1200 599.6 Q1230 601 1260 601.6 Q1290 603 1320 604.2 Q1350 609 1380 614.3 Q1410 616 1440 618.4" />
    <path className="vs-network-fine-mesh-deep" d="M0 609.4 Q30 611 60 611.8 Q90 613 120 613.6 Q150 620 180 626.1 Q210 629 240 631.3 Q270 624 300 616.4 Q330 609 360 601.4 Q390 602 420 601.8 Q450 602 480 602.5 Q510 599 540 595.5 Q570 597 600 599.2 Q630 609 660 618.5 Q690 624 720 629 Q750 625 780 621.9 Q810 619 840 616.9 Q870 618 900 618.8 Q930 614 960 610 Q990 601 1020 592.7 Q1050 592 1080 591.3 Q1110 599 1140 605.8 Q1170 609 1200 613.1 Q1230 613 1260 612.6 Q1290 617 1320 621.2 Q1350 626 1380 631.5 Q1410 627 1440 622.8" />
    <path className="vs-network-fine-mesh-deep" d="M0 624.6 Q30 624 60 622.7 Q90 627 120 631.8 Q150 638 180 644.1 Q210 639 240 633.1 Q270 621 300 609.6 Q330 607 360 604 Q390 607 420 610.3 Q450 608 480 605.8 Q510 604 540 603 Q570 612 600 621.8 Q630 632 660 642.1 Q690 640 720 638 Q750 632 780 625.3 Q810 625 840 625.5 Q870 624 900 622.6 Q930 613 960 603.2 Q990 598 1020 592.6 Q1050 600 1080 608 Q1110 616 1140 624.5 Q1170 624 1200 624.3 Q1230 626 1260 627.2 Q1290 634 1320 641 Q1350 640 1380 639.4 Q1410 628 1440 616.2" />
    <path className="vs-network-fine-mesh-deep" d="M0 635.7 Q30 636 60 637.3 Q90 645 120 652.5 Q150 652 180 650.5 Q210 637 240 622.6 Q270 614 300 605.8 Q330 610 360 614 Q390 616 420 617.4 Q450 614 480 610.5 Q510 617 540 622.8 Q570 637 600 650.8 Q630 653 660 656.1 Q690 647 720 637.7 Q750 634 780 629.9 Q810 631 840 632.2 Q870 625 900 617 Q930 607 960 597.2 Q990 602 1020 606.8 Q1050 620 1080 632.5 Q1110 636 1140 639 Q1170 637 1200 635.3 Q1230 641 1260 646.7 Q1290 650 1320 654.2 Q1350 643 1380 632.7 Q1410 620 1440 607.2" />
    <path className="vs-network-fine-mesh-mid" d="M0 653.4 Q30 656 60 658.9 Q90 658 120 657.5 Q150 648 180 639.1 Q210 629 240 618.5 Q270 616 300 613.8 Q330 616 360 618.8 Q390 621 420 622.8 Q450 628 480 632.8 Q510 643 540 652.9 Q570 659 600 665 Q630 661 660 657.2 Q690 650 720 643.1 Q750 639 780 634.4 Q810 629 840 623.7 Q870 617 900 610.6 Q930 611 960 611.9 Q990 621 1020 630.7 Q1050 639 1080 647.5 Q1110 650 1140 653 Q1170 655 1200 656.9 Q1230 658 1260 658.9 Q1290 652 1320 646 Q1350 635 1380 623.4 Q1410 618 1440 612.7" />
    <path className="vs-network-fine-mesh-deep" d="M0 651.7 Q30 655 60 658.5 Q90 655 120 652.2 Q150 643 180 634.4 Q210 632 240 629.8 Q270 634 300 639.2 Q330 640 360 641.6 Q390 640 420 638.9 Q450 644 480 648.9 Q510 656 540 663 Q570 661 600 659.3 Q630 652 660 645.1 Q690 644 720 642.2 Q750 643 780 644 Q810 639 840 634.8 Q870 631 900 627.7 Q930 634 960 639.4 Q990 647 1020 654.7 Q1050 654 1080 654.3 Q1110 652 1140 650.3 Q1170 653 1200 656 Q1230 656 1260 656.1 Q1290 648 1320 640 Q1350 634 1380 628.6 Q1410 632 1440 635.4" />
    <path className="vs-network-fine-mesh-bright" d="M0 666.1 Q30 666 60 666.3 Q90 656 120 646.4 Q150 639 180 631.9 Q210 637 240 641.4 Q270 647 300 652 Q330 650 360 648.9 Q390 651 420 653.3 Q450 663 480 671.9 Q510 674 540 676.2 Q570 667 600 658.1 Q630 652 660 646.5 Q690 648 720 650.3 Q750 648 780 646.2 Q810 640 840 633.7 Q870 637 900 640.2 Q930 651 960 662.6 Q990 666 1020 669.8 Q1050 666 1080 661.3 Q1110 662 1140 662.3 Q1170 665 1200 667.8 Q1230 661 1260 654.2 Q1290 644 1320 633.9 Q1350 635 1380 635.9 Q1410 643 1440 650.4" />
    <path className="vs-network-fine-mesh-deep" d="M0 677.6 Q30 670 60 661.8 Q90 650 120 637.5 Q150 639 180 640.4 Q210 650 240 659.3 Q270 661 300 662.1 Q330 661 360 659.7 Q390 668 420 676.6 Q450 684 480 691.1 Q510 683 540 675.4 Q570 664 600 652.9 Q630 653 660 652.9 Q690 655 720 656.5 Q750 650 780 644 Q810 643 840 641.3 Q870 653 900 665.6 Q930 675 960 684.6 Q990 681 1020 676.5 Q1050 673 1080 668.7 Q1110 672 1140 675.6 Q1170 672 1200 669.4 Q1230 657 1260 643.9 Q1290 640 1320 635.4 Q1350 644 1380 653.6 Q1410 659 1440 664.5" />
    <path className="vs-network-fine-mesh-mid" d="M0 670.4 Q30 661 60 652.3 Q90 649 120 645.8 Q150 651 180 657 Q210 663 240 669.3 Q270 672 300 675.6 Q330 680 360 685.3 Q390 690 420 695.5 Q450 693 480 689.7 Q510 680 540 670.6 Q570 664 600 658.3 Q630 657 660 656.2 Q690 655 720 653.2 Q750 653 780 653.2 Q810 661 840 668.1 Q870 678 900 687.8 Q930 690 960 692.7 Q990 689 1020 686.1 Q1050 684 1080 681.4 Q1110 678 1140 674.4 Q1170 666 1200 657.7 Q1230 652 1260 645.5 Q1290 649 1320 652.2 Q1350 660 1380 666.9 Q1410 671 1440 674.8" />
    <path className="vs-network-fine-mesh-deep" d="M0 663.3 Q30 656 60 648.9 Q90 654 120 658.8 Q150 668 180 678.2 Q210 682 240 686.4 Q270 689 300 692.1 Q330 698 360 704.6 Q390 705 420 705.3 Q450 695 480 683.9 Q510 674 540 663.5 Q570 662 600 661.1 Q630 662 660 662.4 Q690 661 720 659.9 Q750 665 780 670.6 Q810 683 840 695.4 Q870 702 900 707.7 Q930 703 960 698.7 Q990 694 1020 689 Q1050 687 1080 684.6 Q1110 677 1140 670.2 Q1170 661 1200 651.4 Q1230 652 1260 653.1 Q1290 663 1320 673.1 Q1350 680 1380 686.3 Q1410 688 1440 690.3" />
    <path className="vs-network-fine-mesh-deep" d="M0 670.1 Q30 671 60 671.7 Q90 681 120 690.2 Q150 693 180 696 Q210 693 240 689.9 Q270 693 300 695.8 Q330 701 360 706.3 Q390 701 420 695.8 Q450 686 480 676.1 Q510 676 540 675.6 Q570 680 600 685 Q630 683 660 681.2 Q690 679 720 677 Q750 685 780 692.5 Q810 700 840 708 Q870 704 900 700.3 Q930 694 960 687.4 Q990 689 1020 690.2 Q1050 690 1080 690.8 Q1110 683 1140 675.4 Q1170 672 1200 668.1 Q1230 676 1260 684 Q1290 691 1320 697.2 Q1350 695 1380 692.5 Q1410 692 1440 691.9" />
    <path className="vs-network-fine-mesh-deep" d="M0 672.3 Q30 682 60 692.1 Q90 701 120 709.3 Q150 706 180 703.7 Q210 703 240 701.7 Q270 708 300 714.8 Q330 714 360 712.6 Q390 700 420 687.6 Q450 682 480 676.2 Q510 682 540 688.6 Q570 691 600 693.2 Q630 689 660 685.2 Q690 690 720 694.6 Q750 706 780 718 Q810 718 840 718.7 Q870 709 900 698.9 Q930 696 960 693.6 Q990 697 1020 699.6 Q1050 694 1080 688.3 Q1110 680 1140 672.2 Q1170 678 1200 683.4 Q1230 695 1260 706.7 Q1290 708 1320 708.3 Q1350 704 1380 700.4 Q1410 705 1440 709.4" />
    <path className="vs-network-fine-mesh-mid" d="M0 693.3 Q30 702 60 711 Q90 715 120 718.6 Q150 718 180 718.3 Q210 720 240 720.9 Q270 720 300 719 Q330 711 360 703.2 Q390 695 420 687.5 Q450 688 480 687.6 Q510 691 540 695.2 Q570 697 600 698.5 Q630 702 660 705.6 Q690 713 720 721 Q750 725 780 728.4 Q810 723 840 718.2 Q870 712 900 705.3 Q930 703 960 700.5 Q990 697 1020 694.4 Q1050 690 1080 685.3 Q1110 687 1140 688.6 Q1170 697 1200 706 Q1230 712 1260 718.4 Q1290 719 1320 718.9 Q1350 719 1380 719.4 Q1410 720 1440 720.3" />
    <path className="vs-network-fine-mesh-deep" d="M0 717.1 Q30 725 60 732 Q90 731 120 729.9 Q150 729 180 728.6 Q210 730 240 730.4 Q270 724 300 717.3 Q330 706 360 694.8 Q390 692 420 689.3 Q450 695 480 701.2 Q510 705 540 708.6 Q570 710 600 712.2 Q630 720 660 726.9 Q690 734 720 741.6 Q750 738 780 734.1 Q810 724 840 714.4 Q870 710 900 705.9 Q930 705 960 703.7 Q990 699 1020 694.2 Q1050 693 1080 691.2 Q1110 700 1140 709.4 Q1170 720 1200 730.1 Q1230 731 1260 732.4 Q1290 730 1320 727.9 Q1350 729 1380 729.6 Q1410 726 1440 723" />
    <path className="vs-network-fine-mesh-deep" d="M0 743.9 Q30 744 60 744.9 Q90 741 120 737 Q150 738 180 738.4 Q210 735 240 731.7 Q270 719 300 706.4 Q330 699 360 691 Q390 697 420 703.3 Q450 711 480 718.9 Q510 720 540 721.9 Q570 727 600 731.4 Q630 741 660 751 Q690 751 720 751.4 Q750 739 780 727.2 Q810 719 840 710.1 Q870 710 900 710.1 Q930 708 960 705.2 Q990 701 1020 696.7 Q1050 703 1080 710 Q1110 724 1140 738.3 Q1170 743 1200 748.1 Q1230 744 1260 739 Q1290 738 1320 736.2 Q1350 736 1380 735.1 Q1410 725 1440 715.2" />
    <path className="vs-network-fine-mesh-deep" d="M0 748.7 Q30 741 60 734.1 Q90 734 120 733.8 Q150 738 180 742.1 Q210 736 240 729.6 Q270 720 300 709.9 Q330 713 360 716.3 Q390 726 420 735 Q450 735 480 734.4 Q510 731 540 728.2 Q570 735 600 741.6 Q630 747 660 753.3 Q690 745 720 737.5 Q750 728 780 718.6 Q810 721 840 723.5 Q870 727 900 730.4 Q930 725 960 719.2 Q990 718 1020 716.2 Q1050 727 1080 737.6 Q1110 744 1140 751.4 Q1170 745 1200 739.4 Q1230 735 1260 730.9 Q1290 735 1320 739.5 Q1350 738 1380 736.3 Q1410 726 1440 715" />
    <path className="vs-network-fine-mesh-mid" d="M0 753.3 Q30 750 60 746.3 Q90 745 120 744.6 Q150 741 180 737.4 Q210 731 240 723.9 Q270 723 300 721.2 Q330 727 360 733.3 Q390 738 420 743.2 Q450 744 480 745.2 Q510 748 540 750.7 Q570 754 600 757.9 Q630 755 660 751.4 Q690 743 720 734.9 Q750 731 780 727.3 Q810 728 840 729.6 Q870 729 900 728.9 Q930 729 960 728.8 Q990 735 1020 741 Q1050 748 1080 755.9 Q1110 756 1140 756.3 Q1170 752 1200 747.7 Q1230 746 1260 744.1 Q1290 742 1320 740.4 Q1350 734 1380 728.1 Q1410 724 1440 720" />
    <path className="vs-network-fine-mesh-bright" d="M0 445 Q11.2 467 22.5 489 Q33.8 508.8 45 528.6 Q56.2 544.8 67.5 561.1 Q78.8 574 90 586.8 Q101.2 597.8 112.5 608.7 Q123.8 620 135 631.4 Q146.2 645.2 157.5 659.1 Q168.8 676.6 180 694.1" />
    <path className="vs-network-fine-mesh-deep" d="M40 469 Q52.2 488.4 64.4 507.8 Q76.6 523 88.8 538.1 Q100.9 549 113.1 560 Q125.3 568.6 137.5 577.1 Q149.7 586 161.9 594.9 Q174 606.9 186.2 618.9 Q198.4 635.2 210.6 651.6 Q222.8 672 235 692.4" />
    <path className="vs-network-fine-mesh-deep" d="M80 491.8 Q93.1 505.8 106.2 519.9 Q119.4 529 132.5 538 Q145.6 544.2 158.8 550.3 Q171.9 556.8 185 563.4 Q198.1 573.4 211.2 583.4 Q224.4 598.6 237.5 613.8 Q250.6 633.8 263.8 653.8 Q276.9 676.2 290 698.6" />
    <path className="vs-network-fine-mesh-deep" d="M120 506.5 Q134.0 513.8 148.1 521 Q162.1 524.8 176.2 528.5 Q190.3 532.6 204.4 536.7 Q218.4 544.7 232.5 552.7 Q246.6 566.7 260.6 580.7 Q274.7 600.2 288.8 619.8 Q302.8 642.2 316.9 664.7 Q331.0 686.2 345 707.7" />
    <path className="vs-network-fine-mesh-deep" d="M160 499.5 Q175 505.8 190 512.1 Q205 518.6 220 525 Q235 533.7 250 542.4 Q265 554.7 280 567 Q295 582.6 310 598.3 Q325 615.8 340 633.2 Q355 650.2 370 667.1 Q385 681.4 400 695.8" />
    <path className="vs-network-fine-mesh-mid" d="M200 499.8 Q211.2 503.8 222.5 507.8 Q233.8 514.6 245 521.3 Q256.2 532.3 267.5 543.4 Q278.8 558.6 290 573.8 Q301.2 591.3 312.5 608.8 Q323.8 625.8 335 642.8 Q346.2 656.6 357.5 670.5 Q368.8 679.9 380 689.3" />
    <path className="vs-network-fine-mesh-deep" d="M240 495.5 Q252.2 503.2 264.4 510.9 Q276.6 523.7 288.8 536.5 Q301 554.2 313.1 572 Q325.3 592.5 337.5 613 Q349.7 633 361.9 653 Q374 669.4 386.2 685.9 Q398.4 697 410.6 708.2 Q422.8 714.7 435 721.2" />
    <path className="vs-network-fine-mesh-deep" d="M280 493.4 Q293.1 504.8 306.2 516.3 Q319.4 533.5 332.5 550.7 Q345.6 571.2 358.8 591.8 Q371.9 611.8 385 631.9 Q398.1 647.9 411.2 663.9 Q424.4 673.9 437.5 683.9 Q450.6 688.4 463.8 692.9 Q476.9 694.7 490 696.5" />
    <path className="vs-network-fine-mesh-deep" d="M320 428 Q334.0 447 348.1 466.1 Q362.2 487.2 376.2 508.3 Q390.3 529.2 404.4 550.1 Q418.4 568.6 432.5 587.1 Q446.6 602 460.6 616.9 Q474.7 628.5 488.8 640.1 Q502.8 650 516.9 659.9 Q531.0 670.4 545 680.9" />
    <path className="vs-network-fine-mesh-deep" d="M360 443.3 Q375 464.4 390 485.6 Q405 506.5 420 527.4 Q435 545.6 450 563.7 Q465 577.4 480 591.1 Q495 600.8 510 610.4 Q525 617.8 540 625.3 Q555 633.4 570 641.5 Q585 652.8 600 664.2" />
    <path className="vs-network-fine-mesh-mid" d="M400 467.4 Q411.2 488.4 422.5 509.5 Q433.8 527.2 445 544.9 Q456.2 557.5 467.5 570.1 Q478.8 577.8 490 585.5 Q501.2 590.6 512.5 595.6 Q523.8 601.4 535 607.1 Q546.2 616.5 557.5 625.9 Q568.8 640.6 580 655.2" />
    <path className="vs-network-fine-mesh-deep" d="M440 496.1 Q452.2 513.5 464.4 530.9 Q476.6 542.4 488.8 553.9 Q501 559.7 513.1 565.5 Q525.3 568.2 537.5 570.8 Q549.7 574.1 561.9 577.4 Q574 584.9 586.2 592.4 Q598.4 606 610.6 619.5 Q622.8 638.4 635 657.3" />
    <path className="vs-network-fine-mesh-deep" d="M480 506.2 Q493.1 519.8 506.2 533.5 Q519.4 543.7 532.5 553.9 Q545.6 562.1 558.8 570.3 Q571.9 578.8 585 587.4 Q598.1 598.4 611.2 609.4 Q624.4 624 637.5 638.7 Q650.6 656.6 663.8 674.4 Q676.9 694 690 713.5" />
    <path className="vs-network-fine-mesh-deep" d="M520 520.8 Q534.0 529.1 548.1 537.4 Q562.2 543.2 576.2 549.1 Q590.3 555.2 604.4 561.3 Q618.4 570.4 632.5 579.5 Q646.6 593 660.6 606.4 Q674.7 623.9 688.8 641.4 Q702.8 661 716.9 680.6 Q731.0 699.4 745 718.1" />
    <path className="vs-network-fine-mesh-bright" d="M560 525.8 Q575 529.2 590 532.7 Q605 536.4 620 540.1 Q635 547.2 650 554.3 Q665 566.6 680 578.8 Q695 595.9 710 613 Q725 632.6 740 652.2 Q755 671 770 689.8 Q785 704.8 800 719.8" />
    <path className="vs-network-fine-mesh-mid" d="M600 521.2 Q611.2 522.4 622.5 523.7 Q633.8 528.8 645 533.9 Q656.2 544.9 667.5 555.9 Q678.8 572.6 690 589.2 Q701.2 608.8 712.5 628.5 Q723.8 647.4 735 666.2 Q746.2 680.7 757.5 695.2 Q768.8 703.7 780 712.1" />
    <path className="vs-network-fine-mesh-deep" d="M640 434 Q652.2 445.4 664.4 456.8 Q676.6 471.7 688.8 486.6 Q701 504.9 713.1 523.2 Q725.3 543.4 737.5 563.5 Q749.7 583.3 761.9 603.1 Q774 620.3 786.2 637.5 Q798.4 651.1 810.6 664.7 Q822.8 675.1 835 685.5" />
    <path className="vs-network-fine-mesh-deep" d="M680 434.9 Q693.1 448.6 706.2 462.2 Q719.4 480 732.5 497.9 Q745.6 518.1 758.8 538.3 Q771.9 558.1 785 577.9 Q798.1 594.6 811.2 611.4 Q824.4 623.8 837.5 636.1 Q850.6 644.4 863.8 652.8 Q876.9 659.2 890 665.6" />
    <path className="vs-network-fine-mesh-deep" d="M720 442.5 Q734.0 462.8 748.1 483.2 Q762.2 506.4 776.2 529.7 Q790.3 552.5 804.4 575.3 Q818.4 594.6 832.5 614 Q846.6 628.2 860.6 642.3 Q874.7 651.6 888.8 661 Q902.8 668 916.9 674.9 Q931.0 682.8 945 690.8" />
    <path className="vs-network-fine-mesh-deep" d="M760 461.2 Q775 484.4 790 507.6 Q805 530.5 820 553.4 Q835 572.3 850 591.3 Q865 604.2 880 617.2 Q895 624.7 910 632.1 Q925 636.7 940 641.2 Q955 646.7 970 652.2 Q985 662.2 1000 672.2" />
    <path className="vs-network-fine-mesh-mid" d="M800 489.6 Q811.2 507.8 822.5 526 Q833.8 541.8 845 557.7 Q856.2 570 867.5 582.4 Q878.8 591.3 890 600.3 Q901.2 607.4 912.5 614.6 Q923.8 622.2 935 629.9 Q946.2 640.2 957.5 650.5 Q968.8 664.4 980 678.4" />
    <path className="vs-network-fine-mesh-deep" d="M840 513.6 Q852.2 529 864.4 544.5 Q876.6 555.6 888.8 566.8 Q901 573.8 913.1 580.8 Q925.3 585.6 937.5 590.3 Q949.7 595.6 961.9 600.9 Q974 609.3 986.2 617.7 Q998.4 630.6 1010.6 643.5 Q1022.8 660.2 1035 677" />
    <path className="vs-network-fine-mesh-deep" d="M880 536 Q893.1 546 906.2 556.1 Q919.4 561.2 932.5 566.3 Q945.6 568.6 958.8 571 Q971.9 573.8 985 576.7 Q998.1 583.2 1011.2 589.7 Q1024.4 601.4 1037.5 613.2 Q1050.6 629.7 1063.8 646.1 Q1076.9 664.8 1090 683.4" />
    <path className="vs-network-fine-mesh-deep" d="M920 550.2 Q934.0 553.4 948.1 556.6 Q962.2 556.6 976.2 556.5 Q990.3 557 1004.4 557.4 Q1018.4 562 1032.5 566.5 Q1046.6 577 1060.6 587.6 Q1074.7 603.7 1088.8 619.7 Q1102.8 638.4 1116.9 657.2 Q1131.0 674.8 1145 692.3" />
    <path className="vs-network-fine-mesh-deep" d="M960 455 Q975 466 990 477 Q1005 488.2 1020 499.5 Q1035 513.2 1050 526.8 Q1065 544 1080 561.2 Q1095 581.8 1110 602.3 Q1125 624.6 1140 646.8 Q1155 668.4 1170 690 Q1185 709 1200 727.9" />
    <path className="vs-network-fine-mesh-mid" d="M1000 455.1 Q1011.2 463.9 1022.5 472.7 Q1033.8 484.4 1045 496.1 Q1056.2 512.2 1067.5 528.2 Q1078.8 548.4 1090 568.5 Q1101.2 590.8 1112.5 613 Q1123.8 634.6 1135 656.3 Q1146.2 674.7 1157.5 693.1 Q1168.8 707 1180 721" />
    <path className="vs-network-fine-mesh-deep" d="M1040 450.8 Q1052.2 460.5 1064.4 470.2 Q1076.6 485 1088.8 499.8 Q1100.9 519.5 1113.1 539.2 Q1125.3 561.6 1137.5 583.9 Q1149.7 605.6 1161.9 627.2 Q1174.1 645.1 1186.2 663 Q1198.4 675.6 1210.6 688.3 Q1222.8 696.3 1235 704.4" />
    <path className="vs-network-fine-mesh-deep" d="M1080 449.1 Q1093.1 462.6 1106.2 476.2 Q1119.4 495.4 1132.5 514.6 Q1145.6 537 1158.8 559.3 Q1171.9 581 1185 602.7 Q1198.1 620.2 1211.2 637.6 Q1224.4 649 1237.5 660.5 Q1250.6 666.5 1263.8 672.5 Q1276.9 676 1290 679.5" />
    <path className="vs-network-fine-mesh-bright" d="M1120 472.2 Q1134.0 487.6 1148.1 503.1 Q1162.2 520.5 1176.2 537.9 Q1190.3 555 1204.4 572 Q1218.4 586.6 1232.5 601.2 Q1246.6 612.2 1260.6 623.2 Q1274.7 630.9 1288.8 638.6 Q1302.8 644.7 1316.9 650.8 Q1331.0 657.6 1345 664.5" />
    <path className="vs-network-fine-mesh-deep" d="M1160 488 Q1175 505.4 1190 522.8 Q1205 539.9 1220 557 Q1235 571.2 1250 585.3 Q1265 595 1280 604.8 Q1295 610.5 1310 616.2 Q1325 619.9 1340 623.6 Q1355 628 1370 632.5 Q1385 640.3 1400 648.1" />
    <path className="vs-network-fine-mesh-mid" d="M1200 512.3 Q1211.2 532.4 1222.5 552.6 Q1233.8 569.4 1245 586.1 Q1256.2 597.7 1267.5 609.3 Q1278.8 616 1290 622.8 Q1301.2 627 1312.5 631.3 Q1323.8 636.3 1335 641.4 Q1346.2 650.3 1357.5 659.3 Q1368.8 673.5 1380 687.7" />
    <path className="vs-network-fine-mesh-deep" d="M1240 540.9 Q1252.2 557.2 1264.4 573.6 Q1276.6 584 1288.8 594.5 Q1300.9 599.4 1313.1 604.2 Q1325.3 606 1337.5 607.8 Q1349.7 610.5 1361.9 613.2 Q1374.1 620.2 1386.2 627.3 Q1398.4 640.3 1410.6 653.4 Q1422.8 671.8 1435 690.2" />
    <path className="vs-network-fine-mesh-deep" d="M1280 462.4 Q1293.1 477.6 1306.2 492.8 Q1319.4 504.6 1332.5 516.4 Q1345.6 526.3 1358.8 536.2 Q1371.9 546.6 1385 557 Q1398.1 569.9 1411.2 582.8 Q1424.4 599.3 1437.5 615.9 Q1450.6 635.7 1463.8 655.5 Q1476.9 676.8 1490 698.1" />
    <path className="vs-network-fine-mesh-deep" d="M1320 476.5 Q1334.0 486.4 1348.1 496.3 Q1362.2 503.8 1376.2 511.3 Q1390.3 519.3 1404.4 527.3 Q1418.4 538.3 1432.5 549.3 Q1446.6 564.8 1460.6 580.2 Q1474.7 599.7 1488.8 619.1 Q1502.8 640.4 1516.9 661.8 Q1531.0 682.2 1545 702.6" />
    <path className="vs-network-fine-mesh-deep" d="M1360 481.1 Q1375 486.2 1390 491.3 Q1405 496.8 1420 502.4 Q1435 511.5 1450 520.6 Q1465 534.9 1480 549.2 Q1495 568.2 1510 587.3 Q1525 608.7 1540 630.1 Q1555 650.5 1570 670.9 Q1585 687.4 1600 703.9" />
    <path className="vs-network-fine-mesh-mid" d="M1400 476.2 Q1411.2 479.4 1422.5 482.5 Q1433.8 489.6 1445 496.7 Q1456.2 509.8 1467.5 522.8 Q1478.8 541.4 1490 560.1 Q1501.2 581.6 1512.5 603 Q1523.8 623.4 1535 643.9 Q1546.2 659.8 1557.5 675.8 Q1568.8 685.7 1580 695.6" />
    <path className="vs-network-fine-mesh-bright" d="M20 480 Q8.1 499 -3.8 518 Q-15.6 534.4 -27.5 550.8 Q-39.4 563.4 -51.2 576 Q-63.1 585.3 -75 594.6 Q-86.9 602.8 -98.8 611 Q-110.6 620.8 -122.5 630.5 Q-134.4 643.8 -146.2 657.1 Q-158.1 674.2 -170 691.2" />
    <path className="vs-network-fine-mesh-deep" d="M70 505.4 Q57.4 521 44.8 536.5 Q32.2 547.6 19.5 558.6 Q6.8 565.7 -5.8 572.8 Q-18.4 578.6 -31 584.3 Q-43.6 592 -56.2 599.6 Q-68.8 611.4 -81.5 623.2 Q-94.2 639.4 -106.8 655.7 Q-119.4 674.6 -132 693.4" />
    <path className="vs-network-fine-mesh-deep" d="M120 527.8 Q106.6 537.2 93.2 546.6 Q79.8 551.5 66.5 556.4 Q53.2 559.8 39.8 563.1 Q26.4 568.6 13 574.1 Q-0.4 584.4 -13.8 594.8 Q-27.2 610.3 -40.5 625.8 Q-53.8 644.2 -67.2 662.7 Q-80.6 680.5 -94 698.3" />
    <path className="vs-network-fine-mesh-deep" d="M170 540.2 Q155.9 542.9 141.8 545.6 Q127.6 546.6 113.5 547.5 Q99.4 550.8 85.2 554.2 Q71.1 563 57 571.9 Q42.9 586.6 28.8 601.3 Q14.6 619.4 0.5 637.5 Q-13.6 654.9 -27.8 672.3 Q-41.9 685.2 -56 698" />
    <path className="vs-network-fine-mesh-deep" d="M220 540.3 Q205.1 538.8 190.2 537.3 Q175.4 538.6 160.5 539.8 Q145.6 547.2 130.8 554.5 Q115.9 568.4 101 582.3 Q86.1 600 71.2 617.8 Q56.4 634.8 41.5 651.7 Q26.6 663.6 11.8 675.5 Q-3.1 680.6 -18 685.7" />
    <path className="vs-network-fine-mesh-deep" d="M270 538.6 Q258.1 544.3 246.2 550 Q234.4 559.2 222.5 568.3 Q210.6 581.2 198.8 594.1 Q186.9 609.2 175 624.4 Q163.1 639 151.2 653.7 Q139.4 665.4 127.5 677.2 Q115.6 685.1 103.8 693 Q91.9 697.9 80 702.8" />
    <path className="vs-network-fine-mesh-mid" d="M320 540.9 Q307.4 548.6 294.8 556.3 Q282.2 568.4 269.5 580.6 Q256.8 595.3 244.2 610 Q231.6 624.2 219 638.5 Q206.4 649.3 193.8 660.1 Q181.2 666.3 168.5 672.5 Q155.8 675.1 143.2 677.7 Q130.6 679.5 118 681.3" />
    <path className="vs-network-fine-mesh-deep" d="M370 458.7 Q356.6 475.8 343.2 492.8 Q329.8 512.9 316.5 533 Q303.2 552.4 289.8 571.9 Q276.4 587.4 263 603 Q249.6 613.2 236.2 623.4 Q222.8 629.4 209.5 635.4 Q196.2 640.5 182.8 645.6 Q169.4 653.4 156 661.2" />
    <path className="vs-network-fine-mesh-deep" d="M420 478.8 Q405.9 498.5 391.8 518.2 Q377.6 537.2 363.5 556.3 Q349.4 570.9 335.2 585.5 Q321.1 594 307 602.5 Q292.9 606.2 278.8 610 Q264.6 612.7 250.5 615.4 Q236.4 621.1 222.2 626.8 Q208.1 638.3 194 649.8" />
    <path className="vs-network-fine-mesh-deep" d="M470 509 Q455.1 527.6 440.2 546.2 Q425.4 559.8 410.5 573.5 Q395.6 580.3 380.8 587.1 Q365.9 588.6 351 590.1 Q336.1 590.4 321.2 590.7 Q306.4 594.4 291.5 598 Q276.6 608.2 261.8 618.3 Q246.9 634.8 232 651.2" />
    <path className="vs-network-fine-mesh-deep" d="M520 530.7 Q508.1 544.2 496.2 557.6 Q484.4 567.2 472.5 576.8 Q460.6 583.3 448.8 589.9 Q436.9 595.7 425 601.5 Q413.1 609.2 401.2 617 Q389.4 628.4 377.5 639.9 Q365.6 655 353.8 670 Q341.9 686.8 330 703.7" />
    <path className="vs-network-fine-mesh-deep" d="M570 551 Q557.4 558.9 544.8 566.8 Q532.2 571 519.5 575.3 Q506.8 578.7 494.2 582.1 Q481.6 587.8 469 593.6 Q456.4 603.7 443.8 613.7 Q431.2 628.1 418.5 642.5 Q405.8 659 393.2 675.5 Q380.6 691 368 706.4" />
    <path className="vs-network-fine-mesh-mid" d="M620 562.3 Q606.6 564.3 593.2 566.3 Q579.8 567.3 566.5 568.3 Q553.2 572 539.8 575.6 Q526.4 584.3 513 593 Q499.6 606.7 486.2 620.4 Q472.8 636.6 459.5 652.7 Q446.2 667.7 432.8 682.7 Q419.4 693.3 406 703.9" />
    <path className="vs-network-fine-mesh-deep" d="M670 562.8 Q655.9 561.4 641.8 560 Q627.6 561.6 613.5 563.2 Q599.4 570.5 585.2 577.8 Q571.1 590.8 557 603.8 Q542.9 619.6 528.8 635.5 Q514.6 650 500.5 664.4 Q486.4 674 472.2 683.5 Q458.1 687 444 690.5" />
    <path className="vs-network-fine-mesh-deep" d="M720 466.2 Q705.1 471.4 690.2 476.6 Q675.4 488.2 660.5 499.9 Q645.6 517.9 630.8 535.9 Q615.9 557 601 578.2 Q586.1 597.8 571.2 617.5 Q556.4 631.7 541.5 645.9 Q526.6 653.3 511.8 660.7 Q496.9 663.3 482 665.9" />
    <path className="vs-network-fine-mesh-bright" d="M770 477.9 Q758.1 490.9 746.2 503.9 Q734.4 520.6 722.5 537.2 Q710.6 555.7 698.8 574.1 Q686.9 591.8 675 609.4 Q663.1 623.8 651.2 638.3 Q639.4 648.9 627.5 659.5 Q615.6 667.4 603.8 675.3 Q591.9 682.8 580 690.4" />
    <path className="vs-network-fine-mesh-deep" d="M820 488.2 Q807.4 504.2 794.8 520.1 Q782.2 538.2 769.5 556.4 Q756.8 573.5 744.2 590.6 Q731.6 604 719 617.4 Q706.4 626.2 693.8 635.1 Q681.2 640.6 668.5 646.1 Q655.8 651.3 643.2 656.5 Q630.6 664.5 618 672.5" />
    <path className="vs-network-fine-mesh-deep" d="M870 508.5 Q856.6 526.3 843.2 544.1 Q829.8 560.8 816.5 577.4 Q803.2 589.8 789.8 602.1 Q776.4 609.1 763 616.1 Q749.6 619.3 736.2 622.5 Q722.8 625.4 709.5 628.2 Q696.2 634.2 682.8 640.2 Q669.4 651.4 656 662.6" />
    <path className="vs-network-fine-mesh-mid" d="M920 537.3 Q905.9 553.4 891.8 569.6 Q877.6 580.9 863.5 592.2 Q849.4 597.4 835.2 602.6 Q821.1 603.5 807 604.4 Q792.9 604.8 778.8 605.3 Q764.6 609.3 750.5 613.4 Q736.4 623.3 722.2 633.3 Q708.1 648.6 694 664" />
    <path className="vs-network-fine-mesh-deep" d="M970 567.3 Q955.1 577.6 940.2 587.8 Q925.4 591.2 910.5 594.7 Q895.6 593.3 880.8 591.9 Q865.9 590 851 588 Q836.1 590 821.2 592.1 Q806.4 600.8 791.5 609.5 Q776.6 624.2 761.8 638.9 Q746.9 656.1 732 673.3" />
    <path className="vs-network-fine-mesh-deep" d="M1020 574 Q1008.1 580.6 996.2 587.2 Q984.4 591 972.5 594.8 Q960.6 598.3 948.8 601.8 Q936.9 607.6 925 613.4 Q913.1 623 901.2 632.6 Q889.4 645.6 877.5 658.6 Q865.6 673.1 853.8 687.6 Q841.9 700.8 830 713.9" />
    <path className="vs-network-fine-mesh-deep" d="M1070 493.6 Q1057.4 500.8 1044.8 508 Q1032.2 514.8 1019.5 521.6 Q1006.8 531.1 994.2 540.6 Q981.6 554.7 969 568.7 Q956.4 586.8 943.8 604.9 Q931.2 624.7 918.5 644.5 Q905.8 662.8 893.2 681.1 Q880.6 695.4 868 709.7" />
    <path className="vs-network-fine-mesh-deep" d="M1120 494.9 Q1106.6 499.4 1093.2 503.8 Q1079.8 511.3 1066.5 518.8 Q1053.2 531.6 1039.8 544.3 Q1026.4 561.8 1013 579.3 Q999.6 598.8 986.2 618.3 Q972.8 636 959.5 653.8 Q946.2 666.9 932.8 680 Q919.4 687.8 906 695.7" />
    <path className="vs-network-fine-mesh-deep" d="M1170 491.4 Q1155.9 497 1141.8 502.6 Q1127.6 514 1113.5 525.5 Q1099.4 542.4 1085.2 559.3 Q1071.1 578.4 1057 597.6 Q1042.9 614.8 1028.8 632 Q1014.6 643.9 1000.5 655.8 Q986.4 661.8 972.2 667.7 Q958.1 669.8 944 672" />
    <path className="vs-network-fine-mesh-mid" d="M1220 491.8 Q1205.1 502 1190.2 512.2 Q1175.4 528.4 1160.5 544.7 Q1145.6 563.6 1130.8 582.4 Q1115.9 599 1101 615.7 Q1086.1 626.4 1071.2 637.2 Q1056.4 641.2 1041.5 645.3 Q1026.6 645.1 1011.8 644.9 Q996.9 644.9 982 644.9" />
    <path className="vs-network-fine-mesh-deep" d="M1270 517.7 Q1258.1 532.4 1246.2 547 Q1234.4 563 1222.5 579.1 Q1210.6 594 1198.8 608.8 Q1186.9 620.2 1175 631.7 Q1163.1 639.4 1151.2 647 Q1139.4 652.2 1127.5 657.5 Q1115.6 662.8 1103.8 668.1 Q1091.9 676.1 1080 684.1" />
    <path className="vs-network-fine-mesh-deep" d="M1320 537.8 Q1307.4 553.6 1294.8 569.3 Q1282.2 583.6 1269.5 597.8 Q1256.8 608.2 1244.2 618.5 Q1231.6 624.2 1219 630 Q1206.4 632.8 1193.8 635.7 Q1181.2 638.7 1168.5 641.6 Q1155.8 647.8 1143.2 653.9 Q1130.6 664.6 1118 675.3" />
    <path className="vs-network-fine-mesh-deep" d="M1370 564.9 Q1356.6 578.6 1343.2 592.4 Q1329.8 601.6 1316.5 610.7 Q1303.2 614.6 1289.8 618.4 Q1276.4 618.9 1263 619.4 Q1249.6 620 1236.2 620.6 Q1222.8 624.9 1209.5 629.2 Q1196.2 638.8 1182.8 648.3 Q1169.4 662.3 1156 676.3" />
    <path className="vs-network-fine-mesh-deep" d="M1420 501.4 Q1405.9 515.1 1391.8 528.8 Q1377.6 536.4 1363.5 544.1 Q1349.4 547.9 1335.2 551.7 Q1321.1 555.7 1307 559.7 Q1292.9 567.8 1278.8 575.8 Q1264.6 589.9 1250.5 604 Q1236.4 623.2 1222.2 642.3 Q1208.1 663 1194 683.8" />
  
    <g className="vs-pyramid-net-refinement" aria-hidden="true">

      {/* LEFT PYRAMID — curved rising ribs */}
      <path className="vs-pyramid-net-deep" d="M40 705 Q105 650 150 565 Q195 650 255 710" />
      <path className="vs-pyramid-net-mid" d="M75 680 Q125 625 150 565 Q175 625 225 685" />
      <path className="vs-pyramid-net-deep" d="M105 705 Q138 655 150 610 Q165 655 195 705" />

      {/* LEFT-CENTER PYRAMID */}
      <path className="vs-pyramid-net-deep" d="M235 720 Q330 625 430 475 Q525 630 615 720" />
      <path className="vs-pyramid-net-mid" d="M285 700 Q355 620 430 515 Q505 625 570 705" />
      <path className="vs-pyramid-net-bright" d="M335 680 Q385 610 430 545 Q475 610 525 685" />

      {/* CENTER PYRAMID */}
      <path className="vs-pyramid-net-deep" d="M500 720 Q595 600 690 430 Q785 605 885 720" />
      <path className="vs-pyramid-net-mid" d="M555 700 Q625 585 690 475 Q755 585 830 705" />
      <path className="vs-pyramid-net-bright" d="M610 680 Q655 570 690 510 Q730 570 775 685" />

      {/* RIGHT-CENTER PYRAMID */}
      <path className="vs-pyramid-net-deep" d="M785 720 Q895 585 990 405 Q1090 590 1185 720" />
      <path className="vs-pyramid-net-mid" d="M840 700 Q920 575 990 450 Q1060 575 1135 705" />
      <path className="vs-pyramid-net-bright" d="M900 680 Q950 555 990 495 Q1035 555 1090 685" />

      {/* RIGHT PYRAMID */}
      <path className="vs-pyramid-net-deep" d="M1080 720 Q1160 575 1240 380 Q1325 575 1425 720" />
      <path className="vs-pyramid-net-mid" d="M1125 700 Q1185 560 1240 430 Q1300 565 1380 705" />
      <path className="vs-pyramid-net-bright" d="M1180 680 Q1215 550 1240 475 Q1275 550 1335 685" />

      {/* CURVED CROSS-THREADS — creates the woven pyramid-net character */}
      <path className="vs-pyramid-net-deep" d="M55 650 Q155 615 265 635 Q350 650 430 610 Q520 565 615 595 Q710 625 805 585 Q900 545 990 570 Q1085 600 1180 535 Q1290 465 1405 520" />

      <path className="vs-pyramid-net-mid" d="M70 690 Q175 650 275 675 Q365 700 450 655 Q535 610 625 640 Q715 665 805 625 Q900 585 1000 610 Q1090 635 1185 580 Q1290 520 1390 555" />

      <path className="vs-pyramid-net-bright" d="M105 610 Q190 575 275 600 Q360 625 445 585 Q535 540 620 570 Q705 600 795 555 Q890 510 980 540 Q1070 570 1160 515 Q1260 455 1360 500" />

      <path className="vs-pyramid-net-deep" d="M120 720 Q220 675 320 700 Q410 720 505 675 Q600 630 690 665 Q780 700 875 650 Q965 605 1060 635 Q1150 665 1240 605 Q1330 545 1410 580" />

      {/* OPPOSING CURVED THREADS — breaks parallel repetition */}
      <path className="vs-pyramid-net-mid" d="M180 710 Q225 635 300 575 Q370 520 445 545 Q520 570 590 520 Q665 465 740 500 Q815 535 885 480 Q955 425 1030 455 Q1110 490 1185 430 Q1260 370 1350 420" />

      <path className="vs-pyramid-net-deep" d="M95 705 Q180 655 250 575 Q320 495 395 515 Q470 535 540 475 Q610 415 685 455 Q760 495 835 430 Q910 365 985 405 Q1060 445 1135 385 Q1210 325 1300 375 Q1360 405 1415 395" />

      <path className="vs-pyramid-net-mid" d="M260 720 Q315 665 375 600 Q435 535 500 555 Q565 575 630 520 Q695 465 760 490 Q825 515 890 455 Q955 395 1020 420 Q1085 445 1150 395 Q1215 345 1280 365 Q1350 390 1400 350" />

    </g></g>

          {[
            [120, 540],
            [220, 610],
            [340, 470],
            [455, 535],
            [560, 420],
            [690, 500],
            [790, 370],
            [930, 465],
            [1050, 350],
            [1170, 440],
            [1300, 320],
          ].map(([cx, cy], index) => (
            <circle
              key={index}
              className="vs-network-node"
              cx={cx}
              cy={cy}
              r={index % 3 === 0 ? 2.3 : 1.5}
            />
          ))}
        
    <g className="vs-cosmic-terrain" aria-hidden="true">

      {/* DEEP COSMIC DUST */}
      <g className="vs-cosmic-dust-deep">
        <circle cx="70" cy="690" r="1.1" />
        <circle cx="118" cy="640" r="0.8" />
        <circle cx="165" cy="705" r="1.0" />
        <circle cx="205" cy="625" r="0.7" />
        <circle cx="252" cy="680" r="1.2" />
        <circle cx="295" cy="590" r="0.8" />
        <circle cx="338" cy="700" r="0.9" />
        <circle cx="382" cy="625" r="1.1" />
        <circle cx="425" cy="560" r="0.7" />
        <circle cx="468" cy="690" r="1.0" />
        <circle cx="515" cy="610" r="0.8" />
        <circle cx="555" cy="700" r="1.2" />
        <circle cx="600" cy="555" r="0.7" />
        <circle cx="640" cy="650" r="1.0" />
        <circle cx="685" cy="515" r="0.8" />
        <circle cx="730" cy="690" r="1.1" />
        <circle cx="775" cy="590" r="0.8" />
        <circle cx="820" cy="675" r="1.0" />
        <circle cx="865" cy="535" r="0.7" />
        <circle cx="910" cy="650" r="1.1" />
        <circle cx="955" cy="570" r="0.8" />
        <circle cx="1000" cy="690" r="1.2" />
        <circle cx="1045" cy="535" r="0.7" />
        <circle cx="1090" cy="625" r="1.0" />
        <circle cx="1135" cy="500" r="0.8" />
        <circle cx="1180" cy="660" r="1.1" />
        <circle cx="1225" cy="550" r="0.7" />
        <circle cx="1270" cy="635" r="1.0" />
        <circle cx="1315" cy="475" r="0.8" />
        <circle cx="1360" cy="610" r="1.1" />
        <circle cx="1410" cy="690" r="0.9" />
      </g>

      {/* MID-DEPTH COSMIC PARTICLES */}
      <g className="vs-cosmic-dust-mid">
        <circle cx="105" cy="665" r="1.5" />
        <circle cx="185" cy="600" r="1.2" />
        <circle cx="275" cy="650" r="1.6" />
        <circle cx="350" cy="555" r="1.1" />
        <circle cx="445" cy="625" r="1.5" />
        <circle cx="530" cy="535" r="1.2" />
        <circle cx="615" cy="610" r="1.6" />
        <circle cx="700" cy="470" r="1.2" />
        <circle cx="785" cy="620" r="1.5" />
        <circle cx="875" cy="500" r="1.1" />
        <circle cx="965" cy="600" r="1.6" />
        <circle cx="1050" cy="480" r="1.2" />
        <circle cx="1140" cy="570" r="1.5" />
        <circle cx="1230" cy="450" r="1.1" />
        <circle cx="1320" cy="570" r="1.6" />
        <circle cx="1390" cy="635" r="1.2" />
      </g>

      {/* SELECTED ENERGY NODES */}
      <g className="vs-cosmic-energy">
        <circle cx="150" cy="565" r="1.9" />
        <circle cx="430" cy="475" r="2.0" />
        <circle cx="690" cy="430" r="2.2" />
        <circle cx="990" cy="405" r="2.0" />
        <circle cx="1240" cy="380" r="2.1" />
        <circle cx="300" cy="575" r="1.5" />
        <circle cx="560" cy="520" r="1.6" />
        <circle cx="820" cy="555" r="1.5" />
        <circle cx="1080" cy="500" r="1.7" />
        <circle cx="1330" cy="515" r="1.5" />
      </g>

    </g></svg>
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













































































