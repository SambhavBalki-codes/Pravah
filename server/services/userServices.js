import User from "../models/user.js";
import { Project } from "../models/project.js";
import { supervisorRequest } from "../models/supervisorRequest.js";
import ErrorHandler from "../middlewares/error.js";

export const createUser = async (userData) => {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    throw new ErrorHandler(`Error creating user: ${error.message}`, 500);
  }
};

export const updateUser = async (id, updateData) => {
  try {
    return await User.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");
  } catch (error) {
    throw new ErrorHandler(`Error updating user: ${error.message}`, 500);
  }
};

export const getUserById = async (id) => {
  try {
    return await User.findById(id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );
  } catch (error) {
    throw new ErrorHandler(`Error fetching user: ${error.message}`, 500);
  }
};

export const deleteUser = async (id) => {
  try {
    const user = await User.findById(id);

    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    const [projectCount, requestCount] = await Promise.all([
      user.role === "Student"
        ? Project.countDocuments({ student: id })
        : Project.countDocuments({ supervisor: id }),
      supervisorRequest.countDocuments({
        $or: [{ student: id }, { supervisor: id }],
      }),
    ]);

    const hasAssignedStudents =
      user.role === "Teacher" && user.assignedStudents.length > 0;

    if (projectCount > 0 || requestCount > 0 || hasAssignedStudents) {
      const dependency =
        user.role === "Student"
          ? "projects or supervisor requests"
          : "supervised projects, assigned students, or supervisor requests";

      throw new ErrorHandler(
        `Cannot delete this ${user.role.toLowerCase()} while ${dependency} still exist. Reassign or remove these dependencies first.`,
        409,
      );
    }

    return await User.findByIdAndDelete(id);
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(`Error deleting user: ${error.message}`, 500);
  }
};

export const getAllUsers = async () => {
  try {
    const users = await User.find().select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );
    return users;
  } catch (error) {
    throw new ErrorHandler(`Error fetching users: ${error.message}`, 500);
  }
};
