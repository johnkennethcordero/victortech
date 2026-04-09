"use client"

import { useState, useEffect, useRef } from "react"
import NavBar from "../components/Nav_Bar"
import AddEmployee from "../components/Add_Employee"
import EditEmployee from "../components/Edit_Employee"
import DeleteEmployee from "../components/Delete_Employee"
import { API_BASE_URL } from "../config/api"
import { useNavigate } from "react-router-dom"
import { getTypographyClass, getButtonTypographyClass, getNumericTypographyClass } from "../utils/typography"

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
        className="flex items-center justify-between gap-1 px-2 py-1.5 text-sm bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] min-w-[90px] md:px-4 md:py-2 md:text-base md:min-w-[120px]"
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform text-gray-500 dark:text-gray-400 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute right-0 top-full mt-1 w-full min-w-[120px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
          {options.map(option => (
            <li
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#5C7346] hover:text-white transition-colors md:text-base ${
                value === option.value ? "bg-[#5C7346] text-white font-medium" : "text-gray-800 dark:text-gray-200"
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

  const yearOptions = [
    { value: "all", label: "All Years" },
    ...years.map(y => ({ value: y.toString(), label: y.toString() }))
  ]
  const roleOptions = [
    { value: "all", label: "All Roles" },
    ...roles.map(r => ({ value: r.toLowerCase(), label: capitalizeRole(r) }))
  ]

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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors duration-300">
      <NavBar />

      <div className="container mx-auto px-3 pt-12 md:px-8 md:pt-20">

        {/* Heading */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-700 dark:text-gray-100">Employees</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">Manage your team members, view their information, and handle employee records</p>
        </div>

        {/* Pill Slider */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex bg-gray-100 dark:bg-dark-card rounded-full p-1">
            <button
              className={`px-6 py-2 text-sm rounded-full md:px-8 md:py-2 md:text-base transition-colors ${
                activeTab === "active"
                  ? "bg-gray-600 dark:bg-gray-500 text-white font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => handleTabChange("active")}
            >
              Active
            </button>
            <button
              className={`px-6 py-2 text-sm rounded-full md:px-8 md:py-2 md:text-base transition-colors ${
                activeTab === "inactive"
                  ? "bg-gray-600 dark:bg-gray-500 text-white font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
              onClick={() => handleTabChange("inactive")}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-dark-card rounded-lg p-3 md:p-6 border border-transparent dark:border-dark-border">

          {/* Header — search and filters */}
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
            <div className="flex flex-row items-center gap-1.5 md:gap-2">
              <input
                type="search"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5C7346] w-full md:w-64 md:px-4 md:py-2 md:text-base"
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

          {/* Employee Table */}
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="px-3 md:px-0">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-dark-border whitespace-nowrap">
                    {/* Combined Employee column */}
                    <th className="py-2 px-2 text-sm w-[40%] md:py-3 md:px-4 md:text-base md:w-[30%]">Employee</th>
                    <th className="py-2 px-2 text-sm w-[25%] md:py-3 md:px-4 md:text-base md:w-[20%]">Position</th>
                    <th className="py-2 px-2 text-sm w-[20%] md:py-3 md:px-4 md:text-base md:w-[15%]">Year Employed</th>
                    {activeTab === "inactive" && (
                      <th className="py-2 px-2 text-sm md:py-3 md:px-4 md:text-base">Year Resigned</th>
                    )}
                    {activeTab === "active" && (
                      <th className="hidden md:table-cell py-3 px-4 text-base w-[10%]">Status</th>
                    )}
                    {activeTab === "active" && (
                      <th className="hidden md:table-cell py-3 px-4 text-base w-[15%]">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-100">
                  {currentEmployees.map((employee) => (
                    <>
                      <tr
                        key={employee.id}
                        className={activeTab === "active" ? "md:border-b md:border-gray-100 dark:md:border-dark-border" : "border-b border-gray-100 dark:border-dark-border"}
                      >
                        {/* Combined Name + ID cell */}
                        <td className="py-2 px-2 md:py-3 md:px-4">
                          <div
                            className="font-medium text-base md:text-xl overflow-hidden text-ellipsis whitespace-nowrap"
                            title={`${employee.first_name} ${employee.last_name}`}
                          >
                            {(() => {
                              const fullName = `${employee.first_name} ${employee.last_name}`
                              return fullName.length > 60 ? fullName.substring(0, 57) + "..." : fullName
                            })()}
                          </div>
                          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {employee.employee_number}
                          </div>
                        </td>

                        <td
                          className="py-2 px-2 text-sm overflow-hidden text-ellipsis whitespace-nowrap md:py-3 md:px-4 md:text-base"
                          title={employee.position}
                        >
                          {employee.position}
                        </td>

                        <td className="py-2 px-2 text-sm overflow-hidden text-ellipsis whitespace-nowrap md:py-3 md:px-4 md:text-base">
                          {getYearFromDate(employee.hire_date)}
                        </td>

                        {activeTab === "inactive" && (
                          <td className="py-2 px-2 text-sm overflow-hidden text-ellipsis whitespace-nowrap md:py-3 md:px-4 md:text-base">
                            {getYearFromDate(employee.resignation_date) || "-"}
                          </td>
                        )}

                        {activeTab === "active" && (
                          <td className="hidden md:table-cell py-3 px-4">
                            <span className="px-4 py-1 text-base bg-green-100 text-green-800 rounded-full font-medium whitespace-nowrap">
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
                        <tr key={`mobile-actions-${employee.id}`} className="border-b border-gray-100 dark:border-dark-border md:hidden">
                          <td colSpan="3" className="pb-2 px-2">
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
                    <tr key={`empty-${index}`} className="border-b border-gray-100 dark:border-dark-border h-[48px] md:h-[60px]">
                      <td colSpan={activeTab === "inactive" ? "4" : "5"}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-row justify-end items-center mt-3 md:mt-6">
            <div className="flex justify-center space-x-1 md:space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="bg-[#666666] dark:bg-gray-600 text-white px-3 py-1.5 text-sm rounded-md disabled:opacity-50 md:px-4 md:py-2 md:text-base"
              >
                Previous
              </button>
              <div className="bg-white dark:bg-dark-bg text-[#5C7346] px-3 py-1.5 text-sm rounded-md min-w-[60px] text-center md:px-4 md:py-2 md:text-base md:min-w-[80px] border border-gray-200 dark:border-dark-border">
                {currentPage} of {totalPages}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="bg-[#666666] dark:bg-gray-600 text-white px-3 py-1.5 text-sm rounded-md disabled:opacity-50 md:px-4 md:py-2 md:text-base"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Add Account Button */}
      {activeTab === "active" && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-20 right-5 z-50 bg-[#5C7346] text-white px-5 py-3.5 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 md:bottom-8 md:right-8 md:text-base hover:bg-[#4a5c38] transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Account
        </button>
      )}

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