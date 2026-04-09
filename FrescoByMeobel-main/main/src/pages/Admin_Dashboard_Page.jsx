"use client"
import { useEffect, useState } from "react"
import NavBar from "../components/Nav_Bar"
import { Users, DollarSign, Clock, Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE_URL } from "../config/api"

function AdminDashboardPage() {
  const navigate = useNavigate()
  const [payrollData, setPayrollData] = useState({
    previous_payroll: "£12,450.00",
    previous_paydate: "December 15, 2025",
    upcoming_payroll: "£13,200.00",
    upcoming_paydate: "January 15, 2026"
  })
  const [totalEmployees, setTotalEmployees] = useState("Loading...")
  const [transactions, setTransactions] = useState([
    { id: 1, name: "Paula Peena",  formattedDate: "Dec 24, 2025", netPay: "£2,450.00" },
    { id: 2, name: "Leena Jarvis", formattedDate: "Feb 17, 2026", netPay: "£2,350.00" },
    { id: 3, name: "John Smith",   formattedDate: "Feb 10, 2026", netPay: "£2,500.00" },
    { id: 4, name: "Emily Chen",   formattedDate: "Jan 27, 2026", netPay: "£2,200.00" },
    { id: 5, name: "David Lee",    formattedDate: "Feb 3, 2026",  netPay: "£2,800.00" },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState({ firstName: "", loading: true })

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const userId = localStorage.getItem("user_id")
        if (!userId || !token) return

        const response = await fetch(`${API_BASE_URL}/employment-info/employee-number/${userId}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        })
        if (!response.ok) throw new Error("Failed to fetch user data")
        const userData = await response.json()
        setCurrentUser({ firstName: userData.first_name || "User", loading: false })
      } catch (err) {
        console.error("Error fetching current user:", err)
        setCurrentUser({ firstName: "User", loading: false })
      }
    }
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("access_token")

        const totalPayrollRes = await fetch(`${API_BASE_URL}/total-payroll/`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        })
        if (!totalPayrollRes.ok) throw new Error("Failed to fetch total payroll data")
        const totalPayrollData = await totalPayrollRes.json()

        const employeesRes = await fetch(`${API_BASE_URL}/employment-info/`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        })
        if (!employeesRes.ok) throw new Error("Failed to fetch employees data")
        const employeesData = await employeesRes.json()
        setTotalEmployees(employeesData.length.toString())

        const formattedPayrollData = totalPayrollData.length > 0
          ? {
              previous_payroll: totalPayrollData[0].previous_payroll
                ? `?${parseFloat(totalPayrollData[0].previous_payroll).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "?0.00",
              previous_paydate: totalPayrollData[0].previous_paydate
                ? new Date(totalPayrollData[0].previous_paydate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : "N/A",
              upcoming_payroll: totalPayrollData[0].upcoming_payroll
                ? `?${parseFloat(totalPayrollData[0].upcoming_payroll).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "?0.00",
              upcoming_paydate: totalPayrollData[0].upcoming_paydate
                ? new Date(totalPayrollData[0].upcoming_paydate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : "N/A",
            }
          : { previous_payroll: "?0.00", previous_paydate: "N/A", upcoming_payroll: "?0.00", upcoming_paydate: "N/A" }

        setPayrollData(formattedPayrollData)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300">
      <NavBar />

      {/* Dashboard Title */}
      <div className="container mx-auto px-4 sm:px-8 -mt-16">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-700 dark:text-gray-100">
            Hi, {currentUser.loading ? "Loading..." : currentUser.firstName}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage your payroll efficiently
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-8 pt-0 pb-24">

        {/* Payroll Cards - Horizontal */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Previous Payroll */}
          <div className="bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-4 sm:p-6 shadow-sm text-gray-900 dark:text-gray-100">
            <h3 className="text-sm font-medium opacity-80 mb-1">Previous Payroll</h3>
            <p className="text-xs opacity-60 mb-3">{payrollData.previous_paydate}</p>
            <p className="text-2xl font-bold">{payrollData.previous_payroll}</p>
          </div>

          {/* Upcoming Payroll */}
          <div className="bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-4 sm:p-6 shadow-sm text-gray-900 dark:text-gray-100">
            <h3 className="text-sm font-medium opacity-80 mb-1">Upcoming Payroll</h3>
            <p className="text-xs opacity-60 mb-3">{payrollData.upcoming_paydate}</p>
            <p className="text-2xl font-bold">{payrollData.upcoming_payroll}</p>
          </div>
        </div>

        {/* Payroll Chart Section */}
        <div className="mb-6">
          <div className="bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-4 sm:p-6 shadow-sm text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium opacity-80 mb-4">Payroll Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Previous Payroll</p>
                    </div>
                    <p className="text-sm font-medium">{payrollData.previous_payroll}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Upcoming Payroll</p>
                    </div>
                    <p className="text-sm font-medium">{payrollData.upcoming_payroll}</p>
                  </div>
                </div>
              </div>
              <div className="ml-6">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-500 to-blue-500 opacity-20"></div>
                  <div className="absolute inset-2 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-200">Payroll</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-4 sm:p-6 shadow-sm text-gray-900 dark:text-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-medium opacity-80">Payroll Overview</h2>
                <button
                  onClick={() => navigate('/payroll')}
                  className="text-xs text-[#5C7346] hover:text-[#4a5c38] transition-colors underline"
                >
                  View All
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-sm opacity-70">Loading...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              ) : (
                <>
                  {/* Column Headers */}
                  <div className="grid grid-cols-12 gap-1 sm:gap-2 mb-3 border-b border-gray-200 dark:border-dark-border pb-2">
                    <div className="col-span-8 font-semibold text-xs opacity-70">Employee</div>
                    <div className="col-span-4 text-right font-semibold text-xs opacity-70">Net Pay</div>
                  </div>

                  {/* Transaction List */}
                  <div className="pr-1">
                    <div className="space-y-4 sm:space-y-5">
                      {transactions.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-sm opacity-60">No transaction records found.</p>
                        </div>
                      ) : (
                        transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="grid grid-cols-12 gap-1 sm:gap-2 items-center pb-4 border-b border-gray-200 dark:border-dark-border"
                          >
                            <div className="col-span-8">
                              <p className="font-medium text-lg truncate">{transaction.name}</p>
                              <p className="text-base opacity-60 whitespace-pre-line">{transaction.formattedDate}</p>
                            </div>
                            <div className="col-span-4 text-right">
                              <p className="font-medium text-lg">{transaction.netPay}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payroll Cards — desktop only */}
          <div className="hidden lg:flex flex-col gap-6">
            <div className="bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm text-gray-900 dark:text-gray-100">
              <h3 className="text-sm font-medium opacity-80 mb-1">Previous Payroll</h3>
              <p className="text-xs opacity-60 mb-3">{payrollData.previous_paydate}</p>
              <p className="text-2xl font-bold">{payrollData.previous_payroll}</p>
            </div>
            <div className="bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm text-gray-900 dark:text-gray-100">
              <h3 className="text-sm font-medium opacity-80 mb-1">Upcoming Payroll</h3>
              <p className="text-xs opacity-60 mb-3">{payrollData.upcoming_paydate}</p>
              <p className="text-2xl font-bold">{payrollData.upcoming_payroll}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage