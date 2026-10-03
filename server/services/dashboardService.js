import User from "../models/user.js";
import { Project } from "../models/project.js";
import { Deadline } from "../models/deadline.js";

const PROJECT_STATUSES = [
  "pending",
  "approved",
  "in_progress",
  "revision_required",
  "rejected",
  "completed",
];

const getMonthKeys = (months = 6) => {
  const keys = [];
  const now = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    keys.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString("en-US", { month: "short", year: "numeric" }),
    });
  }

  return keys;
};

const toCountMap = (items) =>
  items.reduce((result, item) => {
    result[item._id] = item.count;
    return result;
  }, {});

export const getDashboardData = async () => {
  const monthKeys = getMonthKeys();
  const firstMonth = new Date();
  firstMonth.setMonth(firstMonth.getMonth() - 5, 1);
  firstMonth.setHours(0, 0, 0, 0);

  const [
    [studentCount, teacherCount, projectCount, unassignedStudentCount],
    projectStatusRows,
    departmentRows,
    supervisorRows,
    monthlySubmissionRows,
    upcomingDeadlines,
    teachers,
  ] = await Promise.all([
    Promise.all([
      User.countDocuments({ role: "Student" }),
      User.countDocuments({ role: "Teacher" }),
      Project.countDocuments(),
      User.countDocuments({ role: "Student", supervisor: null }),
    ]),
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { role: "Student" } },
      {
        $group: {
          _id: { $ifNull: ["$department", "Unassigned"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]),
    User.aggregate([
      { $match: { role: "Teacher" } },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "supervisor",
          as: "projects",
        },
      },
      {
        $project: {
          name: 1,
          assignedStudents: { $size: { $ifNull: ["$assignedStudents", []] } },
          maxStudents: 1,
          supervisedProjects: { $size: "$projects" },
        },
      },
      { $sort: { assignedStudents: -1, name: 1 } },
    ]),
    Project.aggregate([
      { $match: { createdAt: { $gte: firstMonth } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Deadline.find({ dueDate: { $gte: new Date() } })
      .select("name dueDate project")
      .populate("project", "title")
      .sort({ dueDate: 1 })
      .limit(8)
      .lean(),
    User.find({ role: "Teacher" }).select("assignedStudents maxStudents").lean(),
  ]);

  const statusMap = toCountMap(projectStatusRows);
  const monthlyMap = monthlySubmissionRows.reduce((result, item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
    result[key] = item.count;
    return result;
  }, {});

  const projectStatuses = PROJECT_STATUSES.map((status) => ({
    status,
    count: statusMap[status] || 0,
  }));

  const workload = supervisorRows.map((teacher) => ({
    name: teacher.name,
    assignedStudents: teacher.assignedStudents,
    supervisedProjects: teacher.supervisedProjects,
    maxStudents: teacher.maxStudents,
    atCapacity: teacher.assignedStudents >= teacher.maxStudents,
  }));

  return {
    summary: {
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      totalProjects: projectCount,
      pendingProjects: statusMap.pending || 0,
      approvedProjects: statusMap.approved || 0,
      rejectedProjects: statusMap.rejected || 0,
      completedProjects: statusMap.completed || 0,
      unassignedStudents: unassignedStudentCount,
      teachersAtCapacity: teachers.filter(
        (teacher) =>
          (teacher.assignedStudents?.length || 0) >= teacher.maxStudents,
      ).length,
    },
    charts: {
      projectsByStatus: projectStatuses,
      studentsByDepartment: departmentRows.map((item) => ({
        department: item._id,
        count: item.count,
      })),
      supervisorWorkload: workload,
      monthlySubmissions: monthKeys.map((month) => ({
        month: month.label,
        count: monthlyMap[month.key] || 0,
      })),
      completedVsPending: [
        { status: "Completed", count: statusMap.completed || 0 },
        { status: "Pending", count: statusMap.pending || 0 },
      ],
    },
    upcomingDeadlines,
  };
};
