import AuthGuard from "../components/AuthGuard";
import ChatBox from "../components/ChatBox";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen overflow-hidden bg-[#F8FAFC] text-gray-900">
        <ChatBox />
      </main>
    </AuthGuard>
  );
}
