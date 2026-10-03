import { supervisorRequest } from "../models/supervisorRequest.js";
import ErrorHandler from "../middlewares/error.js";

export const createRequest = async (requestData) => {
  const existingRequest = await supervisorRequest.findOne({
    student: requestData.student,
    status: "pending",
  });

  if (existingRequest) {
    throw new ErrorHandler(
      "You already have a pending supervisor request. Please wait for a response before sending another.",
      400,
    );
  }

  try {
    return await supervisorRequest.create(requestData);
  } catch (error) {
    if (error.code === 11000) {
      throw new ErrorHandler(
        "You already have a pending supervisor request. Please wait for a response before sending another.",
        400,
      );
    }
    throw error;
  }
};
