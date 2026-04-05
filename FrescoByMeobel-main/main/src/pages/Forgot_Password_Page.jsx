import { useState, useEffect } from "react"
import { API_BASE_URL } from "../config/api"

import logo from "../assets/Login_Page/logo.png"
import leaf_1 from "../assets/Login_Page/leaf-1.png"
import leaf_2 from "../assets/Login_Page/leaf-2.png"
import leaf_3 from "../assets/Login_Page/leaf-3.png"

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-password-reset-link/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (response.ok) {
        setMessage("A reset link will be sent to your email." +
            "If you do not see an email, kindly check your spams ")
      } else {
        setError(data.error || "Something went wrong. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  return (
    <div className="min-h-screen w-full relative bg-white flex flex-col items-center justify-center p-5">
      {/* Logo */}
      <div className="mb-8">
        <img src={logo} alt="Fresco Logo" className="w-40 sm:w-60 object-contain" />
      </div>

      {/* Forgot Password Form */}
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-[384px] absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-xl font-bold text-center text-gray-800 mb-6 sm:mb-10">
            Forgot Password?
          </h1>
          <div className="bg-white rounded-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                          focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              {message && <div className="text-green-600 text-sm">{message}</div>}
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <div className="text-sm underline text-center">
                <a href="/" className="font-medium text-gray-600 hover:text-gray-900">
                  Back to Login
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="fixed bottom-4 left-0 right-0 text-xs text-gray-400 text-center">
        © {new Date().getFullYear()} VictorTech. All Rights Reserved.
      </p>
    </div>
  )
}

export default ForgotPasswordPage