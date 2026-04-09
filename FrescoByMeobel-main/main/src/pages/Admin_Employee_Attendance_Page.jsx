"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar.jsx"
import { API_BASE_URL } from "../config/api"

function AdminEmployeeAttendancePage() {
  const navigate = useNavigate()

  const today = new Date()
  const twoWeeksLater = new Date(today)
  twoWeeksLater.setDate(today.getDate() + 14)

  const [activeTab, setActiveTab] = useState("attendance")
  const [attendanceData, setAttendanceData] = useState([])
  const [rawAttendanceData, setRawAttendanceData] = useState([])
  const [overtimeData, setOvertimeData] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 7
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  const [showAddModal, setShowAddModal] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState(null)
  const [addSuccess, setAddSuccess] = useState(false)
  const [addForm, setAddForm] = useState({
    user: "",
    date: new Date().toISOString().split("T")[0],
    check_in_time: "08:00",
    check_out_time: "17:00",
    status: "present",
  })

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/employment-info/`, {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        })
        if (!response.ok) throw new Error("Failed to fetch employees")
        const data = await response.json()
        setEmployees(data)
      } catch (error) {
        console.error("Error fetching employees:", error)
        setError("An error occurred while fetching employees. Please try again later.")
      }
    }
    fetchEmployees()
  }, [])

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true)
      setError(null)
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/attendance/`, {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        })
        if (!response.ok) throw new Error(`Failed to fetch attendance data: ${response.status} ${response.statusText}`)
        const data = await response.json()
        setRawAttendanceData(data)
      } catch (error) {
        console.error("Error fetching attendance data:", error)
        setError("An error occurred while fetching attendance data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchAttendanceData()
  }, [])

  useEffect(() => {
    const fetchOvertimeData = async () => {
      setLoading(true)
      setError(null)
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/overtimehours/`, {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        })
        if (!response.ok) throw new Error(`Failed to fetch overtime data: ${response.status} ${response.statusText}`)
        const data = await response.json()
        const processedData = await enrichOvertimeData(data)
        const sortedData = [...processedData].sort(
          (a, b) => new Date(b.biweek_start).getTime() - new Date(a.biweek_start).getTime()
        )
        setOvertimeData(sortedData)
      } catch (error) {
        console.error("Error fetching overtime data:", error)
        setError("An error occurred while fetching overtime data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchOvertimeData()
  }, [])

  useEffect(() => {
    const processAttendanceData = async () => {
      if (rawAttendanceData.length > 0 && employees.length > 0) {
        const processedData = await enrichAttendanceData(rawAttendanceData)
        const sortedData = [...processedData].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setAttendanceData(sortedData)
      }
    }
    processAttendanceData()
  }, [rawAttendanceData, employees])

  const enrichOvertimeData = async (overtimeRecords) => {
    if (!overtimeRecords || !Array.isArray(overtimeRecords) || overtimeRecords.length === 0) return []
    return overtimeRecords.map((record) => {
      const employmentInfo = record.employment_info || {}
      const firstName = employmentInfo.first_name || ""
      const lastName = employmentInfo.last_name || ""
      const employeeName = `${firstName} ${lastName}`.trim() || `Unknown (ID: ${record.user})`
      const employeeNumber = employmentInfo.employee_number || record.user
      return { ...record, employee_name: employeeName, employee_id: employeeNumber, employment_info_id: employmentInfo.id || null }
    })
  }

  const enrichAttendanceData = async (attendanceRecords) => {
    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) return []
    if (!employees || employees.length === 0) {
      return attendanceRecords.map((record) => ({
        ...record,
        employee_name: `Loading... (ID: ${record.user})`,
        employee_id: "Loading...",
        time_in: formatTime(record.check_in_time),
        time_out: formatTime(record.check_out_time),
      }))
    }
    const employeeMap = new Map()
    employees.forEach((employee) => {
      const userId = employee.user?.id
      if (userId) {
        employeeMap.set(userId, {
          name: `${employee.first_name} ${employee.last_name}`,
          employeeNumber: employee.employee_number,
          id: employee.id,
        })
      }
    })
    return attendanceRecords.map((record) => {
      const userId = record.user
      const employeeInfo = employeeMap.get(userId)
      return {
        ...record,
        employee_name: employeeInfo ? employeeInfo.name : `Unknown (ID: ${userId})`,
        employee_id: employeeInfo ? employeeInfo.employeeNumber : `User ID: ${userId}`,
        employment_info_id: employeeInfo ? employeeInfo.id : null,
        time_in: formatTime(record.check_in_time),
        time_out: formatTime(record.check_out_time),
      }
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return "-"
    try {
      const [hours, minutes] = timeString.split(":")
      const hour = Number.parseInt(hours, 10)
      const minute = Number.parseInt(minutes, 10)
      const date = new Date()
      date.setHours(hour)
      date.setMinutes(minute)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      return timeString
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const getMonthFromDate = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("default", { month: "long" })
  }

  const handleDeleteAttendance = async (attendanceId, userId, date, checkInTime, checkOutTime) => {
    if (!window.confirm("Deleting an attendance record will delete its corresponding biometricdata and its summary. Are you sure?")) return
    setDeleteLoading(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const bioResponse = await fetch(`${API_BASE_URL}/biometricdata/`, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      })
      if (!bioResponse.ok) throw new Error(`Failed to fetch biometric data: ${bioResponse.status}`)
      const bioData = await bioResponse.json()
      const attendanceDate = new Date(date).toISOString().split("T")[0]
      const matchingBioRecords = bioData.filter((record) => {
        const empIdMatch = record.emp_id === userId
        const bioDate = new Date(record.time).toISOString().split("T")[0]
        const dateMatch = bioDate === attendanceDate
        const bioTime = new Date(record.time).toISOString().split("T")[1].substring(0, 8)
        return empIdMatch && dateMatch && (bioTime === checkInTime || bioTime === checkOutTime)
      })
      const bioDeletionPromises = matchingBioRecords.map((record) =>
        fetch(`${API_BASE_URL}/biometricdata/${record.id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        })
      )
      await Promise.allSettled(bioDeletionPromises)
      const attendanceResponse = await fetch(`${API_BASE_URL}/attendance/${attendanceId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      })
      if (!attendanceResponse.ok) throw new Error(`Failed to delete attendance record: ${attendanceResponse.status}`)
      setRawAttendanceData((prevData) => prevData.filter((record) => record.id !== attendanceId))
      alert("Attendance record deleted successfully")
    } catch (error) {
      console.error("Error deleting records:", error)
      alert(`Failed to delete records: ${error.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddAttendance = async (e) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError(null)
    setAddSuccess(false)
    try {
      const checkIn = addForm.check_in_time ? `${addForm.check_in_time}:00` : null
      const checkOut = addForm.check_out_time ? `${addForm.check_out_time}:00` : null
      const payload = {
        user: Number(addForm.user),
        date: addForm.date,
        check_in_time: checkIn,
        check_out_time: checkOut,
        status: addForm.status,
      }
      const response = await fetch(`${API_BASE_URL}/attendance/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Failed to create attendance: ${errText}`)
      }
      const newRecord = await response.json()
      setRawAttendanceData((prev) => [newRecord, ...prev])
      setAddSuccess(true)
      setAddForm((prev) => ({ ...prev, check_in_time: "08:00", check_out_time: "17:00", status: "present" }))
      setTimeout(() => { setShowAddModal(false); setAddSuccess(false) }, 1500)
    } catch (error) {
      console.error("Error adding attendance:", error)
      setAddError(error.message)
    } finally {
      setAddLoading(false)
    }
  }

  const statuses = [...new Set(attendanceData.map((r) => r.status))].filter(Boolean).sort()
  const months = [...new Set(attendanceData.map((r) => getMonthFromDate(r.date)))].filter((m) => m !== "-").sort()

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setStatusFilter("all")
    setDateFilter("all")
  }

  const filteredAttendanceData = attendanceData.filter((record) => {
    const s = searchTerm.toLowerCase()
    const nameMatch =
      record.employee_name?.toLowerCase().includes(s) ||
      record.employee_id?.toString().toLowerCase().includes(s) ||
      (record.date && new Date(record.date).toLocaleDateString().includes(s)) ||
      (record.status && record.status.toLowerCase().includes(s)) ||
      (record.time_in && record.time_in.toLowerCase().includes(s)) ||
      (record.time_out && record.time_out.toLowerCase().includes(s))
    const statusMatch = statusFilter === "all" || record.status === statusFilter
    const monthMatch = dateFilter === "all" || getMonthFromDate(record.date) === dateFilter
    return nameMatch && statusMatch && monthMatch
  })

  const filteredOvertimeData = overtimeData.filter((record) => {
    const s = searchTerm.toLowerCase()
    return (
      record.employee_name?.toLowerCase().includes(s) ||
      record.employee_id?.toString().toLowerCase().includes(s) ||
      (record.biweek_start && new Date(record.biweek_start).toLocaleDateString().includes(s))
    )
  })

  const currentData = activeTab === "attendance" ? filteredAttendanceData : filteredOvertimeData
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = currentData.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(currentData.length / recordsPerPage)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  useEffect(() => { setCurrentPage(1) }, [activeTab])

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "present": return "bg-green-100 text-green-800"
      case "late":    return "bg-yellow-400 text-yellow-800"
      case "absent":  return "bg-red-500 text-white"
      default:        return "bg-gray-500 text-white"
    }
  }

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

      {/* Header */}
      <div className="container mx-auto px-4 sm:px-8 -mt-16">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-700 dark:text-gray-100">Attendance</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Track and manage employee attendance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 sm:px-8 mt-4">
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-100 dark:bg-dark-card rounded-full p-1">
            <button
              className={`px-6 py-2 text-sm rounded-full md:px-8 md:py-2 md:text-base transition-colors ${
                activeTab === "attendance"
                  ? "bg-gray-600 dark:bg-gray-500 text-white font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => handleTabChange("attendance")}
            >
              Attendance
            </button>
            <button
              className={`px-6 py-2 text-sm rounded-full md:px-8 md:py-2 md:text-base transition-colors ${
                activeTab === "summary"
                  ? "bg-gray-600 dark:bg-gray-500 text-white font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => handleTabChange("summary")}
            >
              Summary
            </button>
          </div>
        </div>
      </div>

      {/* Main container */}
      <div className="container mx-auto px-3 pt-4 md:px-8 md:pt-4">
        <div className="bg-white dark:bg-dark-card rounded-lg p-3 md:p-6 shadow-sm border border-transparent dark:border-dark-border">

          {/* Header Section */}
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
            <div className="flex flex-row flex-wrap gap-1 md:gap-2 md:items-center">
              <input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#5C7346] w-full md:w-64 md:px-5 md:py-3 md:text-lg placeholder-gray-400 dark:placeholder-gray-500"
              />
              {activeTab === "attendance" && (
                <div className="flex space-x-1 md:space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-1 py-1 text-xs rounded-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 md:px-4 md:py-2 md:text-base"
                  >
                    <option value="all">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-1 py-1 text-xs rounded-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 md:px-4 md:py-2 md:text-base"
                  >
                    <option value="all">All Months</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 md:text-3xl md:mb-4">
            {activeTab === "attendance" ? "Attendance Records" : "Attendance Summary"}
          </h2>

          {/* Attendance Table */}
          {activeTab === "attendance" && (
            <div className="overflow-x-auto md:overflow-x-visible">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-left text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-dark-border">
                    <th className="py-2 px-2 text-sm w-[22%] md:py-3 md:px-4 md:text-base md:w-[12%]">Date</th>
                    <th className="hidden md:table-cell py-3 px-4 text-base w-[10%]">Emp ID</th>
                    <th className="py-2 px-2 text-sm w-[36%] md:py-3 md:px-4 md:text-base md:w-[26%]">Name</th>
                    <th className="py-2 px-2 text-sm w-[20%] md:py-3 md:px-4 md:text-base md:w-[12%]">In</th>
                    <th className="py-2 px-2 text-sm w-[22%] md:py-3 md:px-4 md:text-base md:w-[12%]">Out</th>
                    <th className="hidden md:table-cell py-3 px-4 text-base w-[13%]">Status</th>
                    <th className="hidden md:table-cell py-3 px-4 text-base w-[15%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-100">
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record) => (
                      <>
                        <tr key={record.id} className="md:border-b md:border-gray-100 dark:md:border-dark-border">
                          <td className="py-2 px-2 text-sm md:py-3 md:px-4 md:text-base opacity-60">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="hidden md:table-cell py-3 px-4 text-base">{record.employee_id}</td>
                          <td className="py-2 px-2 font-medium text-lg md:py-3 md:px-4 md:text-xl truncate">{record.employee_name}</td>
                          <td className="py-2 px-2 text-sm md:py-3 md:px-4 md:text-base">{record.time_in}</td>
                          <td className="py-2 px-2 text-sm md:py-3 md:px-4 md:text-base">{record.time_out}</td>
                          <td className="hidden md:table-cell py-3 px-4">
                            <span className={`px-4 py-1 text-base rounded-full font-medium whitespace-nowrap ${getStatusColor(record.status)}`}>
                              {record.status || "Unknown"}
                            </span>
                          </td>
                          <td className="hidden md:table-cell py-3 px-4">
                            <button
                              onClick={() => handleDeleteAttendance(record.id, record.user, record.date, record.check_in_time, record.check_out_time)}
                              disabled={deleteLoading}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-base rounded-md transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                        <tr key={`mobile-sub-${record.id}`} className="border-b border-gray-100 dark:border-dark-border md:hidden">
                          <td colSpan="4" className="pb-2 px-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-500 dark:text-gray-400">ID: {record.employee_id}</span>
                              <span className={`px-2 py-0.5 text-sm rounded-full font-medium whitespace-nowrap ${getStatusColor(record.status)}`}>
                                {record.status || "Unknown"}
                              </span>
                              <button
                                onClick={() => handleDeleteAttendance(record.id, record.user, record.date, record.check_in_time, record.check_out_time)}
                                disabled={deleteLoading}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 text-sm rounded-md transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      </>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-4 text-center text-sm md:text-lg text-gray-500 dark:text-gray-400">No attendance records found</td>
                    </tr>
                  )}
                  {currentRecords.length > 0 &&
                    [...Array(Math.max(0, recordsPerPage - currentRecords.length))].map((_, index) => (
                      <tr key={`empty-${index}`} className="border-b border-gray-100 dark:border-dark-border h-[40px] md:h-[52px]">
                        <td colSpan="7"></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Table */}
          {activeTab === "summary" && (
            <div className="overflow-x-auto md:overflow-x-visible">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-left text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-dark-border">
                    <th className="py-2 px-2 text-sm w-[22%] md:py-3 md:px-4 md:text-base md:w-[12%]">Biweek</th>
                    <th className="hidden md:table-cell py-3 px-4 text-base w-[10%]">Emp ID</th>
                    <th className="py-2 px-2 text-sm w-[32%] md:py-3 md:px-4 md:text-base md:w-[18%]">Name</th>
                    <th className="py-2 px-2 text-sm w-[16%] md:py-3 md:px-4 md:text-base md:w-[7%]">Hrs</th>
                    <th className="py-2 px-2 text-sm w-[15%] md:py-3 md:px-4 md:text-base md:w-[7%]">OT</th>
                    <th className="py-2 px-2 text-sm w-[15%] md:py-3 md:px-4 md:text-base md:w-[7%]">Late</th>
                    <th className="hidden md:table-cell py-3 px-4 text-base w-[7%]">Reg Hol</th>
                    <th className="hidden md:table-cell py-3 px-4 text-base w-[7%]">Spec Hol</th>
                    <th className="hidden md:table-cell py-3 px-4 text-base w-[7%]">Rest Day</th>
                    <th className="hidden md:table-cell py-3 px-4 text-base w-[7%]">Night Diff</th>
                    <th className="hidden md:table-cell py-3 px-4 text-base w-[7%]">Undertime</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-100">
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record) => (
                      <>
                        <tr key={record.id} className="md:border-b md:border-gray-100 dark:md:border-dark-border">
                          <td className="py-2 px-2 text-sm md:py-3 md:px-4 md:text-base opacity-60">{formatDate(record.biweek_start)}</td>
                          <td className="hidden md:table-cell py-3 px-4 text-base">{record.employee_id}</td>
                          <td className="py-2 px-2 font-medium text-lg md:py-3 md:px-4 md:text-xl truncate">{record.employee_name}</td>
                          <td className="py-2 px-2 text-sm md:py-3 md:px-4 md:text-base">{record.actualhours}h</td>
                          <td className="py-2 px-2 text-sm md:py-3 md:px-4 md:text-base">{record.regularot}h</td>
                          <td className="py-2 px-2 text-sm md:py-3 md:px-4 md:text-base">{record.late}m</td>
                          <td className="hidden md:table-cell py-3 px-4 text-base">{record.regularholiday}h</td>
                          <td className="hidden md:table-cell py-3 px-4 text-base">{record.specialholiday}h</td>
                          <td className="hidden md:table-cell py-3 px-4 text-base">{record.restday}h</td>
                          <td className="hidden md:table-cell py-3 px-4 text-base">{record.nightdiff}h</td>
                          <td className="hidden md:table-cell py-3 px-4 text-base">{record.undertime}h</td>
                        </tr>
                        <tr key={`mobile-summary-sub-${record.id}`} className="border-b border-gray-100 dark:border-dark-border md:hidden">
                          <td colSpan="5" className="pb-2 px-2">
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                              <span>ID: {record.employee_id}</span>
                              <span>Reg Hol: {record.regularholiday}h</span>
                              <span>Spec Hol: {record.specialholiday}h</span>
                              <span>Rest: {record.restday}h</span>
                              <span>Night: {record.nightdiff}h</span>
                              <span>Undertime: {record.undertime}h</span>
                            </div>
                          </td>
                        </tr>
                      </>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="py-4 text-center text-sm md:text-lg text-gray-500 dark:text-gray-400">No overtime records found</td>
                    </tr>
                  )}
                  {currentRecords.length > 0 &&
                    [...Array(Math.max(0, recordsPerPage - currentRecords.length))].map((_, index) => (
                      <tr key={`empty-${index}`} className="border-b border-gray-100 dark:border-dark-border h-[40px] md:h-[52px]">
                        <td colSpan="11"></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-end items-center mt-3 md:mt-6">
            <div className="flex space-x-1 md:space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`bg-[#5C7346] text-white px-3 py-1.5 text-xs rounded-full hover:bg-[#4a5c38] transition-colors md:px-4 md:py-2 md:text-base ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Previous
              </button>
              <div className="bg-white dark:bg-dark-bg text-[#5C7346] px-3 py-1.5 text-xs rounded-full min-w-[60px] text-center md:px-4 md:py-2 md:text-base md:min-w-[80px] border border-gray-200 dark:border-dark-border">
                {currentPage} of {totalPages || 1}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`bg-[#5C7346] text-white px-3 py-1.5 text-xs rounded-full hover:bg-[#4a5c38] transition-colors md:px-4 md:py-2 md:text-base ${currentPage === totalPages || totalPages === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD ATTENDANCE BOTTOM SHEET */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setAddError(null); setAddSuccess(false) } }}
        >
          <div className="bg-white dark:bg-dark-card w-full rounded-t-2xl max-h-[92dvh] overflow-y-auto border-t border-dark-border">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            <div className="px-6 pt-2 pb-10">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5">Add attendance record</h3>

              <form onSubmit={handleAddAttendance} className="space-y-4">
                {/* Employee */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Employee</p>
                  <select
                    required
                    value={addForm.user}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, user: e.target.value }))}
                    className="w-full px-3.5 py-3 rounded-xl bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-100 text-[15px] border-0 focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  >
                    <option value="">Select an employee</option>
                    {employees.map((emp) => (
                      <option key={emp.user?.id} value={emp.user?.id}>
                        {emp.first_name} {emp.last_name} — {emp.employee_number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Date</p>
                  <input
                    type="date"
                    required
                    value={addForm.date}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3.5 py-3 rounded-xl bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-100 text-[15px] border-0 focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  />
                </div>

                {/* Time In / Out */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Time in</p>
                    <input
                      type="time"
                      required
                      value={addForm.check_in_time}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, check_in_time: e.target.value }))}
                      className="w-full px-3.5 py-3 rounded-xl bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-100 text-[15px] border-0 focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Time out</p>
                    <input
                      type="time"
                      value={addForm.check_out_time}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, check_out_time: e.target.value }))}
                      className="w-full px-3.5 py-3 rounded-xl bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-100 text-[15px] border-0 focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                    />
                  </div>
                </div>

                {/* Status Pills */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {["present", "late", "absent", "overtime", "undertime"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAddForm((prev) => ({ ...prev, status: s }))}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                          addForm.status === s
                            ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900"
                            : "bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-dark-border"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {addError   && <p className="text-sm text-red-500">{addError}</p>}
                {addSuccess && <p className="text-sm text-green-500">✓ Attendance record added successfully!</p>}

                {/* Actions */}
                <div className="flex justify-between items-center pt-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setAddError(null); setAddSuccess(false) }}
                    className="text-red-500 text-base font-medium bg-transparent border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="bg-[#5C7346] text-white px-7 py-3 rounded-xl text-[15px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {addLoading ? "Saving..." : "Save record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      {activeTab === "attendance" && !showAddModal && (
        <button
          onClick={() => { setShowAddModal(true); setAddError(null); setAddSuccess(false) }}
          className="fixed bottom-20 right-6 bg-[#5C7346] hover:bg-[#4a5c38] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-50"
        >
          <span className="text-2xl font-bold">+</span>
        </button>
      )}
    </div>
  )
}

export default AdminEmployeeAttendancePage