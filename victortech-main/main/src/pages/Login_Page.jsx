"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/Login_Page/logo.png"
import leaf_1 from "../assets/Login_Page/leaf-1.png"
import leaf_2 from "../assets/Login_Page/leaf-2.png"
import leaf_3 from "../assets/Login_Page/leaf-3.png"
import { API_BASE_URL } from "../config/api"

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const role = localStorage.getItem("user_role")

    if (token) {
      if (role === "admin" || role === "owner") {
        navigate("/dashboard", { replace: true })
      } else if (role === "employee") {
        navigate("/employee/schedule", { replace: true })
      }
    }
  }, [navigate])

  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname)

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.pathname)
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

          if (data.role === "admin" || data.role === "owner") {
            navigate("/dashboard", { replace: true })
          } else if (data.role === "employee") {
            navigate("/employee/schedule", { replace: true })
          } else {
            navigate("/dashboard", { replace: true })
          }
        } else {
          setError("Login failed. Please check your credentials and try again.")
        }
      } else {
        setError(data.message || "Login failed. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again later.")
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  return (
    <div className="min-h-screen w-full relative bg-white flex flex-col items-center justify-center p-5">
      <div className="mb-5">
        <img src={logo} alt="Fresco Logo" className="w-40 sm:w-60 object-contain" />
      </div>

      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-[384px] absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h2 className="text-xl font-bold text-center text-gray-700 mb-6 sm:mb-10">Payroll Log In</h2>
          <div className="bg-white rounded-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                          focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                          focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Log In
              </button>
              <div className="text-sm underline text-center">
                <a href="/forgot-password" className="font-medium text-gray-600 hover:text-gray-900">
                  Forgot password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>

      <p className="fixed bottom-4 left-0 right-0 text-xs text-gray-400 text-center">
        © {new Date().getFullYear()} VictorTech.All Rights Reserved.
      </p>
    </div>
  )
}

export default LoginPage