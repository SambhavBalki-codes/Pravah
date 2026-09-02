import {Notification} from "../models/notifications.js";

export const createNotification = async (notificationData) => {
  const newNotification = new Notification(notificationData);
  return await newNotification.save();
};

export const notifyUser = async (userId, message,type="general",link=null,priority = "low") => {


  return await createNotification({
    user: userId,
    message,
    type,
    link,
    priority,
  });
};