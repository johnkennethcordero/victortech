"use client"

import { useState, useEffect, useRef } from "react"
import { UserCircle, LogOut, LayoutDashboard, Users, Clock, DollarSign, CalendarDays, ScrollText, Calendar, Receipt, LogOut as LogOutIcon, Home, Wallet, Moon, Sun } from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import logo from "../assets/Login_Page/logo.png"
import { API_BASE_URL } from "../config/api"
import { getTypographyClass, getButtonTypographyClass } from "../utils/typography"

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
    case "Home":            return <Home className={cls} />
    case "Dashboard":       return <LayoutDashboard className={cls} />
    case "Employees":       return <Users className={cls} />
    case "Attendance":      return <Clock className={cls} />
    case "Payroll":         return <Wallet className={cls} />
    case "Master Calendar": return <CalendarDays className={cls} />
    case "Activity Logs":   return <ScrollText className={cls} />
    case "Schedule":        return <Calendar className={cls} />
    case "Payslip":         return <Receipt className={cls} />
    default:                return <LayoutDashboard className={cls} />
  }
}

function NavBar() {
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState("")
  const [userAvatar, setUserAvatar] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage so the preference persists across page loads
    return localStorage.getItem("darkMode") === "true"
  })
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Apply/remove the `dark` class on <html> whenever darkMode changes,
  // and persist the preference to localStorage.
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("darkMode", darkMode)
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode((prev) => !prev)

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
        { name: "Home",            href: "/dashboard" },
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
  const MAX_BOTTOM = 5
  const bottomLinks = navLinks.slice(0, MAX_BOTTOM)

  return (
    <>
      {/* ── TOP NAV (desktop only) ── */}
      <nav className="bg-white dark:bg-dark-bg text-black dark:text-white p-4 shadow hidden md:block font-sans transition-colors duration-300">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`${getTypographyClass('body')} font-medium hover:text-gray-500 dark:hover:text-gray-300 transition-colors`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <Link to={userRole === "employee" ? "/employee/schedule" : "/dashboard"}>
            <img src={logo} alt="Logo" className="w-40 object-contain" />
          </Link>

          <div className="flex items-center gap-4">
            {/* Dark mode toggle — desktop */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode
                ? <Sun  className="h-5 w-5 text-yellow-400" />
                : <Moon className="h-5 w-5 text-gray-600"   />
              }
            </button>

            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className={`${getTypographyClass('body')} font-medium`}>{userName}</span>
                <UserAvatar src={userAvatar} size="h-8 w-8" />
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-md shadow-lg py-1 z-10 border border-gray-100 dark:border-dark-border">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2 text-red-500" />
                    <span className={`${getTypographyClass('body')} font-medium`}>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOP BAR (logo + avatar) ── */}
      <nav className="bg-white dark:bg-dark-bg text-black dark:text-white px-4 py-3 flex items-center justify-between md:hidden font-sans transition-colors duration-300">
        {/* Dark mode toggle — mobile */}
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="flex items-center focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode
            ? <Sun  className="h-6 w-6 text-white" />
            : <Moon className="h-6 w-6 text-gray-700" />
          }
        </button>

        <Link to={userRole === "employee" ? "/employee/schedule" : "/dashboard"}>
          <img src={logo} alt="Logo" className="w-32 object-contain" />
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center focus:outline-none"
        >
          <UserAvatar src={userAvatar} size="h-8 w-8" />
        </button>
      </nav>

      {/* Mobile slide-down account menu (logout) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-dark-bg px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-dark-border transition-colors duration-300">
          <div className="flex items-center gap-2">
            <UserAvatar src={userAvatar} size="h-9 w-9" />
            <span className="font-inter text-base font-medium text-gray-700 dark:text-gray-200">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-red-500 hover:text-red-700 font-medium"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="font-inter text-sm text-red-500 hover:text-red-700 font-medium">Logout</span>
          </button>
        </div>
      )}

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border flex md:hidden font-sans pt-2 pb-7 transition-colors duration-300">
        {bottomLinks.map((link) => {
          const isActive =
            location.pathname === link.href ||
            (link.href !== "/" && location.pathname.startsWith(link.href))
          return (
            <Link
              key={link.name}
              to={link.href}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              {getIcon(link.name, isActive)}
              <span
                className={`${getTypographyClass('micro')} leading-tight ${
                  isActive ? "text-[#5C7346] font-semibold" : "text-gray-400"
                }`}
              >
                {link.name === "Master Calendar" ? "Calendar" :
                 link.name === "Activity Logs"   ? "Logs"     :
                 link.name}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Spacer so page content doesn't hide behind bottom bar */}
      <div className="h-32 md:hidden" />
    </>
  )
}

export default NavBar