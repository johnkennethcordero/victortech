"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Login_Page/logo.png"
import heroImage from "../assets/Login_Page/overlay.jpg"
import { API_BASE_URL } from "../config/api"

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")

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
  }

  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden">

      {/* Hero Image with black overlay + logo + title on top */}
      <div className="relative w-full" style={{ height: "40vh" }}>
        <img
          src={heroImage}
          alt="Workers"
          className="w-full h-full object-cover object-center"
        />
        {/* Black overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Logo at very top */}
        <div className="absolute top-6 left-0 right-0 flex justify-center">
          <img src={logo} alt="Logo" className="h-14 object-contain" />
        </div>

        {/* Title at bottom */}
        <div className="absolute bottom-24 left-0 right-0 flex justify-center">
          <h2 className="text-2xl font-bold text-white tracking-wide">Payroll Log In</h2>
        </div>
      </div>

      {/* White card — pulled up higher */}
      <div
        className="relative z-10 flex-1 bg-white flex flex-col px-8 pt-8 pb-6"
        style={{
          borderTopLeftRadius: "2rem",
          borderTopRightRadius: "2rem",
          marginTop: "-3.5rem",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-sm mx-auto">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                         placeholder-gray-400 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                           placeholder-gray-400 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white
                       bg-gray-800 hover:bg-gray-900 transition focus:outline-none
                       focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
          >
            Log In
          </button>

          <div className="text-center">
            <a href="/forgot-password" className="text-sm text-gray-500 underline hover:text-gray-800 transition">
              Forgot password?
            </a>
          </div>
        </form>

        <p className="fixed bottom-4 left-0 right-0 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} VictorTech. All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

export default LoginPage