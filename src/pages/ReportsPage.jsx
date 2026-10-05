import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import ItemImage from "../components/common/ItemImage";

export default function ReportsPage() {
  const { items, currentUser } = useAppData();
  const { user } = useAuth();

  // DB rows: match reporter_id (UUID). Dummy rows: match display name.
  const myReports = items.filter(item =>
    item._fromDb
      ? item.reportedBy === user?.id
      : item.reportedBy === currentUser.name
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-display-lg text-on-surface">My Reports</h1>
            <p className="text-body-lg text-on-surface-variant">Track your lost items and items you've found.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/reports/lost" className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-on-surface rounded-lg font-medium hover:bg-surface-container-high transition-colors">
              Report Lost
            </Link>
            <Link to="/reports/found" className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container transition-colors">
              Report Found
            </Link>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                  <th className="px-5 py-3 font-label-md text-on-surface-variant uppercase tracking-wider">Item</th>
                  <th className="px-5 py-3 font-label-md text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 font-label-md text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 font-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-label-md text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {myReports.length > 0 ? myReports.map(report => (
                  <tr key={report.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface-container-low flex items-center justify-center overflow-hidden flex-shrink-0">
                          <ItemImage
                            image={report.image}
                            imagePath={report.image_path}
                            alt={report.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-on-surface truncate">{report.name}</span>
                          <span className="font-code-sm text-outline">{report.tag}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${report.status === 'Lost' ? 'bg-error-container/30 text-error' : 'bg-tertiary-container/30 text-tertiary'}`}>
                        {report.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-body-sm text-on-surface-variant">{report.date}</td>
                    <td className="px-5 py-4 font-body-sm text-on-surface">{report.status === 'Lost' ? 'Searching' : report.status === 'Resolved' ? 'Returned to owner' : 'At Security'}</td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-primary hover:underline font-label-md">Details</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-on-surface-variant">You haven't submitted any reports yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
