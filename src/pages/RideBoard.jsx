import { Navbar } from "@/components/Navbar";

const RideBoard = () => {
  const getCurrentUser = () => {
    const keys = ["pathfinder_user", "currentUser"];
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return null;
  };

  const user = getCurrentUser();

  return (
    <div className="min-h-screen bg-[#0b0f0c]">
      <Navbar user={user} />
      <main className="p-8 text-[#e8f6ef]">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-4 text-[#e3f5ec]">Ride Board</h1>
          <p className="text-[#d9efe6]">Ride Board — Coming Soon</p>
        </div>
      </main>
    </div>
  );
};

export default RideBoard;

