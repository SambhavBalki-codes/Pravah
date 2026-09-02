import User from "../models/user.js";
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
