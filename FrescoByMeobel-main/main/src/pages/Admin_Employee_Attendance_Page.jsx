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
      const accessToken = localStorage.getItem("access_token")
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
      case "late": return "bg-yellow-400 text-yellow-800"
      case "absent": return "bg-red-500 text-white"
      default: return "bg-gray-500 text-white"
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Main container — tighter on mobile, original on desktop */}
      <div className="container mx-auto px-3 pt-16 md:px-8 md:pt-20">
        <div className="bg-[#333333] rounded-lg p-3 md:p-6">

          {/* Header Section */}
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">

            {/* Tabs */}
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 text-sm rounded-md md:px-6 md:py-2 md:text-base ${activeTab === "attendance" ? "bg-[#5C7346] text-white font-semibold" : "bg-[#D1DBC4] text-gray-700"}`}
                onClick={() => handleTabChange("attendance")}
              >
                Attendance
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md md:px-6 md:py-2 md:text-base ${activeTab === "summary" ? "bg-[#5C7346] text-white font-semibold" : "bg-[#D1DBC4] text-gray-700"}`}
                onClick={() => handleTabChange("summary")}
              >
                Summary
              </button>
            </div>

            {/* Search + Filters + Add Button */}
            <div className="flex flex-row flex-wrap gap-1 md:gap-2 md:items-center">
              <input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2 py-1 text-xs rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] w-full md:w-54 md:px-4 md:py-2 md:text-base"
              />
              {activeTab === "attendance" && (
                <div className="flex space-x-1 md:space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-1 py-1 text-xs rounded-md border-0 bg-white md:px-4 md:py-2 md:text-base"
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
                    className="px-1 py-1 text-xs rounded-md border-0 bg-white md:px-4 md:py-2 md:text-base"
                  >
                    <option value="all">All Months</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === "attendance" && (
                <button
                  onClick={() => { setShowAddModal(true); setAddError(null); setAddSuccess(false) }}
                  className="bg-[#5C7346] hover:bg-[#4a5c38] text-white px-3 py-1 text-xs rounded-md font-semibold flex items-center gap-1 md:px-8 md:py-2 md:text-base md:gap-2"
                >
                  <span className="text-base leading-none md:text-xl">+</span> Add Attendance
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-base font-semibold text-white mb-3 md:text-2xl md:mb-4">
            {activeTab === "attendance" ? "Attendance Records" : "Attendance Summary"}
          </h2>

          {/* Attendance Table */}
          {activeTab === "attendance" && (
            <div className="overflow-x-auto md:overflow-x-visible">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-left text-white border-b border-white/20">
                    <th className="py-2 px-2 text-xs w-[22%] md:py-3 md:px-4 md:text-sm md:w-[12%]">Date</th>
                    {/* Emp ID: desktop only */}
                    <th className="hidden md:table-cell py-3 px-4 text-sm w-[10%]">Emp ID</th>
                    <th className="py-2 px-2 text-xs w-[36%] md:py-3 md:px-4 md:text-sm md:w-[26%]">Name</th>
                    <th className="py-2 px-2 text-xs w-[20%] md:py-3 md:px-4 md:text-sm md:w-[12%]">In</th>
                    <th className="py-2 px-2 text-xs w-[22%] md:py-3 md:px-4 md:text-sm md:w-[12%]">Out</th>
                    {/* Status: desktop only */}
                    <th className="hidden md:table-cell py-3 px-4 text-sm w-[13%]">Status</th>
                    {/* Actions: desktop only */}
                    <th className="hidden md:table-cell py-3 px-4 text-sm w-[15%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record) => (
                      <>
                        {/* Main row */}
                        <tr key={record.id} className="md:border-b md:border-white/10">
                          <td className="py-2 px-2 text-xs md:py-3 md:px-4 md:text-sm">{new Date(record.date).toLocaleDateString()}</td>
                          {/* Emp ID: desktop only */}
                          <td className="hidden md:table-cell py-3 px-4 text-sm">{record.employee_id}</td>
                          <td className="py-2 px-2 text-xs md:py-3 md:px-4 md:text-sm">{record.employee_name}</td>
                          <td className="py-2 px-2 text-xs md:py-3 md:px-4 md:text-sm">{record.time_in}</td>
                          <td className="py-2 px-2 text-xs md:py-3 md:px-4 md:text-sm">{record.time_out}</td>
                          {/* Status: desktop only */}
                          <td className="hidden md:table-cell py-3 px-4">
                            <span className={`px-4 py-1 text-sm rounded-full font-medium whitespace-nowrap ${getStatusColor(record.status)}`}>
                              {record.status || "Unknown"}
                            </span>
                          </td>
                          {/* Actions: desktop only */}
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

                        {/* Mobile sub-row: Emp ID, Status, Delete */}
                        <tr key={`mobile-sub-${record.id}`} className="border-b border-white/10 md:hidden">
                          <td colSpan="4" className="pb-2 px-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-white/60">ID: {record.employee_id}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(record.status)}`}>
                                {record.status || "Unknown"}
                              </span>
                              <button
                                onClick={() => handleDeleteAttendance(record.id, record.user, record.date, record.check_in_time, record.check_out_time)}
                                disabled={deleteLoading}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 text-xs rounded-md transition-colors"
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
                      <td colSpan="7" className="py-4 text-center text-xs md:text-base">No attendance records found</td>
                    </tr>
                  )}
                  {currentRecords.length > 0 &&
                    [...Array(Math.max(0, recordsPerPage - currentRecords.length))].map((_, index) => (
                      <tr key={`empty-${index}`} className="border-b border-white/10 h-[40px] md:h-[52px]">
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
                  <tr className="text-left text-white border-b border-white/20">
                    <th className="py-2 px-2 text-xs w-[22%] md:py-3 md:px-4 md:text-sm md:w-[12%]">Biweek</th>
                    {/* Emp ID: desktop only */}
                    <th className="hidden md:table-cell py-3 px-4 text-sm w-[10%]">Emp ID</th>
                    <th className="py-2 px-2 text-xs w-[32%] md:py-3 md:px-4 md:text-sm md:w-[18%]">Name</th>
                    <th className="py-2 px-2 text-xs w-[16%] md:py-3 md:px-4 md:text-sm md:w-[7%]">Hrs</th>
                    <th className="py-2 px-2 text-xs w-[15%] md:py-3 md:px-4 md:text-sm md:w-[7%]">OT</th>
                    <th className="py-2 px-2 text-xs w-[15%] md:py-3 md:px-4 md:text-sm md:w-[7%]">Late</th>
                    {/* Extra columns: desktop only */}
                    <th className="hidden md:table-cell py-3 px-4 text-sm w-[7%]">Reg Hol</th>
                    <th className="hidden md:table-cell py-3 px-4 text-sm w-[7%]">Spec Hol</th>
                    <th className="hidden md:table-cell py-3 px-4 text-sm w-[7%]">Rest Day</th>
                    <th className="hidden md:table-cell py-3 px-4 text-sm w-[7%]">Night Diff</th>
                    <th className="hidden md:table-cell py-3 px-4 text-sm w-[7%]">Undertime</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record) => (
                      <>
                        {/* Main row */}
                        <tr key={record.id} className="md:border-b md:border-white/10">
                          <td className="py-2 px-2 text-xs md:py-3 md:px-4 md:text-sm">{formatDate(record.biweek_start)}</td>
                          {/* Emp ID: desktop only */}
                          <td className="hidden md:table-cell py-3 px-4 text-sm">{record.employee_id}</td>
                          <td className="py-2 px-2 text-xs md:py-3 md:px-4 md:text-sm">{record.employee_name}</td>
                          <td className="py-2 px-2 text-xs md:py-3 md:px-4 md:text-sm">{record.actualhours}h</td>
                          <td className="py-2 px-2 text-xs md:py-3 md:px-4 md:text-sm">{record.regularot}h</td>
                          <td className="py-2 px-2 text-xs md:py-3 md:px-4 md:text-sm">{record.late}m</td>
                          {/* Extra cols: desktop only */}
                          <td className="hidden md:table-cell py-3 px-4 text-sm">{record.regularholiday}h</td>
                          <td className="hidden md:table-cell py-3 px-4 text-sm">{record.specialholiday}h</td>
                          <td className="hidden md:table-cell py-3 px-4 text-sm">{record.restday}h</td>
                          <td className="hidden md:table-cell py-3 px-4 text-sm">{record.nightdiff}h</td>
                          <td className="hidden md:table-cell py-3 px-4 text-sm">{record.undertime}h</td>
                        </tr>

                        {/* Mobile sub-row: Emp ID + hidden extra stats */}
                        <tr key={`mobile-summary-sub-${record.id}`} className="border-b border-white/10 md:hidden">
                          <td colSpan="5" className="pb-2 px-2">
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/70">
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
                      <td colSpan="11" className="py-4 text-center text-xs md:text-base">No overtime records found</td>
                    </tr>
                  )}
                  {currentRecords.length > 0 &&
                    [...Array(Math.max(0, recordsPerPage - currentRecords.length))].map((_, index) => (
                      <tr key={`empty-${index}`} className="border-b border-white/10 h-[40px] md:h-[52px]">
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
                className={`bg-[#5C7346] text-white px-3 py-1.5 text-xs rounded-md hover:bg-[#4a5c38] transition-colors md:px-4 md:py-2 md:text-base ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Previous
              </button>
              <div className="bg-white text-[#5C7346] px-3 py-1.5 text-xs rounded-md min-w-[60px] text-center md:px-4 md:py-2 md:text-base md:min-w-[80px]">
                {currentPage} of {totalPages || 1}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`bg-[#5C7346] text-white px-3 py-1.5 text-xs rounded-md hover:bg-[#4a5c38] transition-colors md:px-4 md:py-2 md:text-base ${currentPage === totalPages || totalPages === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD ATTENDANCE MODAL — unchanged, already compact */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#333333] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-[#5C7346] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white text-xl font-bold">Add Attendance Record</h3>
              <button
                onClick={() => { setShowAddModal(false); setAddError(null); setAddSuccess(false) }}
                className="text-white hover:text-gray-200 transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddAttendance} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-1">Employee *</label>
                <select
                  required
                  value={addForm.user}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, user: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                >
                  <option value="">Select an employee</option>
                  {employees.map((emp) => (
                    <option key={emp.user?.id} value={emp.user?.id}>
                      {emp.first_name} {emp.last_name} — {emp.employee_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={addForm.date}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Time In *</label>
                  <input
                    type="time"
                    required
                    value={addForm.check_in_time}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, check_in_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Time Out</label>
                  <input
                    type="time"
                    value={addForm.check_out_time}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, check_out_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-1">Status *</label>
                <select
                  required
                  value={addForm.status}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="overtime">Overtime</option>
                  <option value="undertime">Undertime</option>
                </select>
              </div>

              {addError && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-md text-sm">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-2 rounded-md text-sm">
                  ✓ Attendance record added successfully!
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddError(null); setAddSuccess(false) }}
                  className="px-5 py-2 rounded-md bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-md bg-[#5C7346] hover:bg-[#4a5c38] text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addLoading ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminEmployeeAttendancePage