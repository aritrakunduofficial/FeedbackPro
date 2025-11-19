// 'use client'

// import { useState } from 'react'
// import { usePathname, useRouter } from 'next/navigation'
// import {
//   LayoutDashboard,
//   Building2,
//   Users,
//   GraduationCap,
//   FileText,
//   HelpCircle,
//   Key,
//   BarChart3,
//   LogOut,
//   BookOpen,
//   UserCheck,
//   Menu,
//   X
// } from 'lucide-react'
// import { useAuth } from '../../context/AuthContext'

// export default function Sidebar() {
//   const pathname = usePathname()
//   const router = useRouter()
//   const { logout } = useAuth()
//   const [isOpen, setIsOpen] = useState(false)

//   const menuItems = [
//     { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
//     { icon: Building2, label: 'Departments', href: '/admin/departments' },
//     { icon: Users, label: 'Faculty', href: '/admin/faculty' },
//     { icon: BookOpen, label: 'Subjects', href: '/admin/subjects' },
//     { icon: UserCheck, label: 'Faculty Assign', href: '/admin/faculty-assignments' },
//     { icon: GraduationCap, label: 'Students', href: '/admin/students' },
//     { icon: FileText, label: 'Questionnaires', href: '/admin/questionnaires' },
//     { icon: HelpCircle, label: 'Questions', href: '/admin/questions' },
//     { icon: Key, label: 'Tokens', href: '/admin/tokens' },
//     { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' }
//   ]

//   const handleLogout = async () => {
//     await logout()
//     router.push('/auth/login')
//   }

//   return (
//     <>
//       {/* Mobile Toggle Button */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
//       >
//         {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//       </button>

//       {/* Sidebar */}
//       <aside
//         className={`
//           fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
//           transform transition-transform duration-300 ease-in-out
//           ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
//         `}
//       >
//         <div className="flex flex-col h-full">
//           {/* Header */}
//           <div className="p-6 border-b flex items-center justify-between">
//   <div>
//     <h1 className="text-xl font-bold text-gray-900">FeedbackPro</h1>
//     <p className="text-sm text-gray-600 mt-1">Admin Panel</p>
//   </div>

//   {/* Logout Icon */}
//   <button
//     onClick={handleLogout}
//     className="text-red-600 hover:text-red-800 transition-colors"
//     title="Logout"
//   >
//     <LogOut className="w-6 h-6" />
//   </button>
// </div>

//           {/* Navigation */}
//           <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//             {menuItems.map((item) => {
//               const Icon = item.icon
//               const isActive = pathname === item.href

//               return (
//                 <button
//                   key={item.href}
//                   onClick={() => {
//                     router.push(item.href)
//                     setIsOpen(false)
//                   }}
//                   className={`
//                     w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
//                     ${
//                       isActive
//                         ? "bg-blue-50 text-blue-600"
//                         : "text-gray-700 hover:bg-gray-50"
//                     }
//                   `}
//                 >
//                   <Icon className="w-5 h-5" />
//                   <span className="font-medium">{item.label}</span>
//                 </button>
//               )
//             })}
//           </nav>

//           {/* Logout */}
//           {/* <div className="p-4 border-t">
//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//             >
//               <LogOut className="w-5 h-5" />
//               <span className="font-medium">Logout</span>
//             </button>
//           </div> */}
//         </div>
//       </aside>

//       {/* Mobile dim overlay */}
//       {isOpen && (
//         <div
//           onClick={() => setIsOpen(false)}
//           className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
//         />
//       )}
//     </>
//   )
// }
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  FileText,
  HelpCircle,
  Key,
  BarChart3,
  LogOut,
  BookOpen,
  UserCheck,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Building2, label: "Departments", href: "/admin/departments" },
    { icon: Users, label: "Faculty", href: "/admin/faculty" },
    { icon: BookOpen, label: "Subjects", href: "/admin/subjects" },
    {
      icon: UserCheck,
      label: "Faculty Assign",
      href: "/admin/faculty-assignments",
    },
    { icon: GraduationCap, label: "Students", href: "/admin/students" },
    { icon: FileText, label: "Questionnaires", href: "/admin/questionnaires" },
    { icon: HelpCircle, label: "Questions", href: "/admin/questions" },
    { icon: Key, label: "Tokens", href: "/admin/tokens" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: Settings, label: "Feedback Types", href: "/admin/feedback-types" },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">FeedbackPro</h1>
              <p className="text-sm text-gray-600 mt-1">Admin Panel</p>
            </div>

            {/* Logout Icon */}
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Dim overlay when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}
    </>
  );
}
