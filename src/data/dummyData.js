// ──────────────────────────────────────────────
// Retrivium — Isolated Mock Data Layer
// Replace this file with API calls when backend is ready.
// ──────────────────────────────────────────────

export const currentUser = {
  id: "USR-2201",
  name: "Arjun Mehta",
  email: "arjun.mehta@university.edu",
  phone: "+91 98765 43210",
  department: "Computer Science & Engineering",
  year: "3rd Year",
  studentId: "CSE-2022-0148",
  role: "student", // "student" | "admin"
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCp0Wm33AcRQjtTVgqnyiw9zBgoqhR763Z9DUJV2TRbHaM1GcATpnsALInJ_XamsG_ia3BBCAQASZboEeHNz54hUipfmWJ8wGvDSpVj032Ln2oonQlF269UJsRUJexTyq1wX0rmfwsKQ-fObeRlk7V2AHxCkXiUzFh6jUoJicVGbyojmI1plyCsT5NN7ItD8tG7dLkwYqeSM_e0OYdNfy3OVZrxe4ay9p5R8M1zOQ-OgZUzaR-RYdT02Q",
};

export const initialItems = [
  { id: 1, name: "Silver iPad Air with Smart Keyboard", location: "Auditorium Main Hall", status: "Found", category: "Electronics", date: "12 May 2025", tag: "REC-8802", markerId: "item-ipad", description: "Silver iPad Air 5th Gen with Smart Keyboard Folio attached. Found on seat row C-14 after the morning seminar.", custody: "Held at Security Desk — Safe A-4", reportedBy: "Campus Security", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB1cqkZ3LzCgyYZPCjZsWbqgzdwtg4BhuJGg0v-SY6Kurw-9aFvgP6w9xW04M0rxJxRgwit1Wr8ccARmD3YpUk4EyhjGFaQ13Ubt3yC67PvLyZhSlyD6XmpmG0h_vwbZNJnoh_DBx7rnV7Nvadt9zhVvtut-wc06U6jStkRrkhzZ8bty6O0hfmFl_TD36sNTzQJzc-xQ-WejUWWOJgB4bgQuOi0u97gfMwQBmJO5XoxVa0N8dJR0VN8Sw" },
  { id: 2, name: "Keyring with Blue Lanyard", location: "Main Canteen • Table 14", status: "Found", category: "Keys", date: "12 May 2025", tag: "REC-8798", markerId: "item-keys", description: "Set of 3 keys on a blue university lanyard. Found under table 14 near the south window.", custody: "Held at Security Desk — Drawer 7", reportedBy: "Canteen Staff", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBF4BfvUBKvvGQkfAp2aiZKALkDDBtdLAOnKSzGA0t6GpSDjgxShKXrhOqXwLhP_sr2IskYoqHHumejb83Ys1c4ISeosMBX5GEhpCwCBWYCU0FpiKF8h2-9jh3aTJhOgvMytaXzWxRfYXN2iSRUgZdla0HHvGKF9BSmeofCYRDfJnlrU1j9sDnuGKIk6eDzJbD7g0_xrtn-aPhM4LicZB2-McxDfWqgyuWEjZNTAK1X0q4BOhpGw0NUAQ" },
  { id: 3, name: "Olive Green 32oz Hydro Flask", location: "CS Block • Room 202", status: "Lost", category: "Accessories", date: "13 May 2025", tag: "REP-4311", markerId: "item-hydro", description: "Olive green Hydro Flask 32oz with dent on base and a 'Save Water' sticker. Last seen on desk near window.", custody: null, reportedBy: currentUser.name, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6LF3aQiGWxPXJlmI2wUSHi7BwXM3AJiNCcWCw3vYcfixkFo7HBsm4sFdeDnwx8KLoK4d7S9qhXpgLmpC5lp38dzTi_P1-H0FV6UfVCwrWhe_p-l4a3eC9pfAa39b2sXlJ3T1Q-H4VKxXoo3rj8zFtPpCVfTR9LpBskCRAcnr86izYpzBS1w5-9FyUeH4rlyVeHjGpYZ8DZPmwbg0QAdgIoelKgr9nWs5mnOS58Ltqdg6vdSdk0YBJEg" },
  { id: 4, name: "Stewart Calculus 9th Edition", location: "Central Library • 2nd Floor", status: "Found", category: "Documents", date: "13 May 2025", tag: "REC-8750", markerId: "cluster-library", description: "Stewart Calculus Early Transcendentals 9th Edition textbook with highlighted chapters 4-7. Name inside front cover is illegible.", custody: "Held at Library Lost & Found counter", reportedBy: "Library Staff", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOb9qKUZTYX6K8CeAZzI3bQGJqQnn_ZrwUqDPP6s2BIT8AUFwTCvc6-qCROVL8k3S24MP3qjbCYqM-tUgAZs2luacmxmdW1sUn8n7rdBNXGFFuTh0W3I-IFbE1Oa7cyYpyKpvnCFuy-UiLx6H-GFS_72tyQXGusYIa-GEofqnf9WWlDeH9Pgezm6yKin86SR1-axwGKy0q1BWp2vMkFBlZ5G19W505xjN-MATGIAJXTRKNMQ9y4-i2YQ" },
  { id: 5, name: "Black Leather Wallet", location: "Central Library • 1st Floor", status: "Lost", category: "Wallet", date: "14 May 2025", tag: "REP-4320", markerId: "cluster-library", description: "Black leather bi-fold wallet. Contains student ID, metro card, and approximately Rs. 500. No bank cards.", custody: null, reportedBy: currentUser.name, image: null },
  { id: 6, name: "Wireless Earbuds (Sony WF-1000XM5)", location: "Auditorium Main Hall", status: "Lost", category: "Electronics", date: "14 May 2025", tag: "REP-4325", markerId: "item-ipad", description: "Black Sony WF-1000XM5 in charging case. Lost during the guest lecture event.", custody: null, reportedBy: currentUser.name, image: null },
  { id: 7, name: "University ID Card — Priya Sharma", location: "Main Canteen • Counter", status: "Found", category: "Documents", date: "14 May 2025", tag: "REC-8810", markerId: "item-keys", description: "University student ID card for Priya Sharma, ECE department, 2nd year.", custody: "Held at Security Desk", reportedBy: "Canteen Staff", image: null },
  { id: 8, name: "Blue Denim Jacket", location: "CS Block • Lab 3", status: "Found", category: "Clothing", date: "15 May 2025", tag: "REC-8815", markerId: "item-hydro", description: "Blue denim jacket, size M, left on chair in Lab 3 after the afternoon session.", custody: "Held at CS Block Office", reportedBy: "Lab Assistant", image: null },
];

export const mockClaims = [
  { id: "CLM-001", itemId: 1, itemName: "Silver iPad Air with Smart Keyboard", status: "Under Review", date: "13 May 2025", claimant: currentUser.name, notes: "I can confirm my lock screen and provide the serial number." },
  { id: "CLM-002", itemId: 2, itemName: "Keyring with Blue Lanyard", status: "Pending", date: "14 May 2025", claimant: currentUser.name, notes: "The lanyard has my department abbreviation CSE printed on it." },
  { id: "CLM-003", itemId: 7, itemName: "University ID Card — Priya Sharma", status: "Approved", date: "14 May 2025", claimant: "Priya Sharma", notes: "Identity verified at security desk." },
  { id: "CLM-004", itemId: 8, itemName: "Blue Denim Jacket", status: "Rejected", date: "15 May 2025", claimant: "Unknown Student", notes: "Description did not match the item." },
];

export const mockNotifications = [
  { id: 1, type: "match", title: "Possible match found", message: "A found iPad Air was reported near the Auditorium matching your lost Sony earbuds category.", time: "2 hours ago", read: false, link: "/browse" },
  { id: 2, type: "claim_submitted", title: "Claim submitted", message: "Your claim for 'Silver iPad Air with Smart Keyboard' has been submitted and is under review.", time: "1 day ago", read: false, link: "/claims" },
  { id: 3, type: "claim_approved", title: "Claim approved", message: "Your claim for 'Keyring with Blue Lanyard' has been approved. Visit Security Desk to collect.", time: "2 days ago", read: true, link: "/claims" },
  { id: 4, type: "info_requested", title: "More information requested", message: "The security desk needs additional proof of ownership for your iPad Air claim.", time: "3 days ago", read: true, link: "/claims" },
  { id: 5, type: "item_returned", title: "Item recovered", message: "The Stewart Calculus textbook has been successfully returned to its owner.", time: "5 days ago", read: true, link: "/reports" },
];

// Admin mock data
export const mockAdminStats = {
  totalReports: 142,
  activeReports: 42,
  resolvedThisMonth: 28,
  pendingClaims: 15,
  totalUsers: 1240,
  matchRate: "34%",
};

export const mockAdminUsers = [
  { id: "USR-2201", name: "Arjun Mehta", department: "CSE", year: "3rd", reports: 4, claims: 2, status: "Active" },
  { id: "USR-2202", name: "Priya Sharma", department: "ECE", year: "2nd", reports: 1, claims: 1, status: "Active" },
  { id: "USR-2203", name: "Rahul Desai", department: "ME", year: "4th", reports: 3, claims: 0, status: "Active" },
  { id: "USR-2204", name: "Sneha Iyer", department: "CSE", year: "2nd", reports: 2, claims: 1, status: "Active" },
  { id: "USR-2205", name: "Vikram Joshi", department: "Civil", year: "3rd", reports: 0, claims: 0, status: "Inactive" },
];

export const CATEGORIES = ["Electronics", "Documents", "Wallet", "Keys", "Clothing", "Accessories", "Other"];
export const ZONES = ["All Campus", "Central Library", "CS Block", "Main Canteen", "Auditorium", "Hostels"];
