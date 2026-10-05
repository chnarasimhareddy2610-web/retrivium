import { mockNotifications } from "../data/dummyData";
import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

export default function DashboardPage() {
  const { currentUser } = useAppData();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-display-lg text-on-surface">Good Morning, {currentUser.name.split(" ")[0]}</h1>
          <p className="text-body-lg text-on-surface-variant">Here is the latest from the campus recovery network.</p>
        </div>

        {/* Priority Area (Matches) */}
        <div className="bg-primary-container/10 border border-primary-container/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">troubleshoot</span>
            </div>
            <div>
              <h2 className="text-headline-sm text-on-surface">1 Possible Match Found</h2>
              <p className="text-body-sm text-on-surface-variant">An item matching your "Sony Earbuds" was recently reported.</p>
            </div>
          </div>
          <Link to="/claims" className="px-5 py-2 bg-primary text-on-primary rounded-lg text-label-lg font-medium hover:bg-primary-container transition-colors whitespace-nowrap">
            Review Match
          </Link>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/reports/lost" className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-error-container text-on-error-container flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <div className="flex-1">
              <h3 className="text-headline-sm text-on-surface mb-1">Report Lost Item</h3>
              <p className="text-body-sm text-on-surface-variant">I lost something on campus and need to find it.</p>
            </div>
          </Link>
          <Link to="/reports/found" className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">where_to_vote</span>
            </div>
            <div className="flex-1">
              <h3 className="text-headline-sm text-on-surface mb-1">Report Found Item</h3>
              <p className="text-body-sm text-on-surface-variant">I found an item and want to return it to the owner.</p>
            </div>
          </Link>
        </div>

        {/* Split Section: Stats & Recent Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-headline-sm text-on-surface px-1">Your Activity</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
                <p className="text-display-lg text-error">2</p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">Active Lost</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
                <p className="text-display-lg text-primary">1</p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">Found Matches</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
                <p className="text-display-lg text-secondary">2</p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">Pending Claims</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
                <p className="text-display-lg text-tertiary">0</p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">Recovered</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="text-headline-sm text-on-surface px-1">Recent Updates</h3>
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col">
              {mockNotifications.slice(0, 3).map((note, index) => (
                <Link key={note.id} to={note.link} className={`p-4 flex gap-3 hover:bg-surface-container-low transition-colors ${index !== 2 ? 'border-b border-outline-variant/10' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${note.read ? 'bg-transparent' : 'bg-primary'}`}></div>
                  <div className="flex flex-col flex-1">
                    <p className={`text-label-md ${!note.read ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>{note.title}</p>
                    <p className="text-body-sm text-on-surface-variant line-clamp-1">{note.message}</p>
                    <p className="text-[10px] text-outline mt-1 font-mono">{note.time}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
