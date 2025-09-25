export const GLOBALTYPES = {
  AUTH: "AUTH",
  ALERT: "ALERT",
  THEME: "THEME",
  STATUS: "STATUS",
  MODAL: "MODAL",
  USER_TYPE: "USER_TYPE",
  SOCKET: "SOCKET",
};

export const EditData = (data, id, post) => {
  const newData = data.map((item) => (item._id === id ? post : item));
  return newData;
};

export const DeleteData = (data, id) => {
  const target = String(id);
  const newData = data.filter((item) => {
    // Support arrays of IDs or arrays of user objects
    const itemId = item && typeof item === 'object' ? String(item._id) : String(item);
    return itemId !== target;
  });
  return newData;
};

