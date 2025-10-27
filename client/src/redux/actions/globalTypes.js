export const GLOBALTYPES = {
  AUTH: "AUTH",
  ALERT: "ALERT",
  THEME: "THEME",
  STATUS: "STATUS",
  STORY: "STORY",
  STORY_VIEWER: "STORY_VIEWER",
  MODAL: "MODAL",
  SOCKET: "SOCKET",
  ONLINE_USERS: "ONLINE_USERS",
  USER_TYPE: "USER_TYPE",
};

export const EditData = (data, id, post) => {
  const newData = data.map((item) => (item._id === id ? post : item));
  return newData;
};

export const DeleteData = (data, id) => {
  const newData = data.filter((item) => item._id !== id);
  return newData;
};

