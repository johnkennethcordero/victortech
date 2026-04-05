"use client"

import { useState, useEffect, useRef } from "react"
import NavBar from "../components/Nav_Bar"
import AddEmployee from "../components/Add_Employee"
import EditEmployee from "../components/Edit_Employee"
import DeleteEmployee from "../components/Delete_Employee"
import { API_BASE_URL } from "../config/api"
import { useNavigate } from "react-router-dom"

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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center justify-between gap-1 px-1.5 py-1 text-xs bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] min-w-[80px] md:px-4 md:py-2 md:text-sm md:min-w-[110px]"
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform text-gray-500 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute right-0 top-full mt-1 w-full min-w-[120px] bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
          {options.map(option => (
            <li
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`px-3 py-2 text-xs cursor-pointer hover:bg-[#5C7346] hover:text-white transition-colors md:text-sm ${
                value === option.value ? "bg-[#5C7346] text-white font-medium" : "text-gray-800"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AdminEmployeePage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [currentPage, setCurrentPage] = useState(1)
  const [yearFilter, setYearFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [employeeToEdit, setEmployeeToEdit] = useState(null)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const employeesPerPage = 5

  const navigate = useNavigate()

  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/employment-info/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      if (response.ok) {
        if (Array.isArray(data)) {
          setEmployees(data)
        } else {
          setError("Unexpected data format received from the server.")
        }
      } else {
        setError(data.message || "Failed to fetch employee data. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
      setError("An error occurred while fetching employee data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees() }, [])

  const capitalizeRole = (role) => {
    if (!role) return ""
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const getYearFromDate = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).getFullYear()
  }

  const handleAddEmployee = (newEmployee) => {
    setEmployees((prev) => [newEmployee, ...prev])
    setCurrentPage(1)
  }

  const handleEditClick = (employee) => {
    setEmployeeToEdit(employee)
    setIsEditModalOpen(true)
  }

  const handleUpdateEmployee = async (updatedEmployee) => {
    try {
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
      )
      await fetchEmployees()
      if (updatedEmployee.resignation_date && !updatedEmployee.active) {
        setActiveTab("inactive")
      }
    } catch (error) {
      console.error("Error updating employee state:", error)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    if (tab === "inactive") {
      setYearFilter("all")
      setRoleFilter("all")
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesTab = activeTab === "active" ? employee.active : !employee.active
    if (!matchesTab) return false

    if (activeTab === "inactive") {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchLower) ||
          employee.employee_number?.toString().includes(searchLower) ||
          employee.position?.toLowerCase().includes(searchLower) ||
          employee.address?.toLowerCase().includes(searchLower) ||
          (employee.user?.email && employee.user.email.toLowerCase().includes(searchLower))
        )
      }
      return true
    }

    const yearEmployed = getYearFromDate(employee.hire_date)
    const matchesYear = yearFilter === "all" || yearEmployed.toString() === yearFilter
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "owner" && !employee.user) ||
      (employee.user && employee.user.role && employee.user.role.toLowerCase() === roleFilter.toLowerCase())

    if (!matchesYear || !matchesRole) return false

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchLower) ||
        employee.employee_number?.toString().includes(searchLower) ||
        employee.position?.toLowerCase().includes(searchLower) ||
        employee.address?.toLowerCase().includes(searchLower) ||
        (employee.user?.email && employee.user.email.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  const sortedFilteredEmployees = [...filteredEmployees].sort((a, b) => b.id - a.id)

  const years = [...new Set(employees.map((e) => getYearFromDate(e.hire_date)))]
    .filter((year) => year !== "-")
    .sort((a, b) => b - a)
  const roles = ["owner", "admin", "employee"]

  const totalPages = Math.max(1, Math.ceil(sortedFilteredEmployees.length / employeesPerPage))
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  if (currentPage !== validCurrentPage) setCurrentPage(validCurrentPage)

  const indexOfLastEmployee = validCurrentPage * employeesPerPage
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage
  const currentEmployees = sortedFilteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    try {
      if (!employeeToDelete) return
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/employment-info/${employeeToDelete.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        setEmployees((prevEmployees) => prevEmployees.filter((emp) => emp.id !== employeeToDelete.id))
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to delete employee. Please try again.")
      }
    } catch (error) {
      console.error("Error in delete operation:", error)
      setError("An error occurred while deleting the employee. Please try again later.")
    } finally {
      setIsDeleteModalOpen(false)
      setEmployeeToDelete(null)
    }
  }

  const handleViewSchedule = (employeeId) => {
    if (!employeeId) {
      alert("Cannot view schedule: Employee ID not found")
      return
    }
    navigate(`/employee/schedule/${employeeId}`)
  }

  // Build option arrays for CustomSelect
  const yearOptions = [
    { value: "all", label: "All Years" },
    ...years.map(y => ({ value: y.toString(), label: y.toString() }))
  ]
  const roleOptions = [
    { value: "all", label: "All Roles" },
    ...roles.map(r => ({ value: r.toLowerCase(), label: capitalizeRole(r) }))
  ]

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-3 pt-3 md:px-8 md:pt-20">
        <div className="bg-[#333333] rounded-lg p-3 md:p-6">

          {/* Header Section */}
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">

            {/* Tab Buttons */}
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 text-sm md:px-6 md:py-2 md:text-base rounded-md ${
                  activeTab === "active" ? "bg-[#5C7346] text-white font-semibold" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => handleTabChange("active")}
              >
                Active
              </button>
              <button
                className={`px-3 py-1 text-sm md:px-6 md:py-2 md:text-base rounded-md ${
                  activeTab === "inactive" ? "bg-[#5C7346] text-white font-semibold" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => handleTabChange("inactive")}
              >
                Inactive
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-row items-center gap-1.5 md:gap-2">
              <input
                type="search"
                placeholder="Search by name, ID, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2 py-1 text-xs rounded-md border-0 w-full md:w-54 md:px-4 md:py-2 md:text-sm"
              />
              {activeTab === "active" && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <CustomSelect
                    value={yearFilter}
                    onChange={(val) => setYearFilter(val)}
                    options={yearOptions}
                    placeholder="All Years"
                  />
                  <CustomSelect
                    value={roleFilter}
                    onChange={(val) => setRoleFilter(val)}
                    options={roleOptions}
                    placeholder="All Roles"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-base font-semibold text-white mb-3 md:text-3xl md:mb-4">Employees</h2>

          {/* Employee Table */}
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="px-3 md:px-0">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white border-b border-white/20 whitespace-nowrap">
                    <th className="py-2 px-2 text-xs w-[10%] md:py-3 md:px-4 md:text-sm">ID</th>
                    <th className="py-2 px-2 text-xs w-[20%] md:py-3 md:px-4 md:text-sm">Name</th>
                    <th className="py-2 px-2 text-xs w-[10%] md:py-3 md:px-4 md:text-sm">Position</th>
                    <th className="py-2 px-2 text-xs w-[10%] md:py-3 md:px-4 md:text-sm">Year Employed</th>
                    {activeTab === "inactive" && (
                      <th className="py-2 px-2 text-xs w-[15%] md:py-3 md:px-4 md:text-sm">Year Resigned</th>
                    )}
                    {activeTab === "active" && (
                      <th className="hidden md:table-cell py-3 px-4 text-sm w-[10%]">Status</th>
                    )}
                    {activeTab === "active" && (
                      <th className="hidden md:table-cell py-3 px-4 text-sm w-[15%]">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-white">
                  {currentEmployees.map((employee) => (
                    <>
                      <tr key={employee.id} className={activeTab === "active" ? "md:border-b md:border-white/10" : "border-b border-white/10"}>
                        <td className="py-2 px-2 text-xs overflow-hidden text-ellipsis whitespace-nowrap md:py-3 md:px-4 md:text-sm">
                          {employee.employee_number}
                        </td>
                        <td className="py-2 px-2 text-xs overflow-hidden text-ellipsis whitespace-nowrap md:py-3 md:px-4 md:text-sm"
                          title={`${employee.first_name} ${employee.last_name}`}
                        >
                          {(() => {
                            const fullName = `${employee.first_name} ${employee.last_name}`
                            return fullName.length > 60 ? fullName.substring(0, 57) + "..." : fullName
                          })()}
                        </td>
                        <td className="py-2 px-2 text-xs overflow-hidden text-ellipsis whitespace-nowrap md:py-3 md:px-4 md:text-sm"
                          title={employee.position}
                        >
                          {employee.position}
                        </td>
                        <td className="py-2 px-2 text-xs overflow-hidden text-ellipsis whitespace-nowrap md:py-3 md:px-4 md:text-sm">
                          {getYearFromDate(employee.hire_date)}
                        </td>
                        {activeTab === "inactive" && (
                          <td className="py-2 px-2 text-xs overflow-hidden text-ellipsis whitespace-nowrap md:py-3 md:px-4 md:text-sm">
                            {getYearFromDate(employee.resignation_date) || "-"}
                          </td>
                        )}
                        {activeTab === "active" && (
                          <td className="hidden md:table-cell py-3 px-4">
                            <span className="px-4 py-1 text-sm bg-green-100 text-green-800 rounded-full font-medium whitespace-nowrap">
                              Active
                            </span>
                          </td>
                        )}
                        {activeTab === "active" && (
                          <td className="hidden md:table-cell py-3 px-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditClick(employee)}
                                className="bg-[#5C7346] text-white px-3 py-1 text-base rounded-md hover:bg-[#4a5c38] transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleViewSchedule(employee.id)}
                                className="bg-blue-500 text-white px-3 py-1 text-base rounded-md hover:bg-blue-600 transition-colors"
                              >
                                Schedule
                              </button>
                              <button
                                onClick={() => handleDeleteClick(employee)}
                                className="bg-red-600 text-white px-3 py-1 text-base rounded-md hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Mobile-only actions sub-row */}
                      {activeTab === "active" && (
                        <tr key={`mobile-actions-${employee.id}`} className="border-b border-white/10 md:hidden">
                          <td colSpan="4" className="pb-2 px-2">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditClick(employee)}
                                className="bg-[#5C7346] text-white px-2 py-0.5 text-xs rounded-md hover:bg-[#4a5c38] transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleViewSchedule(employee.id)}
                                className="bg-blue-500 text-white px-2 py-0.5 text-xs rounded-md hover:bg-blue-600 transition-colors"
                              >
                                Schedule
                              </button>
                              <button
                                onClick={() => handleDeleteClick(employee)}
                                className="bg-red-600 text-white px-2 py-0.5 text-xs rounded-md hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}

                  {[...Array(Math.max(0, employeesPerPage - currentEmployees.length))].map((_, index) => (
                    <tr key={`empty-${index}`} className="border-b border-white/10 h-[40px] md:h-[52px]">
                      <td colSpan={activeTab === "inactive" ? "5" : "7"}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-row justify-between items-center mt-3 md:mt-6">
            {activeTab === "active" && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black text-white px-4 py-1.5 text-xs rounded-md font-medium md:px-6 md:py-2 md:text-base"
              >
                Add Account
              </button>
            )}
            {activeTab === "inactive" && <div />}

            <div className="flex justify-center space-x-1 md:space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="bg-[#666666] text-white px-3 py-1.5 text-xs rounded-md disabled:opacity-50 md:px-4 md:py-2 md:text-base"
              >
                Previous
              </button>
              <div className="bg-white text-[#5C7346] px-3 py-1.5 text-xs rounded-md min-w-[60px] text-center md:px-4 md:py-2 md:text-base md:min-w-[80px]">
                {currentPage} of {totalPages}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="bg-[#666666] text-white px-3 py-1.5 text-xs rounded-md disabled:opacity-50 md:px-4 md:py-2 md:text-base"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEmployee isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddEmployee} />
      <EditEmployee
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEmployeeToEdit(null) }}
        onUpdate={handleUpdateEmployee}
        employeeData={employeeToEdit}
      />
      <DeleteEmployee
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setEmployeeToDelete(null) }}
        onConfirm={handleConfirmDelete}
        employeeName={employeeToDelete ? `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : ""}
      />
    </div>
  )
}

export default AdminEmployeePage