"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE_URL } from "../config/api"
import dayjs from "dayjs"

// Components for the Master Calendar
import MasterCalendarView from "../components/Master_Calendar_View"
import AddHoliday from "../components/Add_Holiday"
import AddPayrollPeriod from "../components/Add_Payroll_Period"

function AdminMasterCalendarPage() {
  const navigate = useNavigate()
  const [holidays, setHolidays] = useState([])
  const [payrollPeriods, setPayrollPeriods] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncStatus, setSyncStatus] = useState({ syncing: false, message: "" })
  const [activePanelType, setActivePanelType] = useState(null)
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("access_token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        try {
          const holidaysResponse = await axios.get(`${API_BASE_URL}/master-calendar/holiday/`, { headers })
          console.log("Holidays response:", holidaysResponse.data)
          setHolidays(holidaysResponse.data.results || holidaysResponse.data || [])
        } catch (holidayError) {
          console.warn("Could not fetch holidays:", holidayError)
          setHolidays([])
        }

        try {
          const payrollResponse = await axios.get(`${API_BASE_URL}/master-calendar/payrollperiod/`, { headers })
          console.log("Payroll periods response:", payrollResponse.data)
          setPayrollPeriods(payrollResponse.data.results || payrollResponse.data || [])
        } catch (payrollError) {
          console.warn("Could not fetch payroll periods:", payrollError)
          setPayrollPeriods([])
        }

        setError(null)
      } catch (err) {
        console.error("Error fetching calendar data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const syncHolidaysToEmployees = async () => {
    try {
      setSyncStatus({ syncing: true, message: "Syncing holidays to all employees..." })

      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Authentication token not found. Please log in again.")
      const headers = { Authorization: `Bearer ${token}` }

      const holidaysResponse = await axios.get(`${API_BASE_URL}/master-calendar/holiday/`, { headers })
      const holidays = holidaysResponse.data.results || holidaysResponse.data || []

      if (holidays.length > 0) {
        const holiday = holidays[0]
        await axios.patch(`${API_BASE_URL}/master-calendar/holiday/${holiday.id}/`, { ...holiday }, { headers })
      }

      console.log("Holidays synced successfully")
      setSyncStatus({ syncing: false, message: "Holidays successfully synced to all employee schedules!" })
      setTimeout(() => setSyncStatus({ syncing: false, message: "" }), 3000)
    } catch (err) {
      console.error("Error syncing holidays:", err)
      setSyncStatus({ syncing: false, message: "Error syncing holidays. Please try again." })
    }
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    const existingHoliday = holidays.find(
      (holiday) => dayjs(holiday.date).format("YYYY-MM-DD") === dayjs(date).format("YYYY-MM-DD"),
    )
    if (existingHoliday) {
      setSelectedHoliday(existingHoliday)
      setActivePanelType("holiday")
    } else {
      setSelectedHoliday(null)
      setActivePanelType("holiday")
    }
    setIsPanelOpen(true)
  }

  const handleSaveHoliday = async (holidayData) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Authentication token not found. Please log in again.")
      const headers = { Authorization: `Bearer ${token}` }

      let response
      if (selectedHoliday && selectedHoliday.id) {
        response = await axios.put(`${API_BASE_URL}/master-calendar/holiday/${selectedHoliday.id}/`, holidayData, { headers })
        setHolidays(holidays.map((holiday) => (holiday.id === selectedHoliday.id ? response.data : holiday)))
      } else {
        response = await axios.post(`${API_BASE_URL}/master-calendar/holiday/`, holidayData, { headers })
        setHolidays([...holidays, response.data])
      }

      setIsPanelOpen(false)
      setSelectedHoliday(null)
      setSelectedDate(null)
      await syncHolidaysToEmployees()
    } catch (err) {
      console.error("Error saving holiday:", err)
      if (err.response && err.response.status === 401) {
        alert("Authentication error. Please log in again.")
      } else {
        alert("Failed to save holiday. Please try again.")
      }
    }
  }

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) return

    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Authentication token not found. Please log in again.")
      const headers = { Authorization: `Bearer ${token}` }

      await axios.delete(`${API_BASE_URL}/master-calendar/holiday/${id}/`, { headers })
      setHolidays(holidays.filter((holiday) => holiday.id !== id))
      setIsPanelOpen(false)
      setSelectedHoliday(null)
      setSelectedDate(null)
      await syncHolidaysToEmployees()
    } catch (err) {
      console.error("Error deleting holiday:", err)
      if (err.response && err.response.status === 401) {
        alert("Authentication error. Please log in again.")
      } else {
        alert("Failed to delete holiday. Please try again.")
      }
    }
  }

  const handleSavePayrollPeriod = async (payrollData) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Authentication token not found. Please log in again.")
      const headers = { Authorization: `Bearer ${token}` }

      let response
      if (selectedPayrollPeriod && selectedPayrollPeriod.id) {
        response = await axios.put(
          `${API_BASE_URL}/master-calendar/payrollperiod/${selectedPayrollPeriod.id}/`,
          payrollData,
          { headers },
        )
        setPayrollPeriods(payrollPeriods.map((period) => (period.id === selectedPayrollPeriod.id ? response.data : period)))
      } else {
        response = await axios.post(`${API_BASE_URL}/master-calendar/payrollperiod/`, payrollData, { headers })
        setPayrollPeriods([...payrollPeriods, response.data])
      }

      setIsPanelOpen(false)
      setSelectedPayrollPeriod(null)
      setSyncStatus({ syncing: false, message: "Payroll period saved successfully!" })
      setTimeout(() => setSyncStatus({ syncing: false, message: "" }), 3000)
    } catch (err) {
      console.error("Error saving payroll period:", err)
      if (err.response && err.response.status === 401) {
        alert("Authentication error. Please log in again.")
      } else {
        alert("Failed to save payroll period. Please try again.")
      }
    }
  }

  const handleDeletePayrollPeriod = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payroll period?")) return

    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Authentication token not found. Please log in again.")
      const headers = { Authorization: `Bearer ${token}` }

      await axios.delete(`${API_BASE_URL}/master-calendar/payrollperiod/${id}/`, { headers })
      setPayrollPeriods(payrollPeriods.filter((period) => period.id !== id))
      setIsPanelOpen(false)
      setSelectedPayrollPeriod(null)
      setSyncStatus({ syncing: false, message: "Payroll period deleted successfully!" })
      setTimeout(() => setSyncStatus({ syncing: false, message: "" }), 3000)
    } catch (err) {
      console.error("Error deleting payroll period:", err)
      if (err.response && err.response.status === 401) {
        alert("Authentication error. Please log in again.")
      } else {
        alert("Failed to delete payroll period. Please try again.")
      }
    }
  }

  const openPayrollPeriodPanel = (period = null) => {
    setSelectedPayrollPeriod(period)
    setActivePanelType("payroll")
    setIsPanelOpen(true)
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setSelectedHoliday(null)
    setSelectedPayrollPeriod(null)
    setSelectedDate(null)
    setActivePanelType(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Main Content — tighter on mobile, original on desktop */}
      <div className="container mx-auto px-3 pt-3 pb-6 md:px-8 md:pt-16 md:pb-8">

        {/* Page Header */}
        <div className="mb-3 flex flex-col gap-2 md:mb-4 md:flex-row md:justify-between md:items-start">
          <div>
            <h1 className="text-lg font-semibold text-black md:text-3xl">Master Calendar</h1>
            <p className="text-xs text-gray-500 md:text-base">
              Manage holidays and payroll periods for all employees
            </p>
          </div>

          <div className="flex flex-row gap-2 sm:flex-row md:flex-col md:gap-3">
            <button
              onClick={() => openPayrollPeriodPanel()}
              className="bg-black text-white px-3 py-1.5 text-xs rounded-md font-medium md:px-4 md:py-2 md:text-base"
            >
              Add Payroll Period
            </button>
            <button
              onClick={syncHolidaysToEmployees}
              disabled={syncStatus.syncing}
              className="bg-black text-white px-3 py-1.5 text-xs rounded-md font-medium md:px-4 md:py-2 md:text-base"
            >
              {syncStatus.syncing ? "Syncing..." : "Sync Holidays to All Employees"}
            </button>
          </div>
        </div>

        {/* Sync Status Message */}
        {syncStatus.message && (
          <div className="mb-3 p-2 text-xs bg-green-100 border border-green-400 text-green-700 rounded md:mb-4 md:p-3 md:text-sm">
            {syncStatus.message}
          </div>
        )}

        {/* Payroll Periods List */}
        <div className="mb-4 bg-white rounded-lg shadow-md p-3 md:mb-6 md:p-4">
          <h2 className="text-base font-semibold mb-3 text-black md:text-xl md:mb-4">Payroll Periods</h2>
          {payrollPeriods.length === 0 ? (
            <p className="text-xs text-gray-500 md:text-base">
              No payroll periods defined. Click "Add Payroll Period" to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 md:py-3">
                      Start Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 md:py-3">
                      End Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 md:py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrollPeriods.map((period) => (
                    <tr key={period.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs md:px-6 md:py-4 md:text-sm">
                        {dayjs(period.payroll_period_start).format("MMM D, YYYY")}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs md:px-6 md:py-4 md:text-sm">
                        {dayjs(period.payroll_period_end).format("MMM D, YYYY")}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium md:px-6 md:py-4 md:text-sm">
                        <button
                          onClick={() => openPayrollPeriodPanel(period)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3 md:mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePayrollPeriod(period.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Calendar Section */}
        {isLoading ? (
          <div className="flex justify-center items-center h-48 md:h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black md:h-12 md:w-12"></div>
              <p className="mt-3 text-sm text-gray-700 md:mt-4 md:text-xl">Loading calendar data...</p>
            </div>
          </div>
        ) : (
          <div className="flex">
            <div className={`flex-1 transition-all duration-300 ${isPanelOpen ? "md:pr-80" : ""}`}>
              <MasterCalendarView holidays={holidays} payrollPeriods={payrollPeriods} onDateSelect={handleDateSelect} />
            </div>

            {isPanelOpen && (
              <div className="fixed right-0 top-[112px] h-[calc(100vh-112px)] w-full max-w-xs bg-white shadow-lg z-[1] overflow-y-auto md:w-80 md:max-w-none">
                {activePanelType === "holiday" ? (
                  <AddHoliday
                    selectedDate={selectedDate}
                    holiday={selectedHoliday}
                    onSave={handleSaveHoliday}
                    onDelete={handleDeleteHoliday}
                    onClose={handleClosePanel}
                  />
                ) : (
                  <AddPayrollPeriod
                    payrollPeriod={selectedPayrollPeriod}
                    onSave={handleSavePayrollPeriod}
                    onDelete={handleDeletePayrollPeriod}
                    onClose={handleClosePanel}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminMasterCalendarPage