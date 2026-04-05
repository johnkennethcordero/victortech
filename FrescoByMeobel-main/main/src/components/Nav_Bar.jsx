"use client"

import { useState, useEffect, useRef } from "react"
import { UserCircle, LogOut, Menu, X, LayoutDashboard, Users, Clock, DollarSign, CalendarDays, ScrollText, Calendar, Receipt } from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import logo from "../assets/Login_Page/logo.png"
import { API_BASE_URL } from "../config/api"

const UserAvatar = ({ src, size = "h-8 w-8" }) => {
  const [imgError, setImgError] = useState(false)
  if (src && !imgError) {
    return (
      <img
        src={src}
        alt="Profile"
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover border border-gray-300`}
      />
    )
  }
  return <UserCircle className={`${size} text-gray-500`} />
}

// Map route names to lucide icons
const getIcon = (name, active) => {
  const cls = `h-5 w-5 mx-auto mb-0.5 ${active ? "text-[#5C7346]" : "text-gray-400"}`
  switch (name) {
    case "Dashboard":    return <LayoutDashboard className={cls} />
    case "Employees":    return <Users className={cls} />
    case "Attendance":   return <Clock className={cls} />
    case "Payroll":      return <DollarSign className={cls} />
    case "Master Calendar": return <CalendarDays className={cls} />
    case "Activity Logs":   return <ScrollText className={cls} />
    case "Schedule":     return <Calendar className={cls} />
    case "Payslip":      return <Receipt className={cls} />
    default:             return <LayoutDashboard className={cls} />
  }
}

function NavBar() {
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState("")
  const [userAvatar, setUserAvatar] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const role = localStorage.getItem("user_role")
    setUserRole(role)

    const fetchUserData = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const userId = localStorage.getItem("user_id")
        if (!accessToken || !userId) return

        const response = await fetch(`${API_BASE_URL}/employment-info/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const employmentData = await response.json()
          const userEmploymentInfo = employmentData.find(
            (info) => info.user && info.user.id === Number.parseInt(userId)
          )

          if (userEmploymentInfo) {
            setUserName(userEmploymentInfo.first_name || "User")
            const photo =
              userEmploymentInfo.profile_picture ||
              userEmploymentInfo.avatar ||
              userEmploymentInfo.photo ||
              userEmploymentInfo.image ||
              userEmploymentInfo.user?.profile_picture ||
              userEmploymentInfo.user?.avatar ||
              null

            if (photo) {
              setUserAvatar(photo.startsWith("http") ? photo : `${API_BASE_URL}${photo}`)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_email")
    localStorage.removeItem("user_role")
    localStorage.removeItem("session_start")
    window.history.pushState(null, "", "/")
    navigate("/", { replace: true })
  }

  const getNavLinks = () => {
    if (userRole === "admin" || userRole === "owner" || !userRole) {
      return [
        { name: "Dashboard",       href: "/dashboard" },
        { name: "Employees",       href: "/employee" },
        { name: "Attendance",      href: "/attendance" },
        { name: "Payroll",         href: "/payroll" },
        { name: "Master Calendar", href: "/master-calendar" },
        { name: "Activity Logs",   href: "/activity-logs" },
      ]
    } else if (userRole === "employee") {
      return [
        { name: "Schedule", href: "/employee/schedule" },
        { name: "Payslip",  href: `/employee-payslip/${localStorage.getItem("user_id") || ""}` },
      ]
    }
    return []
  }

  const navLinks = getNavLinks()

  // For bottom nav, show max 5 items; if more, last slot becomes "More" toggle
  const MAX_BOTTOM = 5
  const bottomLinks = navLinks.slice(0, MAX_BOTTOM)
  const overflowLinks = navLinks.slice(MAX_BOTTOM)

  return (
    <>
      {/* ── TOP NAV (desktop only) ── */}
      <nav className="bg-white text-black p-4 shadow hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <Link to={userRole === "employee" ? "/employee/schedule" : "/dashboard"}>
            <img src={logo} alt="Logo" className="w-40 object-contain" />
          </Link>

          <div className="flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.href} className="font-medium hover:text-gray-500">
                {link.name}
              </Link>
            ))}

            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="font-medium">{userName}</span>
                <UserAvatar src={userAvatar} size="h-8 w-8" />
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2 text-red-500" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOP BAR (logo + avatar) ── */}
      <nav className="bg-white text-black px-4 py-3 shadow flex items-center justify-between md:hidden">
        <Link to={userRole === "employee" ? "/employee/schedule" : "/dashboard"}>
          <img src={logo} alt="Logo" className="w-32 object-contain" />
        </Link>

        {/* Avatar only, tapping opens slide-down for logout */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center focus:outline-none"
        >
          <UserAvatar src={userAvatar} size="h-8 w-8" />
        </button>
      </nav>

      {/* Mobile slide-down account menu (logout) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserAvatar src={userAvatar} size="h-9 w-9" />
            <span className="font-medium text-gray-700">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-red-500 hover:text-red-700 font-medium"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </button>
        </div>
      )}

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex md:hidden">
        {bottomLinks.map((link) => {
          const isActive = location.pathname === link.href ||
            (link.href !== "/" && location.pathname.startsWith(link.href))
          return (
            <Link
              key={link.name}
              to={link.href}
              className="flex-1 flex flex-col items-center justify-center py-2 text-center"
            >
              {getIcon(link.name, isActive)}
              <span className={`text-[10px] leading-tight ${isActive ? "text-[#5C7346] font-semibold" : "text-gray-400"}`}>
                {link.name === "Master Calendar" ? "Calendar" :
                 link.name === "Activity Logs"   ? "Logs"     :
                 link.name}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Spacer so page content doesn't hide behind bottom bar */}
      <div className="h-16 md:hidden" />
    </>
  )
}

export default NavBar