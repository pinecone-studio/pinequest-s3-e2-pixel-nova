const getPermissionsAsync = jest.fn(async () => ({ granted: true }));
const requestPermissionsAsync = jest.fn(async () => ({ granted: true }));
const setNotificationHandler = jest.fn();
const setNotificationChannelAsync = jest.fn(async () => undefined);
const getAllScheduledNotificationsAsync = jest.fn(async () => []);
const cancelScheduledNotificationAsync = jest.fn(async () => undefined);
const scheduleNotificationAsync = jest.fn(async () => 'notification-id');

const AndroidImportance = {
  HIGH: 4,
};

const IosAuthorizationStatus = {
  PROVISIONAL: 3,
};

const SchedulableTriggerInputTypes = {
  DATE: 'date',
};

export {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
};
