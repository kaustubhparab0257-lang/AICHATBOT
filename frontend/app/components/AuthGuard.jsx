"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { auth } from "../lib/firebase";
import { getAuthToken, setAuthSession, subscribeToAuth } from "../lib/authStorage";

const getServerToken = () => null;

export default function AuthGuard({ children }) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeToAuth,
    getAuthToken,
    getServerToken
  );

  useEffect(() => {
    if (!auth) return undefined;

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || getAuthToken()) return;

      const firebaseToken = await firebaseUser.getIdToken();
      setAuthSession({
        token: firebaseToken,
        user: {
          id: firebaseUser.uid,
          name:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "ChatGen User",
          email: firebaseUser.email || "No email provided",
          avatar: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || "firebase",
        },
      });
    });
  }, []);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  if (!token) {
    return (
      <main className="premium-shell flex min-h-screen items-center justify-center text-gray-600">
        <div className="glass-panel rounded-2xl px-5 py-4 text-sm font-semibold text-gray-700">
          Checking ChatGen AI session...
        </div>
      </main>
    );
  }

  return children;
}
