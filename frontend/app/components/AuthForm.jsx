"use client";

import axios from "axios";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  User,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAuthSession } from "../lib/authStorage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const validate = () => {
    if (isSignup && !form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Enter a valid email address.";
    }
    if (!form.password) return "Password is required.";
    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await axios.post(`${API_URL}/api/auth/signup`, {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        router.push("/login");
        setToast({
          type: "success",
          message: "Account created. Please log in to continue.",
        });
        return;
      }

      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: form.email.trim(),
        password: form.password,
      });

      setAuthSession({
        token: res.data.token,
        user: res.data.user,
      });
      setToast({
        type: "success",
        message: "Logged in successfully.",
      });
      router.push("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(message);
      setToast({
        type: "error",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="premium-shell relative min-h-screen overflow-hidden px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <motion.div
        aria-hidden="true"
        className="absolute left-[-10rem] top-[-12rem] h-96 w-96 rounded-full bg-violet-300/35 blur-3xl"
        animate={{ scale: [1, 1.16, 1], opacity: [0.55, 0.95, 0.55] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[-14rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-pink-300/35 blur-3xl"
        animate={{ scale: [1.08, 1, 1.08], opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <section className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/55 shadow-2xl shadow-violet-200/50 backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          className="relative hidden flex-col justify-between overflow-hidden border-r border-white/80 p-10 lg:flex"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(139,92,246,0.24),transparent_34%),radial-gradient(circle_at_74%_72%,rgba(236,72,153,0.18),transparent_30%)]" />
          <div className="relative">
            <div className="mb-16 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-violet-200">
                <WandSparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">
                  ChatGen AI
                </p>
                <p className="text-sm text-gray-500">
                  Smart AI Conversations
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-sm font-semibold text-gray-600 shadow-sm">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Smart AI Conversations
              </div>
              <h1 className="max-w-xl text-5xl font-black leading-tight tracking-tight text-gray-900">
                A cleaner workspace for thoughtful AI conversations.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
                Sign in to create structured answers, polished writing, and
                productive chat sessions in a soft professional workspace.
              </p>
            </motion.div>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {["Fast answers", "JWT secure", "Markdown ready"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/80 bg-white/55 p-4 text-sm font-semibold text-gray-700 shadow-lg shadow-violet-100/60 backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="flex items-center justify-center p-5 sm:p-8 lg:p-12"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="glass-panel gradient-border w-full max-w-md rounded-[2rem] p-6 sm:p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-violet-200">
                <WandSparkles className="h-7 w-7" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">
                {isSignup ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {isSignup
                  ? "Join ChatGen AI and start Smart AI Conversations."
                  : "Continue to your ChatGen AI dashboard."}
              </p>
            </div>

            <p className="mb-6 text-sm leading-6 text-gray-500">
              Use your ChatGen AI email and password to access your secure dashboard.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignup && (
                <FloatingInput
                  icon={User}
                  label="Full name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
              )}

              <FloatingInput
                icon={Mail}
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />

              <FloatingInput
                icon={LockKeyhole}
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                action={
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    className="text-gray-400 transition hover:text-violet-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              {error && (
                <motion.div
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-5 py-3.5 text-sm font-black text-white shadow-xl shadow-violet-200 transition disabled:opacity-60"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-white/20 transition group-hover:translate-x-[100%]" />
                <span className="relative">
                  {loading
                    ? "Securing session..."
                    : isSignup
                      ? "Create account"
                      : "Sign in"}
                </span>
                <ArrowRight className="relative h-4 w-4" />
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {isSignup ? "Already have an account?" : "New to ChatGen AI?"}{" "}
              <Link
                href={isSignup ? "/login" : "/signup"}
                className="font-black text-violet-600 transition hover:text-pink-600"
              >
                {isSignup ? "Log in" : "Create account"}
              </Link>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

function getFirebaseErrorMessage(error) {
  if (error.code === "auth/popup-closed-by-user") {
    return "Sign-in popup was closed before completing authentication.";
  }

  if (error.code === "auth/account-exists-with-different-credential") {
    return "An account already exists with the same email using another provider.";
  }

  if (error.code === "auth/popup-blocked") {
    return "The sign-in popup was blocked. Please allow popups and try again.";
  }

  if (error.code === "auth/cancelled-popup-request") {
    return "Another sign-in popup is already open.";
  }

  return error.message || "Social login failed. Please try again.";
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <motion.div
      className={`fixed right-4 top-4 z-50 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl ${
        toast.type === "success"
          ? "border-emerald-200 bg-emerald-50/90 text-emerald-700"
          : "border-red-200 bg-red-50/90 text-red-700"
      }`}
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      onAnimationComplete={() => {
        setTimeout(onClose, 3200);
      }}
    >
      {toast.message}
    </motion.div>
  );
}

function FloatingInput({
  icon: Icon,
  label,
  action,
  name,
  value,
  onChange,
  type = "text",
}) {
  const active = Boolean(value);

  return (
    <label className="group relative block">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition group-focus-within:text-violet-500" />
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="peer h-14 w-full rounded-2xl border border-white/80 bg-white/60 px-11 pr-12 pt-4 text-sm text-gray-900 outline-none shadow-sm transition placeholder:text-transparent focus:border-violet-300 focus:bg-white"
        placeholder={label}
      />
      <span
        className={`pointer-events-none absolute left-11 transition ${
          active
            ? "top-2 text-[11px] text-violet-600"
            : "top-1/2 -translate-y-1/2 text-sm text-gray-500 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-violet-600"
        }`}
      >
        {label}
      </span>
      {action && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          {action}
        </span>
      )}
    </label>
  );
}
