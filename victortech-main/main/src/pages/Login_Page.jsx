"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Login_Page/logo.png"
import heroImage from "../assets/Login_Page/logo.png"
import { API_BASE_URL } from "../config/api"

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const role = localStorage.getItem("user_role")
    if (token) {
      if (role === "admin" || role === "owner") navigate("/dashboard", { replace: true })
      else if (role === "employee") navigate("/employee/schedule", { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname)
    const handlePopState = () => window.history.pushState(null, "", window.location.pathname)
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "auto" }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        if (data.access && data.refresh) {
          localStorage.setItem("access_token", data.access)
          localStorage.setItem("refresh_token", data.refresh)
          localStorage.setItem("user_id", data.user)
          localStorage.setItem("user_email", data.email)
          localStorage.setItem("user_role", data.role)
          localStorage.setItem("session_start", Date.now().toString())
          if (data.role === "admin" || data.role === "owner") navigate("/dashboard", { replace: true })
          else if (data.role === "employee") navigate("/employee/schedule", { replace: true })
          else navigate("/dashboard", { replace: true })
        } else {
          setError("Login failed. Please check your credentials and try again.")
        }
      } else {
        setError(data.message || "Login failed. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again later.")
    }
    setLoading(false)
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-sky-100 to-gray-200 overflow-hidden">
      {/* Hero Section */}
      <div className="relative w-full flex items-center justify-center" style={{ height: "38vh" }}>
        <img
          src={heroImage}
          alt="Workers"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="relative z-10 flex flex-col items-center">
          <img src={logo} alt="Logo" className="h-16 mb-4 drop-shadow-lg" />
          <h2 className="text-3xl font-extrabold text-white tracking-wide drop-shadow-lg">
            Welcome to VictorTech Payroll
          </h2>
        </div>
      </div>

      {/* Login Card */}
      <div
        className="relative z-20 flex-1 flex flex-col items-center justify-center"
        style={{
          marginTop: "-3.5rem",
        }}
      >
        <div className="w-full max-w-md bg-white/90 shadow-xl rounded-2xl px-8 py-10 backdrop-blur-md border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base
                           focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200
                           placeholder-gray-400 transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-base
                             focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200
                             placeholder-gray-400 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-medium">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-base font-bold text-white
                         bg-gradient-to-r from-sky-600 to-sky-800 hover:from-sky-700 hover:to-sky-900
                         transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400
                         shadow-md ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {loading ? "Logging In..." : "Log In"}
            </button>

            <div className="flex justify-between items-center mt-2">
              <a href="/forgot-password" className="text-sm text-sky-600 underline hover:text-sky-800 transition">
                Forgot password?
              </a>
              <span className="text-xs text-gray-400">v1.0.0</span>
            </div>
          </form>
        </div>
        <p className="mt-8 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} VictorTech. All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

export default LoginPage