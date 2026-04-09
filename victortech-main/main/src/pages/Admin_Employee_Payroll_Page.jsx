"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar.jsx"
import EditPayroll from "../components/Edit_Payroll.jsx"
import { API_BASE_URL } from "../config/api"
import { useNavigate } from "react-router-dom"

function AdminEmployeePayrollPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [payrollData, setPayrollData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const recordsPerPage = 5
  const [yearFilter, setYearFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  const fetchPayrollData = async () => {
    try {
      setLoading(true)
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      const employeeResponse = await fetch(`${API_BASE_URL}/employment-info/`, { headers })
      if (!employeeResponse.ok) throw new Error("Failed to fetch employees")
      const employeeData = await employeeResponse.json()
      const activeEmployees = employeeData.filter((employee) => employee.active !== false)
      setEmployees(activeEmployees)

      const payrollMap = new Map()

      const payrollResponse = await fetch(`${API_BASE_URL}/payroll/`, { headers })
      let payrollRecords = []
      if (payrollResponse.ok) payrollRecords = await payrollResponse.json()

      const salaryResponse = await fetch(`${API_BASE_URL}/salary/`, { headers })
      let salaryRecords = []
      if (salaryResponse.ok) salaryRecords = await salaryResponse.json()

      const earningsResponse = await fetch(`${API_BASE_URL}/earnings/`, { headers })
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json()
        earningsData.forEach((earning) => {
          const userId = earning.user
          if (!payrollMap.has(userId)) {
            payrollMap.set(userId, { userId, base_salary: Number.parseFloat(earning.basic_rate) || 0, earnings: earning })
          } else {
            payrollMap.get(userId).base_salary = Number.parseFloat(earning.basic_rate) || 0
            payrollMap.get(userId).earnings = earning
          }
        })
      }

      const deductionsResponse = await fetch(`${API_BASE_URL}/deductions/`, { headers })
      if (deductionsResponse.ok) {
        const deductionsData = await deductionsResponse.json()
        deductionsData.forEach((deduction) => {
          const userId = deduction.user
          const totalDeductions =
            Number.parseFloat(deduction.wtax || 0) +
            Number.parseFloat(deduction.nowork || 0) +
            Number.parseFloat(deduction.loan || 0) +
            Number.parseFloat(deduction.charges || 0) +
            Number.parseFloat(deduction.msfcloan || 0) || 0
          if (!payrollMap.has(userId)) {
            payrollMap.set(userId, { userId, deductions: totalDeductions, deductionsData: deduction })
          } else {
            payrollMap.get(userId).deductions = totalDeductions
            payrollMap.get(userId).deductionsData = deduction
          }
        })
      }

      const sssResponse = await fetch(`${API_BASE_URL}/benefits/sss/`, { headers })
      if (sssResponse.ok) {
        const sssData = await sssResponse.json()
        sssData.forEach((sss) => {
          const userId = sss.user
          if (payrollMap.has(userId)) {
            payrollMap.get(userId).sssData = sss
            if (payrollMap.get(userId).deductions !== undefined)
              payrollMap.get(userId).deductions += Number.parseFloat(sss.employee_share || 0)
          } else {
            payrollMap.set(userId, { userId, sssData: sss, deductions: Number.parseFloat(sss.employee_share || 0) })
          }
        })
      }

      const philhealthResponse = await fetch(`${API_BASE_URL}/benefits/philhealth/`, { headers })
      if (philhealthResponse.ok) {
        const philhealthData = await philhealthResponse.json()
        philhealthData.forEach((philhealth) => {
          const userId = philhealth.user
          if (payrollMap.has(userId)) {
            payrollMap.get(userId).philhealthData = philhealth
            if (payrollMap.get(userId).deductions !== undefined)
              payrollMap.get(userId).deductions += Number.parseFloat(philhealth.total_contribution || 0)
          } else {
            payrollMap.set(userId, { userId, philhealthData: philhealth, deductions: Number.parseFloat(philhealth.total_contribution || 0) })
          }
        })
      }

      const pagibigResponse = await fetch(`${API_BASE_URL}/benefits/pagibig/`, { headers })
      if (pagibigResponse.ok) {
        const pagibigData = await pagibigResponse.json()
        pagibigData.forEach((pagibig) => {
          const userId = pagibig.user
          if (payrollMap.has(userId)) {
            payrollMap.get(userId).pagibigData = pagibig
            if (payrollMap.get(userId).deductions !== undefined)
              payrollMap.get(userId).deductions += Number.parseFloat(pagibig.employee_share || 0)
          } else {
            payrollMap.set(userId, { userId, pagibigData: pagibig, deductions: Number.parseFloat(pagibig.employee_share || 0) })
          }
        })
      }

      const overtimeResponse = await fetch(`${API_BASE_URL}/totalovertime/`, { headers })
      if (overtimeResponse.ok) {
        const overtimeData = await overtimeResponse.json()
        overtimeData.forEach((overtime) => {
          const userId = overtime.user
          if (payrollMap.has(userId)) {
            const payrollEntry = payrollMap.get(userId)
            payrollEntry.overtimeTotal = Number.parseFloat(overtime.total_overtime) || 0
            payrollEntry.overtimeData = overtime
          }
        })
      }

      const payrollDataArr = []
      activeEmployees.forEach((employee) => {
        const userId = employee.user?.id
        if (userId) {
          const userPayroll = payrollRecords.find((record) => record.user_id === userId)
          const userSalary = salaryRecords.find((record) => record.user === userId)

          if (userPayroll) {
            payrollDataArr.push({
              id: employee.id,
              employee_id: employee.employee_number,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              position: employee.position || "Staff",
              base_salary: Number.parseFloat(userPayroll.gross_pay) || 0,
              deductions: Number.parseFloat(userPayroll.total_deductions) || 0,
              net_salary: Number.parseFloat(userPayroll.net_pay) || 0,
              status: userPayroll.status || "Pending",
              rate_per_month: userSalary ? userSalary.rate_per_month : "0",
              user: employee.user,
              payrollRecord: userPayroll,
              salaryRecord: userSalary,
              earnings: payrollMap.get(userId)?.earnings,
              deductionsData: payrollMap.get(userId)?.deductionsData,
              overtimeData: payrollMap.get(userId)?.overtimeData,
              sssData: payrollMap.get(userId)?.sssData,
              philhealthData: payrollMap.get(userId)?.philhealthData,
              pagibigData: payrollMap.get(userId)?.pagibigData,
            })
          } else if (payrollMap.has(userId)) {
            const payrollInfo = payrollMap.get(userId)
            const grossSalary = (payrollInfo.base_salary || 0) + (payrollInfo.overtimeTotal || 0)
            const deductions = payrollInfo.deductions || 0
            payrollDataArr.push({
              id: employee.id,
              employee_id: employee.employee_number,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              position: employee.position || "Staff",
              base_salary: grossSalary,
              deductions,
              net_salary: grossSalary - deductions,
              status: "Pending",
              rate_per_month: payrollInfo.base_salary?.toString() || "0",
              user: employee.user,
              earnings: payrollInfo.earnings,
              deductionsData: payrollInfo.deductionsData,
              overtimeData: payrollInfo.overtimeData,
              sssData: payrollInfo.sssData,
              philhealthData: payrollInfo.philhealthData,
              pagibigData: payrollInfo.pagibigData,
            })
          } else {
            payrollDataArr.push({
              id: employee.id,
              employee_id: employee.employee_number,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              position: employee.position || "Staff",
              base_salary: 0, allowances: 0, deductions: 0, net_salary: 0,
              status: "Pending", rate_per_month: "0", user: employee.user,
            })
          }
        }
      })

      setPayrollData(payrollDataArr)
    } catch (error) {
      console.error("Error fetching payroll data:", error)
      setError("An error occurred while fetching payroll data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayrollData() }, [])

  const handleEditPayroll = (employeeId) => {
    const employee = payrollData.find((emp) => emp.id === employeeId)
    if (employee) {
      const originalEmployee = employees.find((emp) => emp.id === employeeId)
      setSelectedEmployee({ ...employee, user: originalEmployee?.user || null })
      setIsEditModalOpen(true)
    }
  }

  const handleGoToPayslip = (UserId) => navigate(`/admin-payslip/${UserId}`)

  const handleDeletePayroll = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee's payroll information? This action cannot be undone.")) return
    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
      const employee = payrollData.find((emp) => emp.id === employeeId)
      if (!employee || !employee.user?.id) { alert("Cannot find employee data"); return }

      const deletionPromises = []
      if (employee.payrollRecord?.id)   deletionPromises.push(fetch(`${API_BASE_URL}/payroll/${employee.payrollRecord.id}/`, { method: "DELETE", headers }))
      if (employee.earnings?.id)        deletionPromises.push(fetch(`${API_BASE_URL}/earnings/${employee.earnings.id}/`, { method: "DELETE", headers }))
      if (employee.deductionsData?.id)  deletionPromises.push(fetch(`${API_BASE_URL}/deductions/${employee.deductionsData.id}/`, { method: "DELETE", headers }))
      if (employee.overtimeData?.id)    deletionPromises.push(fetch(`${API_BASE_URL}/totalovertime/${employee.overtimeData.id}/`, { method: "DELETE", headers }))
      if (employee.salaryRecord?.id)    deletionPromises.push(fetch(`${API_BASE_URL}/salary/${employee.salaryRecord.id}/`, { method: "DELETE", headers }))
      if (employee.sssData?.id)         deletionPromises.push(fetch(`${API_BASE_URL}/benefits/sss/${employee.sssData.id}/`, { method: "DELETE", headers }))
      if (employee.philhealthData?.id)  deletionPromises.push(fetch(`${API_BASE_URL}/benefits/philhealth/${employee.philhealthData.id}/`, { method: "DELETE", headers }))
      if (employee.pagibigData?.id)     deletionPromises.push(fetch(`${API_BASE_URL}/benefits/pagibig/${employee.pagibigData.id}/`, { method: "DELETE", headers }))

      const results = await Promise.allSettled(deletionPromises)
      if (results.some((r) => r.status === "rejected")) {
        alert("Some payroll data could not be deleted. Please try again.")
      } else {
        alert("Payroll information deleted successfully")
        setPayrollData((prev) => prev.map((emp) => emp.id === employeeId
          ? { ...emp, base_salary: 0, deductions: 0, net_salary: 0, status: "Pending", payrollRecord: null, salaryRecord: null, earnings: null, deductionsData: null, overtimeData: null, sssData: null, philhealthData: null, pagibigData: null }
          : emp
        ))
      }
      setTimeout(() => fetchPayrollData(), 1000)
    } catch (error) {
      alert(`Failed to delete payroll: ${error.message}`)
    }
  }

  const handlePayrollUpdate = (updatedData) => {
    if (selectedEmployee) {
      setPayrollData((prev) => prev.map((emp) => emp.id === selectedEmployee.id
        ? { ...emp, base_salary: Number.parseFloat(updatedData.totalGross), deductions: Number.parseFloat(updatedData.totalDeductions), net_salary: Number.parseFloat(updatedData.totalSalaryCompensation), status: "Processing" }
        : emp
      ))
      setIsEditModalOpen(false)
      setSelectedEmployee(null)
    }
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 }).format(amount)

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":       return "bg-green-500"
      case "processing": return "bg-yellow-500"
      case "pending":    return "bg-blue-500"
      case "rejected":   return "bg-red-500"
      default:           return "bg-gray-500"
    }
  }

  const filteredPayrollData = payrollData
    .filter((record) => {
      if (!searchTerm) return true
      const s = searchTerm.toLowerCase()
      return (
        record.employee_name?.toLowerCase().includes(s) ||
        record.employee_id?.toString().includes(s) ||
        record.position?.toLowerCase().includes(s) ||
        record.status?.toLowerCase().includes(s) ||
        formatCurrency(record.base_salary).toLowerCase().includes(s) ||
        formatCurrency(record.net_salary).toLowerCase().includes(s)
      )
    })
    .filter((record) => {
      if (yearFilter === "all") return true
      const employee = employees.find((emp) => emp.id === record.id)
      const yearEmployed = employee?.hire_date ? new Date(employee.hire_date).getFullYear() : null
      return yearEmployed && yearEmployed.toString() === yearFilter
    })
    .filter((record) => {
      if (roleFilter === "all") return true
      return (
        (roleFilter === "owner" && !record.user) ||
        (record.user && record.user.role && record.user.role.toLowerCase() === roleFilter.toLowerCase())
      )
    })

  const sortedPayrollData = [...filteredPayrollData].sort((a, b) => Number.parseInt(b.employee_id) - Number.parseInt(a.employee_id))
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = sortedPayrollData.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(sortedPayrollData.length / recordsPerPage)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-gray-800 dark:text-gray-100 transition-colors duration-300">
      Loading...
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center text-red-500 transition-colors duration-300">
      {error}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <NavBar />

      <div className="container mx-auto px-2 sm:px-6 pt-20 sm:pt-24">
        <div className="bg-[#333333] dark:bg-dark-card rounded-lg p-3 sm:p-6 border border-transparent dark:border-dark-border">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6 gap-3">
            <h2 className="text-base sm:text-xl font-semibold text-white dark:text-gray-100">Employee Payroll</h2>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              <input
                type="search"
                placeholder="Search name, ID, position…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] text-sm w-full bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <div className="flex gap-2">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-2 py-1.5 sm:px-4 sm:py-2 rounded-md border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 text-sm flex-1"
                >
                  <option value="all">All Years</option>
                  {[...new Set(employees.map((e) => (e.hire_date ? new Date(e.hire_date).getFullYear() : null)))]
                    .filter((year) => year !== null)
                    .sort((a, b) => b - a)
                    .map((year) => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2 py-1.5 sm:px-4 sm:py-2 rounded-md border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 text-sm flex-1"
                >
                  <option value="all">All Roles</option>
                  {["owner", "admin", "employee"].map((role) => (
                    <option key={role} value={role.toLowerCase()}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white dark:text-gray-300 border-b border-white/20 dark:border-dark-border whitespace-nowrap text-xs sm:text-sm">
                  <th className="py-2 px-2 sm:py-3 sm:px-4 w-[10%]">ID</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 w-[25%]">Name</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 w-[15%] hidden sm:table-cell">Position</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 w-[13%]">Gross</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 w-[13%]">Net</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 w-[10%]">Status</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 w-[14%]">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white dark:text-gray-200">
                {currentRecords.length > 0 ? (
                  currentRecords.map((record) => (
                    <tr key={record.id} className="border-b border-white/10 dark:border-dark-border">
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">{record.employee_id}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">{record.employee_name}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">{record.position}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">{formatCurrency(record.base_salary)}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">{formatCurrency(record.net_salary)}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4">
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap text-xs sm:text-sm text-white ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 whitespace-nowrap">
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleEditPayroll(record.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-md transition-colors text-xs sm:text-sm"
                          >
                            <span className="hidden sm:inline">Edit</span>
                            <span className="sm:hidden">✎</span>
                          </button>
                          <button
                            onClick={() => handleGoToPayslip(record.user?.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-2 sm:px-3 py-1 rounded-md transition-colors text-xs sm:text-sm"
                          >
                            <span className="hidden sm:inline">Payslip</span>
                            <span className="sm:hidden">🧾</span>
                          </button>
                          <button
                            onClick={() => handleDeletePayroll(record.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 rounded-md transition-colors text-xs sm:text-sm"
                          >
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">✕</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-sm text-gray-300">
                      No payroll records found
                    </td>
                  </tr>
                )}
                {currentRecords.length > 0 &&
                  [...Array(Math.max(0, recordsPerPage - currentRecords.length))].map((_, index) => (
                    <tr key={`empty-${index}`} className="border-b border-white/10 dark:border-dark-border h-[44px] sm:h-[52px]">
                      <td colSpan="7"></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3 sm:mt-4">
            <p className="text-white dark:text-gray-400 text-xs sm:text-sm">
              {currentRecords.length} of {sortedPayrollData.length} employees
            </p>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`bg-gray-600 dark:bg-gray-700 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md transition-colors text-xs sm:text-sm ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-500"}`}
              >
                Prev
              </button>
              <div className="bg-white dark:bg-dark-bg text-[#5C7346] px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm border border-gray-200 dark:border-dark-border">
                {currentPage} / {totalPages || 1}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`bg-gray-600 dark:bg-gray-700 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md transition-colors text-xs sm:text-sm ${currentPage === totalPages || totalPages === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-500"}`}
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>

      <EditPayroll
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedEmployee(null) }}
        employeeData={selectedEmployee}
        onUpdate={handlePayrollUpdate}
      />
    </div>
  )
}

export default AdminEmployeePayrollPage