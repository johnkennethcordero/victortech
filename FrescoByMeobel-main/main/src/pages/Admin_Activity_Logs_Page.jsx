"use client"

import { useState, useEffect, useRef } from "react"
import NavBar from "../components/Nav_Bar"
import { API_BASE_URL } from "../config/api"

// Custom dropdown to prevent native select overflow on mobile
const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative w-full md:w-auto">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] md:px-4 md:py-2 md:text-sm"
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 top-full mt-1 w-full min-w-[140px] bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-56 overflow-y-auto">
          {options.map(option => (
            <li
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`px-3 py-2 text-xs cursor-pointer hover:bg-[#5C7346] hover:text-white transition-colors md:text-sm ${value === option.value ? "bg-[#5C7346] text-white font-medium" : "text-gray-800"}`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ActivityLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [moduleFilter, setModuleFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteResult, setDeleteResult] = useState(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [objectModalOpen, setObjectModalOpen] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [allModules, setAllModules] = useState([])
  const [allActionTypes, setAllActionTypes] = useState([])
  const [allDates, setAllDates] = useState([])

  const fetchFilterOptions = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/activity-log/?page=1&page_size=1000`, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      })
      if (response.ok) {
        const data = await response.json()
        const allLogItems = data.results || data
        setAllModules([...new Set(allLogItems.map(log => log.module))].filter(Boolean).sort())
        setAllActionTypes([...new Set(allLogItems.map(log => log.type))].filter(Boolean).sort())
        setAllDates(
          [...new Set(allLogItems.map(log => {
            if (!log.datetime) return null
            return new Date(log.datetime).toISOString().split("T")[0]
          }))].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))
        )
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
      setAllModules([...new Set(logs.map(log => log.module))].filter(Boolean).sort())
      setAllActionTypes([...new Set(logs.map(log => log.type))].filter(Boolean).sort())
      setAllDates(
        [...new Set(logs.map(log => {
          if (!log.datetime) return null
          return new Date(log.datetime).toISOString().split("T")[0]
        }))].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))
      )
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const accessToken = localStorage.getItem("access_token")
      let url = `${API_BASE_URL}/activity-log/?page=${currentPage}&page_size=${pageSize}`
      if (moduleFilter !== "all") url += `&model_name=${moduleFilter}`
      if (typeFilter !== "all") url += `&event_type=${typeFilter === "CREATE" ? 1 : typeFilter === "UPDATE" ? 2 : typeFilter === "DELETE" ? 3 : ""}`
      if (dateFilter !== "all") url += `&date=${dateFilter}`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      })
      const data = await response.json()

      if (response.ok) {
        if (data.results && Array.isArray(data.results)) {
          setLogs(data.results)
          setTotalItems(data.count || 0)
          setTotalPages(Math.ceil((data.count || 0) / pageSize))
        } else if (Array.isArray(data)) {
          setLogs(data)
          setTotalItems(data.length)
          setTotalPages(Math.ceil(data.length / pageSize))
        } else {
          setError("Unexpected data format received from the server.")
        }
      } else {
        setError(data.message || "Failed to fetch activity logs. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error)
      setError("An error occurred while fetching activity logs. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const deleteLogsByDate = async (date) => {
    if (!date || date === "all") return
    setIsDeleting(true)
    setDeleteResult({ success: true, message: "Deleting..." })
    try {
      const accessToken = localStorage.getItem("access_token")
      await fetch(`${API_BASE_URL}/activity-log/delete_by_date/?date=${date}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      })
      setDeleteConfirmOpen(false)
      setDateFilter("all")
      setCurrentPage(1)
      await fetchLogs()
      await fetchFilterOptions()
    } catch (error) {
      console.error("Error deleting logs:", error)
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
      setDeleteResult(null)
    }
  }

  useEffect(() => {
    fetchFilterOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, moduleFilter, typeFilter, dateFilter])

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const formatTime = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    const userEmail = log.user?.email?.toLowerCase() || ""
    const module = log.module?.toLowerCase() || ""
    const type = log.type?.toLowerCase() || ""
    return (
      userEmail.includes(searchTerm.toLowerCase()) ||
      module.includes(searchTerm.toLowerCase()) ||
      type.includes(searchTerm.toLowerCase()) ||
      String(log.id).includes(searchTerm)
    )
  })

  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1) }
  const prevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1) }

  const formatChanges = (changes) => {
    if (!changes) return "No changes recorded"
    return Object.entries(changes)
      .map(([key, [oldValue, newValue]]) => `${key}: ${oldValue || "None"} → ${newValue || "None"}`)
      .join(", ")
  }

  const handleRefresh = () => { fetchLogs(); fetchFilterOptions() }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    if (currentPage !== 1) setCurrentPage(1)
  }

  const openObjectModal = (object) => {
    setSelectedObject(object)
    setObjectModalOpen(true)
  }

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value))
    setCurrentPage(1)
  }

  const moduleOptions = [
    { value: "all", label: "All Modules" },
    ...allModules.map(m => ({ value: m, label: m }))
  ]
  const typeOptions = [
    { value: "all", label: "All Actions" },
    ...allActionTypes.map(t => ({ value: t, label: t }))
  ]
  const dateOptions = [
    { value: "all", label: "All Dates" },
    ...allDates.map(d => ({ value: d, label: formatDate(d) }))
  ]
  const pageSizeOptions = [
    { value: "10", label: "10 / page" },
    { value: "25", label: "25 / page" },
    { value: "50", label: "50 / page" },
    { value: "100", label: "100 / page" },
  ]

  const actionBadgeClass = (type) => {
    switch (type) {
      case "CREATE": return "bg-green-100 text-green-800"
      case "UPDATE": return "bg-blue-100 text-blue-800"
      case "DELETE": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading && logs.length === 0)
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error)
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-3 pt-16 md:px-8 md:pt-16">
        <div className="bg-[#333333] rounded-lg p-3 md:p-6">

          {/* Header */}
          <div className="flex flex-col gap-3 mb-4 md:flex-row md:justify-between md:items-center md:mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white md:text-xl">Activity Log</h2>
              <button
                onClick={handleRefresh}
                className="bg-[#5C7346] text-white px-2 py-1 text-xs rounded-md hover:bg-[#4a5c38] transition-colors md:px-3 md:py-2 md:text-sm"
              >
                Refresh
              </button>
            </div>
            <input
              type="search"
              placeholder="Search by email, module, action..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-2 text-sm rounded-md "
            />
          </div>

          {/* Delete notification */}
          {deleteResult && (
            <div className={`mb-3 p-2 text-sm rounded-md md:mb-4 md:p-3 ${deleteResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {deleteResult.message}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 mb-4 md:flex md:flex-row md:mb-6">
            <CustomSelect
              value={moduleFilter}
              onChange={(val) => { setModuleFilter(val); setCurrentPage(1) }}
              options={moduleOptions}
              placeholder="All Modules"
            />
            <CustomSelect
              value={typeFilter}
              onChange={(val) => { setTypeFilter(val); setCurrentPage(1) }}
              options={typeOptions}
              placeholder="All Actions"
            />
            <CustomSelect
              value={dateFilter}
              onChange={(val) => { setDateFilter(val); setCurrentPage(1) }}
              options={dateOptions}
              placeholder="All Dates"
            />
            <button
              onClick={() => dateFilter !== "all" ? setDeleteConfirmOpen(true) : null}
              disabled={dateFilter === "all" || isDeleting}
              className="w-full px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:w-auto md:px-4 md:py-2 md:text-sm"
            >
              Delete
            </button>
          </div>

          {/* Loading indicator */}
          {loading && logs.length > 0 && (
            <div className="mb-3 p-2 text-center text-sm text-white bg-[#5C7346] bg-opacity-50 rounded-md">
              Loading...
            </div>
          )}

          {/* TABLE */}
          <div className="overflow-x-auto md:overflow-x-visible">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="text-left text-white border-b border-white/20">
                  {/* Mobile visible: ID, Date & Time, Changes, Details */}
                  <th className="py-2 px-2 md:py-3 md:px-4">ID</th>
                  <th className="py-2 px-2 md:py-3 md:px-4">Date & Time</th>
                  {/* Module: desktop only */}
                  <th className="hidden md:table-cell py-3 px-4">Module</th>
                  {/* Action: desktop only */}
                  <th className="hidden md:table-cell py-3 px-4">Action</th>
                  <th className="py-2 px-2 md:py-3 md:px-4">Changes</th>
                  <th className="py-2 px-2 md:py-3 md:px-4">Details</th>
                  {/* User: desktop only */}
                  <th className="hidden md:table-cell py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-white/10">

                    {/* ID */}
                    <td className="py-2 px-2 md:py-3 md:px-4 font-medium">{log.id}</td>

                    {/* Date & Time stacked */}
                    <td className="py-2 px-2 md:py-3 md:px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="whitespace-nowrap">{formatDate(log.datetime)}</span>
                        <span className="text-white/60 text-xs whitespace-nowrap">{formatTime(log.datetime)}</span>
                      </div>
                    </td>

                    {/* Module: desktop only */}
                    <td className="hidden md:table-cell py-3 px-4">{log.module}</td>

                    {/* Action badge: desktop only */}
                    <td className="hidden md:table-cell py-3 px-4">
                      <span className={`px-3 py-1 rounded-full font-medium text-xs ${actionBadgeClass(log.type)}`}>
                        {log.type}
                      </span>
                    </td>

                    {/* Changes */}
                    <td className="py-2 px-2 md:py-3 md:px-4 italic text-xs max-w-[100px] md:max-w-none truncate md:whitespace-normal">
                      {log.changes ? formatChanges(log.changes) : <span className="text-white/40">—</span>}
                    </td>

                    {/* Details / View button */}
                    <td className="py-2 px-2 md:py-3 md:px-4">
                      {log.object ? (
                        <button
                          onClick={() => openObjectModal(log.object)}
                          className="bg-[#5C7346] hover:bg-[#4a5c38] text-white px-2 py-0.5 text-xs rounded-md transition-colors md:px-3 md:py-1"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-white/40 text-xs">—</span>
                      )}
                    </td>

                    {/* User: desktop only */}
                    <td className="hidden md:table-cell py-3 px-4">{log.user?.email || "System"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="py-3 px-4 text-center">No logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="flex flex-col gap-3 mt-4 md:flex-row md:justify-between md:items-center md:mt-6">
            <div className="text-white flex items-center gap-2 text-xs md:text-sm">
              <span>Showing {filteredLogs.length} of {totalItems} logs</span>
              <div className="w-32">
                <CustomSelect
                  value={String(pageSize)}
                  onChange={(val) => handlePageSizeChange({ target: { value: val } })}
                  options={pageSizeOptions}
                  placeholder="10 / page"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1 || loading}
                className="bg-[#5C7346] text-white px-3 py-1.5 text-xs rounded-md hover:bg-[#4a5c38] transition-colors disabled:opacity-50 md:px-4 md:py-2 md:text-sm"
              >
                Previous
              </button>
              <div className="bg-white text-[#5C7346] px-3 py-1.5 text-xs rounded-md text-center min-w-[80px] md:px-4 md:py-2 md:text-sm md:w-32">
                {currentPage} of {totalPages || 1}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || loading}
                className="bg-[#5C7346] text-white px-3 py-1.5 text-xs rounded-md hover:bg-[#4a5c38] transition-colors disabled:opacity-50 md:px-4 md:py-2 md:text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-5 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-3 md:text-xl md:mb-4">Confirm Delete</h3>
              <p className="text-sm mb-5 md:text-base md:mb-6">
                Are you sure you want to delete all activity logs for{" "}
                <span className="font-semibold">{formatDate(dateFilter)}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition-colors md:px-4 md:py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteLogsByDate(dateFilter)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 md:px-4 md:py-2"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Object Details Modal */}
        {objectModalOpen && selectedObject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-5 w-full max-w-4xl max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold md:text-xl">Object Details</h3>
                <button onClick={() => setObjectModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-50 p-3 rounded-md md:p-4">
                {selectedObject.map((item, index) => (
                  <div key={index} className="mb-4">
                    <h4 className="font-semibold mb-1 text-sm md:text-base md:mb-2">Model: {item.model}</h4>
                    <p className="mb-2 text-sm">Primary Key: {item.pk}</p>
                    <div className="mb-2">
                      <h5 className="font-semibold mb-1 text-sm">Fields:</h5>
                      <div className="bg-white p-2 rounded border md:p-3">
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {JSON.stringify(item.fields, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setObjectModalOpen(false)}
                  className="px-3 py-1.5 text-sm bg-[#5C7346] text-white rounded-md hover:bg-[#4a5c38] transition-colors md:px-4 md:py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogPage