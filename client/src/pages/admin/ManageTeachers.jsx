import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  BriefcaseBusiness,
  Building,
  GraduationCap,
} from "lucide-react";
import AddTeacher from "../../components/modal/AddTeacher";
import {
  createTeacher,
  deleteTeacher,
  updateTeacher,
} from "../../store/slices/adminSlice";
import { toggleTeacherModal } from "../../store/slices/popupSlice";

const ManageTeachers = () => {
  const { users } = useSelector((state) => state.admin);
  const { isCreateTeacherModalOpen } = useSelector((state) => state.popup);

  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    maxStudents: 10,
    expertise: "",
  });

  const dispatch = useDispatch();

  const teachers = useMemo(() => {
    return (users || [])
      .filter((user) => user.role?.toLowerCase() === "teacher")
      .map((teacher) => ({
        ...teacher,
        expertiseList: Array.isArray(teacher.expertise)
          ? teacher.expertise
          : typeof teacher.expertise === "string" && teacher.expertise.trim()
            ? teacher.expertise.split(",").map((item) => item.trim())
            : [],
        assignedStudentCount: Array.isArray(teacher.assignedStudents)
          ? teacher.assignedStudents.length
          : 0,
      }));
  }, [users]);

  const departments = useMemo(() => {
    const uniqueDepartments = new Set();
    teachers.forEach((teacher) => {
      if (teacher.department) {
        uniqueDepartments.add(teacher.department);
      }
    });
    return Array.from(uniqueDepartments);
  }, [teachers]);

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      (teacher.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.expertiseList.some((item) =>
        item.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesFilter =
      filterDepartment === "all" || teacher.department === filterDepartment;

    return matchesSearch && matchesFilter;
  });

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    setFormData({
      name: "",
      email: "",
      department: "",
      maxStudents: 10,
      expertise: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      maxStudents: Number(formData.maxStudents),
      expertise: formData.expertise
        ? formData.expertise
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    };

    if (editingTeacher) {
      const teacherId = editingTeacher._id || editingTeacher.id;
      dispatch(updateTeacher({ id: teacherId, data: payload }));
    } else {
      dispatch(createTeacher(payload));
    }

    handleCloseModal();
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || "",
      email: teacher.email || "",
      department: teacher.department || "",
      maxStudents: teacher.maxStudents || 10,
      expertise: Array.isArray(teacher.expertise)
        ? teacher.expertise.join(", ")
        : Array.isArray(teacher.expertiseList)
          ? teacher.expertiseList.join(", ")
          : "",
    });
    setShowModal(true);
  };

  const handleDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (teacherToDelete) {
      const teacherId = teacherToDelete._id || teacherToDelete.id;
      dispatch(deleteTeacher(teacherId));
    }
    setShowDeleteModal(false);
    setTeacherToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTeacherToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Manage Teachers
            </h1>
            <p className="text-sm text-slate-500">
              Add, edit, and manage teacher profiles and supervision capacity.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            onClick={() => dispatch(toggleTeacherModal())}
          >
            <Plus className="h-4 w-4" />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>

            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">
                Total Teachers
              </p>

              <p className="text-lg font-semibold text-slate-800">
                {teachers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-violet-100 p-3">
              <BriefcaseBusiness className="h-6 w-6 text-violet-600" />
            </div>

            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">
                Assigned Students
              </p>

              <p className="text-lg font-semibold text-slate-800">
                {teachers.reduce(
                  (total, teacher) => total + teacher.assignedStudentCount,
                  0,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-emerald-100 p-3">
              <GraduationCap className="h-6 w-6 text-emerald-600" />
            </div>

            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Departments</p>

              <p className="text-lg font-semibold text-slate-800">
                {departments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or expertise"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2">
              <Building className="h-5 w-5 text-purple-600" />
              <p className="text-sm font-medium text-slate-600">Departments:</p>
              <p className="text-sm font-semibold text-slate-700">
                {departments.length}
              </p>
            </div>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-3 font-medium">Teacher</th>
                <th className="py-3 font-medium">Department</th>
                <th className="py-3 font-medium">Expertise</th>
                <th className="py-3 font-medium">Max Students</th>
                <th className="py-3 font-medium">Assigned</th>
                <th className="py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr
                    key={teacher._id || teacher.id}
                    className="border-b border-slate-100"
                  >
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-slate-800">
                          {teacher.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {teacher.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">
                      {teacher.department || "-"}
                    </td>
                    <td className="py-3 text-slate-600">
                      {teacher.expertiseList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.expertiseList.slice(0, 3).map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-medium text-sky-700"
                            >
                              {item}
                            </span>
                          ))}
                          {teacher.expertiseList.length > 3 && (
                            <span className="text-[10px] text-slate-500">
                              +{teacher.expertiseList.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 text-slate-600">
                      {teacher.maxStudents || 10}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {teacher.assignedStudentCount}/
                        {teacher.maxStudents || 10}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(teacher)}
                          className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(teacher)}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="py-8 text-center text-sm text-slate-500"
                  >
                    No teachers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateTeacherModalOpen && <AddTeacher />}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTeacher ? "Edit Teacher" : "Add Teacher"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">
                      Electrical Engineering
                    </option>
                    <option value="Electronics Engineering">
                      Electronics Engineering
                    </option>
                    <option value="Mechanical Engineering">
                      Mechanical Engineering
                    </option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Chemical Engineering">
                      Chemical Engineering
                    </option>
                    <option value="Mining Engineering">
                      Mining Engineering
                    </option>
                    <option value="Metallurgical Engineering">
                      Metallurgical Engineering
                    </option>
                    <option value="Aerospace Engineering">
                      Aerospace Engineering
                    </option>
                    <option value="Biomedical Engineering">
                      Biomedical Engineering
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Max Students
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStudents: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Expertise
                </label>
                <textarea
                  rows="3"
                  value={formData.expertise}
                  onChange={(e) =>
                    setFormData({ ...formData, expertise: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:border-red-400 hover:bg-red-100 hover:text-red-700 hover:shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  {editingTeacher ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800">Delete Teacher</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-bold">{teacherToDelete?.name}</span>?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTeachers;
