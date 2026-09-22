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
        rgba(7, 70, 125, 0.28) 0%,
        rgba(4, 35, 70, 0.16) 28%,
        transparent 58%
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
        #020617 0%,
        #071326 42%,
        #0a1628 58%,
        #020617 100%
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
    background: #b8efff;
    box-shadow:
      0 0 4px rgba(34, 211, 238, 0.8),
      0 0 10px rgba(0, 180, 255, 0.45);
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
    color: rgba(14, 165, 233, 0.14);
    font-size: clamp(38px, 4.6vw, 76px);
    line-height: 0.82;
    font-weight: 800;
    letter-spacing: -0.065em;
    filter: blur(0.25px);
    text-shadow:
      0 0 20px rgba(0, 191, 255, 0.16),
      0 0 42px rgba(14, 165, 233, 0.10),
      0 0 80px rgba(0, 120, 255, 0.06);
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
    opacity: 0.72;
  }

  .vs-network-line {
    fill: none;
    stroke: rgba(0, 180, 255, 0.23);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .vs-network-line-bright {
    fill: none;
    stroke: rgba(34, 211, 238, 0.38);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .vs-network-node {
    fill: rgba(34, 211, 238, 0.7);
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
          {Array.from({ length: 180 }, (_, index) => {
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
                      ? 0.85
                      : index % 5 === 0
                        ? 0.55
                        : 0.28,
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
        </svg>
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
      {Array.from({ length: 180 }, (_, index) => {
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


















































