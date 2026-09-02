import { supervisorRequest } from "../models/supervisorRequest.js";

export const createRequest = async (requestData) => {
  const existingRequest = await supervisorRequest.findOne({
    student: requestData.student,
    supervisor: requestData.supervisor,
    status: "pending",
  });

  if (existingRequest) {
    throw new Error(
      "You have already sent a request to this supervisor. Please wait for their response.",
    );
  }

  return await supervisorRequest.create(requestData);
};
