import { supervisorRequest } from "../models/supervisorRequest.js";
import ErrorHandler from "../middlewares/error.js";

export const createRequest = async (requestData) => {
  const existingRequest = await supervisorRequest.findOne({
    student: requestData.student,
    supervisor: requestData.supervisor,
    status: "pending",
  });

  if (existingRequest) {
    throw new ErrorHandler(
      "You have already sent a request to this supervisor. Please wait for their response.",
      400,
    );
  }

  try {
    return await supervisorRequest.create(requestData);
  } catch (error) {
    if (error.code === 11000) {
      throw new ErrorHandler(
        "You have already sent a request to this supervisor. Please wait for their response.",
        400,
      );
    }
    throw error;
  }
};
