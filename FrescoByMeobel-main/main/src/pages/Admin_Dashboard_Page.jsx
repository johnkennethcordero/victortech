"use client"
import { useEffect, useState } from "react"
import NavBar from "../components/Nav_Bar"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE_URL } from "../config/api"

function AdminDashboardPage() {
  const navigate = useNavigate()
  const [payrollData, setPayrollData] = useState({
    previous_payroll: "0.00",
    previous_paydate: "Loading...",
    upcoming_payroll: "0.00",
    upcoming_paydate: "Loading..."
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState({
    firstName: "",
    loading: true
  })

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const userId = localStorage.getItem("user_id")

        if (!userId || !token) {
          console.error("User ID or token not found")
          return
        }

        const response = await fetch(`${API_BASE_URL}/employment-info/employee-number/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) throw new Error("Failed to fetch user data")

        const userData = await response.json()
        setCurrentUser({
          firstName: userData.first_name || "User",
          loading: false
        })
      } catch (err) {
        console.error("Error fetching current user:", err)
        setCurrentUser({
          firstName: "User",
          loading: false
        })
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
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!totalPayrollRes.ok) throw new Error("Failed to fetch total payroll data")
        const totalPayrollData = await totalPayrollRes.json()

        const payslipRes = await fetch(`${API_BASE_URL}/payslip/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!payslipRes.ok) throw new Error("Failed to fetch payslip data")
        const payslipData = await payslipRes.json()

        const processedTransactions = payslipData.map(item => ({
          id: item.id,
          name: item.payroll_id?.employment_info_id
            ? `${item.payroll_id.employment_info_id.first_name} ${item.payroll_id.employment_info_id.last_name}`
            : "Unknown",
          role: item.payroll_id?.employment_info_id?.position || "Unknown",
          date: item.payroll_id?.pay_date
            ? new Date(item.payroll_id.pay_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })
            : "Unknown",
          formattedDate: item.payroll_id?.pay_date
            ? `${new Date(item.payroll_id.pay_date).toLocaleDateString('en-US', {
                month: 'short'
              })} ${new Date(item.payroll_id.pay_date).getDate()},\n${new Date(item.payroll_id.pay_date).getFullYear()}`
            : "Unknown",
          netPay: item.payroll_id?.net_pay
            ? `₱${parseFloat(item.payroll_id.net_pay).toLocaleString(undefined, {
                minimumFractionDigits: 2, maximumFractionDigits: 2
              })}`
            : "₱0.00",
          grossPay: item.payroll_id?.gross_pay
            ? `₱${parseFloat(item.payroll_id.gross_pay).toLocaleString(undefined, {
                minimumFractionDigits: 2, maximumFractionDigits: 2
              })}`
            : "₱0.00",
          totalDeductions: item.payroll_id?.total_deductions
            ? `₱${parseFloat(item.payroll_id.total_deductions).toLocaleString(undefined, {
                minimumFractionDigits: 2, maximumFractionDigits: 2
              })}`
            : "₱0.00",
          rate: item.payroll_id?.salary_id?.earnings_id?.basic_rate
            ? `₱${parseFloat(item.payroll_id.salary_id.earnings_id.basic_rate).toLocaleString(undefined, {
                minimumFractionDigits: 2, maximumFractionDigits: 2
              })}/MONTH`
            : "N/A",
          user_id: item.user_id,
          profilePicture: item.payroll_id?.employment_info_id?.profile_picture || null
        }))

        const formattedPayrollData = totalPayrollData.length > 0
          ? {
              previous_payroll: totalPayrollData[0].previous_payroll
                ? `₱${parseFloat(totalPayrollData[0].previous_payroll).toLocaleString(undefined, {
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                  })}`
                : "₱0.00",
              previous_paydate: totalPayrollData[0].previous_paydate
                ? new Date(totalPayrollData[0].previous_paydate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })
                : "N/A",
              upcoming_payroll: totalPayrollData[0].upcoming_payroll
                ? `₱${parseFloat(totalPayrollData[0].upcoming_payroll).toLocaleString(undefined, {
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                  })}`
                : "₱0.00",
              upcoming_paydate: totalPayrollData[0].upcoming_paydate
                ? new Date(totalPayrollData[0].upcoming_paydate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })
                : "N/A"
            }
          : {
              previous_payroll: "₱0.00",
              previous_paydate: "N/A",
              upcoming_payroll: "₱0.00",
              upcoming_paydate: "N/A"
            }

        setPayrollData(formattedPayrollData)
        setTransactions(processedTransactions)
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
    <div className="min-h-screen bg-gray-100">
      <NavBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-8 pt-3 sm:pt-10 pb-8">

        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <p className="text-lg sm:text-l text-gray-600">Welcome,</p>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            {currentUser.loading ? "Loading..." : currentUser.firstName}
          </h1>
        </div>

        {/* Payroll Summary Cards — mobile only, shown above table */}
        <div className="grid grid-cols-2 lg:hidden gap-3 mb-4">
          <div className="bg-[#333333] rounded-xl p-4 text-white">
            <p className="text-xs opacity-70 mb-1">Previous Payroll</p>
            <p className="text-xs opacity-60 mb-2">{payrollData.previous_paydate}</p>
            <p className="text-sm font-bold">{payrollData.previous_payroll}</p>
          </div>
          <div className="bg-[#333333] rounded-xl p-4 text-white">
            <p className="text-xs opacity-70 mb-1">Upcoming Payroll</p>
            <p className="text-xs opacity-60 mb-2">{payrollData.upcoming_paydate}</p>
            <p className="text-sm font-bold">{payrollData.upcoming_payroll}</p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-[#333333] rounded-xl p-4 sm:p-6 text-white">
              <h2 className="text-sm sm:text-base font-semibold mb-4">Payroll Overview</h2>

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
                  <div className="grid grid-cols-12 gap-1 sm:gap-2 mb-3 border-b border-white/10 pb-2">
                    <div className="col-span-4 font-semibold text-xs opacity-70">Employee</div>
                    <div className="col-span-2 text-center font-semibold text-xs opacity-70">Date</div>
                    <div className="col-span-2 text-right font-semibold text-xs opacity-70">Gross</div>
                    <div className="col-span-2 text-right font-semibold text-xs opacity-70">Deduct.</div>
                    <div className="col-span-2 text-right font-semibold text-xs opacity-70">Net</div>
                  </div>

                  {/* Transaction List */}
                  <div className="overflow-y-auto max-h-64 sm:max-h-80 pr-1">
                    <div className="space-y-4 sm:space-y-5">
                      {transactions.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-sm opacity-60">No transaction records found.</p>
                        </div>
                      ) : (
                        transactions.map((transaction) => (
                          <div key={transaction.id} className="grid grid-cols-12 gap-1 sm:gap-2 items-center">
                            <div className="col-span-4 flex items-center gap-2">
                              <div className="h-7 w-7 sm:h-9 sm:w-9 flex-shrink-0">
                                {transaction.profilePicture ? (
                                  <img
                                    src={transaction.profilePicture}
                                    alt={transaction.name}
                                    className="rounded-full h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="bg-yellow-500 rounded-full h-full w-full flex items-center justify-center text-white text-xs font-bold">
                                    {transaction.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-xs truncate">{transaction.name}</p>
                                <p className="text-xs opacity-60 truncate hidden sm:block">{transaction.role}</p>
                              </div>
                            </div>
                            <div className="col-span-2 text-center whitespace-pre-line text-xs opacity-80">
                              {transaction.formattedDate}
                            </div>
                            <div className="col-span-2 text-right text-xs">{transaction.grossPay}</div>
                            <div className="col-span-2 text-right text-xs">{transaction.totalDeductions}</div>
                            <div className="col-span-2 text-right">
                              <p className="text-xs font-medium">{transaction.netPay}</p>
                              <p className="text-xs opacity-60 hidden sm:block">{transaction.rate}</p>
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
            <div className="bg-[#333333] rounded-xl p-6 text-white">
              <h3 className="text-sm font-medium opacity-80 mb-1">Previous Payroll</h3>
              <p className="text-xs opacity-60 mb-3">{payrollData.previous_paydate}</p>
              <p className="text-xl font-bold">{payrollData.previous_payroll}</p>
            </div>
            <div className="bg-[#333333]/60 rounded-xl p-6 text-white">
              <h3 className="text-sm font-medium opacity-80 mb-1">Upcoming Payroll</h3>
              <p className="text-xs opacity-60 mb-3">{payrollData.upcoming_paydate}</p>
              <p className="text-xl font-bold">{payrollData.upcoming_payroll}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage